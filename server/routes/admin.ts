import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import type { z } from 'zod'
import {
  ClubInSchema,
  EventInSchema,
  FeedbackUpdateSchema,
  GalleryInSchema,
  HouseInSchema,
  HousePointsInSchema,
  LevelInSchema,
  NewsInSchema,
  PrincipalSettingsSchema,
  SchoolSettingsSchema,
  StreamInSchema,
  TimelineInSchema,
  UserInSchema,
  UserUpdateSchema,
  parseBody,
} from '../schemas.ts'
import {
  audit,
  config,
  decrypt,
  destroyUserSessions,
  encrypt,
  hashPassword,
  passwordProblems,
  requireAdmin,
  requireSuperadmin,
  utcnowStr,
  type AuthedRequest,
} from '../security.ts'
import { store, uniqueSlug } from '../store.ts'
import type { FeedbackRecord, User } from '../types.ts'

export const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'uploads')

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
})

function detectImageExt(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png'
  }
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp'
  }
  return null
}

function crudRouter<T extends { id: number; created_at: string; updated_at: string; slug?: string }>(
  name: string,
  getList: () => T[],
  schema: z.ZodType<Omit<T, 'id' | 'slug' | 'created_at' | 'updated_at'>>,
  sortFn: (a: T, b: T) => number,
  hasSlug = false,
) {
  const r = Router()

  r.get('/', (_req, res) => {
    res.json([...getList()].sort(sortFn))
  })

  r.post('/', (req: AuthedRequest, res) => {
    const parsed = parseBody(schema, req.body)
    if (!parsed.ok) {
      res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
      return
    }
    const ts = utcnowStr()
    const list = getList()
    const data = parsed.data as Record<string, unknown>
    const item: Record<string, unknown> = {
      ...data,
      id: store.nextId(name),
      created_at: ts,
      updated_at: ts,
    }
    if (hasSlug) {
      item.slug = uniqueSlug(list as { id: number; slug: string }[], String(data.title || 'item'))
    }
    const typed = item as unknown as T
    list.push(typed)
    const label = String(data.title || data.name || data.caption || '')
    audit(req, `${name}.create`, `${name}#${typed.id}`, label, req.adminUser)
    res.status(201).json(typed)
  })

  r.put('/:id', (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    const list = getList()
    const obj = list.find((x) => x.id === id)
    if (!obj) {
      res.status(404).json({ detail: 'Not found' })
      return
    }
    const parsed = parseBody(schema, req.body)
    if (!parsed.ok) {
      res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
      return
    }
    const data = parsed.data as Record<string, unknown>
    Object.assign(obj, data, { updated_at: utcnowStr() })
    if (hasSlug) {
      obj.slug = uniqueSlug(list as { id: number; slug: string }[], String(data.title || 'item'), obj.id)
    }
    const label = String(data.title || data.name || data.caption || '')
    audit(req, `${name}.update`, `${name}#${obj.id}`, label, req.adminUser)
    res.json(obj)
  })

  r.delete('/:id', (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    const list = getList()
    const idx = list.findIndex((x) => x.id === id)
    if (idx === -1) {
      res.status(404).json({ detail: 'Not found' })
      return
    }
    const obj = list[idx] as unknown as Record<string, unknown>
    const label = String(obj.title || obj.name || obj.caption || '')
    list.splice(idx, 1)
    audit(req, `${name}.delete`, `${name}#${id}`, label, req.adminUser)
    res.status(204).end()
  })

  return r
}

const router = Router()
router.use(requireAdmin)

router.use(
  '/news',
  crudRouter(
    'news',
    () => store.news,
    NewsInSchema,
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    true,
  ),
)
router.use(
  '/events',
  crudRouter(
    'events',
    () => store.events,
    EventInSchema,
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    true,
  ),
)
router.use(
  '/houses',
  crudRouter('houses', () => store.houses, HouseInSchema, (a, b) => a.position - b.position || a.id - b.id),
)
router.use(
  '/levels',
  crudRouter('levels', () => store.levels, LevelInSchema, (a, b) => a.position - b.position || a.id - b.id),
)
router.use(
  '/streams',
  crudRouter('streams', () => store.streams, StreamInSchema, (a, b) => a.position - b.position || a.id - b.id),
)
router.use(
  '/clubs',
  crudRouter('clubs', () => store.clubs, ClubInSchema, (a, b) => a.position - b.position || a.id - b.id),
)
router.use(
  '/timeline',
  crudRouter('timeline', () => store.timeline, TimelineInSchema, (a, b) => a.position - b.position || a.id - b.id),
)
router.use(
  '/gallery',
  crudRouter('gallery', () => store.gallery, GalleryInSchema, (a, b) => a.position - b.position || a.id - b.id),
)

