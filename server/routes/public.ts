import { Router } from 'express'
import { FeedbackInSchema, parseBody } from '../schemas.ts'
import { clientIp, config, encrypt, ipFingerprint, rateCleanup, rateCount, rateHit, utcnowStr } from '../security.ts'
import { store } from '../store.ts'

const router = Router()

function cache(res: import('express').Response, seconds = 60) {
  res.setHeader('Cache-Control', `public, max-age=${seconds}`)
}

router.get('/settings', (_req, res) => {
  cache(res)
  res.json({
    school: store.schoolSettings,
    principal: store.principalSettings,
  })
})

router.get('/news', (_req, res) => {
  cache(res)
  const items = store.news
    .filter((n) => n.published)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  res.json(items)
})

router.get('/news/:slug', (req, res) => {
  const slug = req.params.slug.slice(0, 140)
  const item = store.news.find((n) => n.slug === slug && n.published)
  if (!item) {
    res.status(404).json({ detail: 'Story not found' })
    return
  }
  cache(res)
  res.json(item)
})

router.get('/events', (_req, res) => {
  cache(res)
  const items = store.events
    .filter((e) => e.published)
    .sort((a, b) => a.date.localeCompare(b.date))
  res.json(items)
})

router.get('/events/:slug', (req, res) => {
  const slug = req.params.slug.slice(0, 140)
  const item = store.events.find((e) => e.slug === slug && e.published)
  if (!item) {
    res.status(404).json({ detail: 'Event not found' })
    return
  }
  cache(res)
  res.json(item)
})

router.get('/houses', (_req, res) => {
  cache(res, 30)
  const items = [...store.houses].sort((a, b) => a.position - b.position || a.id - b.id)
  res.json(items)
})

router.get('/academics', (_req, res) => {
  cache(res)
  const levels = [...store.levels].sort((a, b) => a.position - b.position || a.id - b.id)
  const streams = [...store.streams].sort((a, b) => a.position - b.position || a.id - b.id)
  res.json({ levels, streams })
})

router.get('/clubs', (_req, res) => {
  cache(res)
  const items = [...store.clubs].sort((a, b) => a.position - b.position || a.id - b.id)
  res.json(items)
})

router.get('/timeline', (_req, res) => {
  cache(res)
  const items = [...store.timeline].sort((a, b) => a.position - b.position || a.id - b.id)
  res.json(items)
})

router.get('/gallery', (_req, res) => {
  cache(res)
  const items = [...store.gallery].sort((a, b) => a.position - b.position || a.id - b.id)
  res.json(items)
})

router.post('/feedback', (req, res) => {
  const parsed = parseBody(FeedbackInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const bucket = 'feedback:' + ipFingerprint(clientIp(req))
  if (rateCount(bucket, 3600_000) >= config.feedbackMaxPerHour) {
    res.status(429).json({ detail: 'You have sent several messages recently. Please try again later.' })
    return
  }
  rateHit(bucket)
  const payload = parsed.data
  if (payload.website) {
    res.status(202).json({ ok: true })
    return
  }
  store.feedback.push({
    id: store.nextId('feedback'),
    kind: payload.kind,
    name_enc: encrypt(payload.name),
    email_enc: encrypt(payload.email || ''),
    phone_enc: encrypt(payload.phone),
    subject_enc: encrypt(payload.subject),
    message_enc: encrypt(payload.message),
    status: 'new',
    admin_note_enc: '',
    created_at: utcnowStr(),
  })
  rateCleanup()
  res.status(202).json({ ok: true })
})

export default router
