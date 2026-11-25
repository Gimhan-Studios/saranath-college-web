import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { NextFunction, Request, Response } from 'express'
import { store } from './store.ts'
import type { AdminSession, User } from './types.ts'

export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  secretKey: process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex'),
  dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || '',
  sessionCookieName: 'sc_session',
  sessionIdleMinutes: 30,
  sessionAbsoluteHours: 8,
  loginMaxAttempts: 5,
  loginLockoutMinutes: 15,
  loginIpMaxAttempts: 20,
  feedbackMaxPerHour: 5,
  maxUploadMb: 6,
}

export function utcnowStr(): string {
  return new Date().toISOString().replace('Z', '')
}

// --------------------------------------------------------------- passwords
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-' + crypto.randomBytes(8).toString('hex'), 10)

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '123456789012',
  'qwertyuiop12',
  'saranath1882',
  'saranathcollege',
  'admin12345678',
  'letmein12345',
  'iloveyou1234',
  'kuliyapitiya1',
])

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export function verifyPassword(password: string, passwordHash: string | null | undefined): boolean {
  try {
    const ok = bcrypt.compareSync(password, passwordHash || DUMMY_HASH)
    return ok && Boolean(passwordHash)
  } catch {
    return false
  }
}

export function passwordProblems(password: string, username = ''): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters.'
  if (password.length > 128) return 'Password is too long.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain letters and numbers.'
  }
  if (!/[^A-Za-z0-9]/.test(password) && !(/[a-z]/.test(password) && /[A-Z]/.test(password))) {
    return 'Use upper and lower case letters, or add a symbol.'
  }
  const low = password.toLowerCase()
  if (COMMON_PASSWORDS.has(low) || (username && low.includes(username.toLowerCase()))) {
    return 'Password is too easy to guess.'
  }
  return null
}

// ------------------------------------------------------------------ crypto
function encryptionKey(): Buffer {
  const raw = config.dataEncryptionKey || config.secretKey
  return crypto.createHash('sha256').update(raw).digest()
}

export function encrypt(text: string): string {
  if (!text) return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

export function decrypt(token: string): string {
  if (!token) return ''
  try {
    const buf = Buffer.from(token, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return '[unreadable: encryption key changed]'
  }
}

// --------------------------------------------------------------- client ip
export function clientIp(req: Request): string {
  return req.socket?.remoteAddress || req.ip || 'unknown'
}

export function ipFingerprint(ip: string): string {
  return crypto.createHmac('sha256', config.secretKey).update(ip).digest('hex').slice(0, 24)
}

// ------------------------------------------------------------- rate limits
export function rateCount(bucket: string, windowMs: number): number {
  const since = Date.now() - windowMs
  let count = 0
  for (const ev of store.rateEvents) {
    if (ev.bucket === bucket && ev.created_at >= since) count++
  }
  return count
}

export function rateHit(bucket: string): void {
  store.rateEvents.push({ bucket, created_at: Date.now() })
}

export function rateCleanup(): void {
  const cutoff = Date.now() - 2 * 24 * 3600 * 1000
  store.rateEvents = store.rateEvents.filter((ev) => ev.created_at >= cutoff)
}

// ---------------------------------------------------------------- sessions
function tokenId(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function isHttpsRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https'
}

export function createSession(user: User, req: Request, res: Response): AdminSession {
  const token = crypto.randomBytes(32).toString('base64url')
  const nowMs = Date.now()
  const sess: AdminSession = {
    id: tokenId(token),
    user_id: user.id,
    csrf_token: crypto.randomBytes(32).toString('base64url'),
    created_at: nowMs,
    last_seen_at: nowMs,
    ip: clientIp(req).slice(0, 64),
    user_agent: String(req.headers['user-agent'] || '').slice(0, 255),
  }
  store.sessions.set(sess.id, sess)

  const secure = config.isProduction || isHttpsRequest(req)
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/api',
    maxAge: config.sessionAbsoluteHours * 3600 * 1000,
  })
  return sess
}

export function clearSessionCookie(req: Request, res: Response): void {
  const secure = config.isProduction || isHttpsRequest(req)
  res.clearCookie(config.sessionCookieName, {
    path: '/api',
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
  })
}

export function destroySession(req: Request): void {
  const token = req.cookies?.[config.sessionCookieName]
  if (typeof token === 'string' && token) {
    store.sessions.delete(tokenId(token))
  }
}

export function destroyUserSessions(userId: number, keepSessionId?: string): void {
  for (const [id, sess] of store.sessions.entries()) {
    if (sess.user_id === userId && id !== keepSessionId) {
      store.sessions.delete(id)
    }
  }
}

export interface AuthedRequest extends Request {
  adminUser?: User
  adminSession?: AdminSession
}

function loadSession(req: Request): { user: User; session: AdminSession } | null {
  const token = req.cookies?.[config.sessionCookieName]
  if (typeof token !== 'string' || !token || token.length > 100) return null
  const id = tokenId(token)
  const sess = store.sessions.get(id)
  if (!sess) return null
  const nowMs = Date.now()
  if (
    nowMs - sess.last_seen_at > config.sessionIdleMinutes * 60_000 ||
    nowMs - sess.created_at > config.sessionAbsoluteHours * 3600_000
  ) {
    store.sessions.delete(id)
    return null
  }
  const user = store.users.find((u) => u.id === sess.user_id)
  if (!user || !user.is_active) {
    store.sessions.delete(id)
    return null
  }
  if (nowMs - sess.last_seen_at > 60_000) {
    sess.last_seen_at = nowMs
  }
  return { user, session: sess }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const current = loadSession(req)
  if (!current) {
    res.status(401).json({ detail: 'Not signed in' })
    return
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const sent = String(req.headers['x-csrf-token'] || '')
    if (!sent || !safeEqual(sent, current.session.csrf_token)) {
      res.status(403).json({ detail: 'Security token missing or invalid. Please reload the page.' })
      return
    }
  }
  if (current.user.must_change_password && !req.originalUrl.startsWith('/api/auth/')) {
    res.status(403).json({ detail: 'Please change your password first.' })
    return
  }
  req.adminUser = current.user
  req.adminSession = current.session
  next()
}

export function requireSuperadmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  requireAdmin(req, res, () => {
    if (req.adminUser?.role !== 'superadmin') {
      res.status(403).json({ detail: 'Only a super admin can do this.' })
      return
    }
    next()
  })
}

export function audit(req: Request, action: string, target = '', detail = '', user?: User | null): void {
  store.auditLog.push({
    id: store.nextId('audit'),
    user_id: user ? user.id : null,
    username: user ? user.username : '',
    action: action.slice(0, 64),
    target: target.slice(0, 120),
    detail: detail.slice(0, 500),
    ip: clientIp(req).slice(0, 64),
    created_at: utcnowStr(),
  })
}

export function lockRemaining(user: User): number | null {
  if (user.locked_until && user.locked_until > Date.now()) {
    return Math.floor((user.locked_until - Date.now()) / 60_000) + 1
  }
  return null
}