router.get('/dashboard', (req: AuthedRequest, res) => {
  const today = new Date().toISOString().slice(0, 10)
  res.json({
    news: store.news.length,
    upcoming_events: store.events.filter((e) => e.date >= today).length,
    past_events: store.events.filter((e) => e.date < today).length,
    clubs: store.clubs.length,
    gallery: store.gallery.length,
    feedback_new: store.feedback.filter((f) => f.status === 'new').length,
    feedback_total: store.feedback.length,
    houses: [...store.houses].sort((a, b) => b.points - a.points),
    recent_activity:
      req.adminUser?.role === 'superadmin'
        ? [...store.auditLog].sort((a, b) => b.id - a.id).slice(0, 8)
        : [],
  })
})

router.patch('/houses/:houseId/points', (req: AuthedRequest, res) => {
  const houseId = Number(req.params.houseId)
  const house = store.houses.find((h) => h.id === houseId)
  if (!house) {
    res.status(404).json({ detail: 'Not found' })
    return
  }
  const parsed = parseBody(HousePointsInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const old = house.points
  house.points = parsed.data.points
  house.updated_at = utcnowStr()
  audit(req, 'houses.points', `houses#${house.id}`, `${house.name}: ${old} -> ${parsed.data.points}`, req.adminUser)
  res.json(house)
})

// ---------------------------------------------------------------- settings
router.get('/settings/school', (_req, res) => {
  res.json(store.schoolSettings)
})

router.put('/settings/school', (req: AuthedRequest, res) => {
  const parsed = parseBody(SchoolSettingsSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  store.schoolSettings = parsed.data
  audit(req, 'settings.school', 'school', '', req.adminUser)
  res.json(parsed.data)
})

router.get('/settings/principal', (_req, res) => {
  res.json(store.principalSettings)
})

router.put('/settings/principal', (req: AuthedRequest, res) => {
  const parsed = parseBody(PrincipalSettingsSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  store.principalSettings = parsed.data
  audit(req, 'settings.principal', 'principal', '', req.adminUser)
  res.json(parsed.data)
})

// ----------------------------------------------------------------- uploads
router.post('/upload', uploadMiddleware.single('file'), (req: AuthedRequest, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ detail: 'No file uploaded.' })
    return
  }
  if (!file.buffer || file.buffer.length === 0) {
    res.status(400).json({ detail: 'Empty file.' })
    return
  }
  const ext = detectImageExt(file.buffer)
  if (!ext) {
    res.status(415).json({ detail: 'Only JPG, PNG or WebP images are allowed.' })
    return
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const filename = `${crypto.randomBytes(12).toString('hex')}.${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer)
  const publicPath = `/uploads/${filename}`
  audit(req, 'upload', publicPath, '', req.adminUser)
  res.json({ path: publicPath })
})

// ---------------------------------------------------------------- feedback
function feedbackOut(f: FeedbackRecord) {
  return {
    id: f.id,
    kind: f.kind,
    name: decrypt(f.name_enc),
    email: decrypt(f.email_enc),
    phone: decrypt(f.phone_enc),
    subject: decrypt(f.subject_enc),
    message: decrypt(f.message_enc),
    status: f.status,
    admin_note: decrypt(f.admin_note_enc),
    created_at: f.created_at,
  }
}

router.get('/feedback', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  if (status && !['new', 'read', 'resolved', 'archived'].includes(status)) {
    res.status(422).json({ detail: 'Invalid status filter.' })
    return
  }
  let list = [...store.feedback].sort((a, b) => b.id - a.id)
  if (status) list = list.filter((f) => f.status === status)
  res.json(list.slice(0, 500).map(feedbackOut))
})

router.put('/feedback/:fid', (req: AuthedRequest, res) => {
  const fid = Number(req.params.fid)
  const f = store.feedback.find((x) => x.id === fid)
  if (!f) {
    res.status(404).json({ detail: 'Not found' })
    return
  }
  const parsed = parseBody(FeedbackUpdateSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  f.status = parsed.data.status
  f.admin_note_enc = encrypt(parsed.data.admin_note)
  audit(req, 'feedback.update', `feedback#${fid}`, parsed.data.status, req.adminUser)
  res.json(feedbackOut(f))
})

router.delete('/feedback/:fid', requireSuperadmin, (req: AuthedRequest, res) => {
  const fid = Number(req.params.fid)
  const idx = store.feedback.findIndex((x) => x.id === fid)
  if (idx === -1) {
    res.status(404).json({ detail: 'Not found' })
    return
  }
  store.feedback.splice(idx, 1)
  audit(req, 'feedback.delete', `feedback#${fid}`, '', req.adminUser)
  res.status(204).end()
})

// ------------------------------------------------------------------- users
function userOut(u: User) {
  return {
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    totp_enabled: u.totp_enabled,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  }
}

router.get('/users', requireSuperadmin, (_req, res) => {
  res.json([...store.users].sort((a, b) => a.id - b.id).map(userOut))
})

router.post('/users', requireSuperadmin, (req: AuthedRequest, res) => {
  const parsed = parseBody(UserInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const payload = parsed.data
  if (store.users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
    res.status(409).json({ detail: 'That username is taken.' })
    return
  }
  const problem = passwordProblems(payload.password, payload.username)
  if (problem) {
    res.status(400).json({ detail: problem })
    return
  }
  const ts = utcnowStr()
  const u: User = {
    id: store.nextId('users'),
    username: payload.username,
    full_name: payload.full_name,
    role: payload.role,
    password_hash: hashPassword(payload.password),
    is_active: true,
    totp_secret_enc: null,
    totp_enabled: false,
    failed_logins: 0,
    locked_until: null,
    last_login_at: null,
    must_change_password: true,
    created_at: ts,
    updated_at: ts,
  }
  store.users.push(u)
  audit(req, 'users.create', `user#${u.id}`, `${u.username} (${u.role})`, req.adminUser)
  res.status(201).json(userOut(u))
})

router.put('/users/:uid', requireSuperadmin, (req: AuthedRequest, res) => {
  const uid = Number(req.params.uid)
  const u = store.users.find((x) => x.id === uid)
  if (!u) {
    res.status(404).json({ detail: 'Not found' })
    return
  }
  const parsed = parseBody(UserUpdateSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const payload = parsed.data
  if (u.id === req.adminUser!.id && (payload.role !== 'superadmin' || !payload.is_active)) {
    res.status(400).json({ detail: 'You cannot demote or disable your own account.' })
    return
  }
  u.full_name = payload.full_name
  u.role = payload.role
  u.is_active = payload.is_active
  u.updated_at = utcnowStr()
  if (payload.reset_password) {
    const problem = passwordProblems(payload.reset_password, u.username)
    if (problem) {
      res.status(400).json({ detail: problem })
      return
    }
    u.password_hash = hashPassword(payload.reset_password)
    u.must_change_password = true
    u.locked_until = null
    u.failed_logins = 0
  }
  if (payload.reset_password || !payload.is_active) {
    destroyUserSessions(u.id)
  }
  audit(
    req,
    'users.update',
    `user#${u.id}`,
    `role=${u.role} active=${u.is_active} reset=${payload.reset_password ? 'yes' : 'no'}`,
    req.adminUser,
  )
  res.json(userOut(u))
})

router.post('/users/:uid/reset-2fa', requireSuperadmin, (req: AuthedRequest, res) => {
  const uid = Number(req.params.uid)
  const u = store.users.find((x) => x.id === uid)
  if (!u) {
    res.status(404).json({ detail: 'Not found' })
    return
  }
  u.totp_enabled = false
  u.totp_secret_enc = null
  u.updated_at = utcnowStr()
  destroyUserSessions(u.id)
  audit(req, 'users.reset_2fa', `user#${u.id}`, u.username, req.adminUser)
  res.status(204).end()
})

router.get('/audit', requireSuperadmin, (_req, res) => {
  res.json([...store.auditLog].sort((a, b) => b.id - a.id).slice(0, 300))
})

export default router
