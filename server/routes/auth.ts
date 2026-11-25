import { Router } from 'express'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import {
  ChangePasswordInSchema,
  LoginInSchema,
  TotpConfirmInSchema,
  TotpDisableInSchema,
  parseBody,
} from '../schemas.ts'
import {
  audit,
  clearSessionCookie,
  clientIp,
  config,
  createSession,
  decrypt,
  destroySession,
  destroyUserSessions,
  encrypt,
  hashPassword,
  ipFingerprint,
  lockRemaining,
  passwordProblems,
  rateCount,
  rateHit,
  requireAdmin,
  utcnowStr,
  verifyPassword,
  type AuthedRequest,
} from '../security.ts'
import { store } from '../store.ts'
import type { User } from '../types.ts'

const router = Router()
const GENERIC_FAIL = 'Incorrect username or password.'

function meOut(user: User, csrf: string) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    totp_enabled: user.totp_enabled,
    must_change_password: user.must_change_password,
    csrf_token: csrf,
  }
}

function makeTotp(secretBase32: string, username: string) {
  return new OTPAuth.TOTP({
    issuer: 'Saranath College Admin',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
}

router.post('/login', (req, res) => {
  const parsed = parseBody(LoginInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const payload = parsed.data
  const ipBucket = 'login-ip:' + ipFingerprint(clientIp(req))
  const windowMs = config.loginLockoutMinutes * 60_000
  if (rateCount(ipBucket, windowMs) >= config.loginIpMaxAttempts) {
    res.status(429).json({ detail: 'Too many sign-in attempts from this network. Try again later.' })
    return
  }

  const user = store.users.find((u) => u.username === payload.username)
  if (user) {
    const mins = lockRemaining(user)
    if (mins !== null) {
      rateHit(ipBucket)
      res.status(429).json({ detail: `This account is temporarily locked. Try again in ${mins} minutes.` })
      return
    }
  }

  const ok = verifyPassword(payload.password, user?.password_hash)
  if (!ok || !user || !user.is_active) {
    rateHit(ipBucket)
    if (user) {
      user.failed_logins += 1
      if (user.failed_logins >= config.loginMaxAttempts) {
        user.locked_until = Date.now() + windowMs
        user.failed_logins = 0
        audit(req, 'auth.locked', `user#${user.id}`, 'Too many failed attempts', user)
      }
    }
    audit(req, 'auth.failed', payload.username.slice(0, 64), '', null)
    res.status(401).json({ detail: GENERIC_FAIL })
    return
  }

  if (user.totp_enabled) {
    if (!payload.otp) {
      res.status(401).json({ detail: 'otp_required' })
      return
    }
    const totp = makeTotp(decrypt(user.totp_secret_enc || ''), user.username)
    const delta = totp.validate({ token: payload.otp, window: 1 })
    if (delta === null) {
      rateHit(ipBucket)
      user.failed_logins += 1
      if (user.failed_logins >= config.loginMaxAttempts) {
        user.locked_until = Date.now() + windowMs
        user.failed_logins = 0
      }
      audit(req, 'auth.failed_otp', `user#${user.id}`, '', user)
      res.status(401).json({ detail: 'Incorrect 6-digit code.' })
      return
    }
  }

  user.failed_logins = 0
  user.locked_until = null
  user.last_login_at = utcnowStr()
  const sess = createSession(user, req, res)
  audit(req, 'auth.login', `user#${user.id}`, '', user)
  res.json(meOut(user, sess.csrf_token))
})

router.post('/logout', (req, res) => {
  destroySession(req)
  clearSessionCookie(req, res)
  res.status(204).end()
})

router.get('/me', requireAdmin, (req: AuthedRequest, res) => {
  res.json(meOut(req.adminUser!, req.adminSession!.csrf_token))
})

router.post('/change-password', requireAdmin, (req: AuthedRequest, res) => {
  const parsed = parseBody(ChangePasswordInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const user = req.adminUser!
  const payload = parsed.data
  if (!verifyPassword(payload.current_password, user.password_hash)) {
    res.status(400).json({ detail: 'Current password is incorrect.' })
    return
  }
  const problem = passwordProblems(payload.new_password, user.username)
  if (problem) {
    res.status(400).json({ detail: problem })
    return
  }
  if (verifyPassword(payload.new_password, user.password_hash)) {
    res.status(400).json({ detail: 'New password must be different.' })
    return
  }
  user.password_hash = hashPassword(payload.new_password)
  user.must_change_password = false
  user.updated_at = utcnowStr()
  destroyUserSessions(user.id, req.adminSession!.id)
  audit(req, 'auth.password_changed', `user#${user.id}`, '', user)
  res.status(204).end()
})

router.post('/2fa/setup', requireAdmin, async (req: AuthedRequest, res) => {
  const user = req.adminUser!
  if (user.totp_enabled) {
    res.status(400).json({ detail: 'Two-factor sign-in is already on.' })
    return
  }
  const secret = new OTPAuth.Secret({ size: 20 }).base32
  user.totp_secret_enc = encrypt(secret)
  const uri = makeTotp(secret, user.username).toString()
  const svg = await QRCode.toString(uri, { type: 'svg', margin: 2, width: 200 })
  const svgB64 = Buffer.from(svg, 'utf8').toString('base64')
  res.json({ secret, qr_svg_data_url: `data:image/svg+xml;base64,${svgB64}` })
})

router.post('/2fa/confirm', requireAdmin, (req: AuthedRequest, res) => {
  const parsed = parseBody(TotpConfirmInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const user = req.adminUser!
  if (!user.totp_secret_enc) {
    res.status(400).json({ detail: 'Start the setup first.' })
    return
  }
  const delta = makeTotp(decrypt(user.totp_secret_enc), user.username).validate({
    token: parsed.data.otp,
    window: 1,
  })
  if (delta === null) {
    res.status(400).json({ detail: "That code did not match. Check your phone's time and try again." })
    return
  }
  user.totp_enabled = true
  user.updated_at = utcnowStr()
  audit(req, 'auth.2fa_enabled', `user#${user.id}`, '', user)
  res.status(204).end()
})

router.post('/2fa/disable', requireAdmin, (req: AuthedRequest, res) => {
  const parsed = parseBody(TotpDisableInSchema, req.body)
  if (!parsed.ok) {
    res.status(422).json({ detail: 'Please check the highlighted fields.', errors: parsed.errors })
    return
  }
  const user = req.adminUser!
  if (!verifyPassword(parsed.data.password, user.password_hash)) {
    res.status(400).json({ detail: 'Password is incorrect.' })
    return
  }
  user.totp_enabled = false
  user.totp_secret_enc = null
  user.updated_at = utcnowStr()
  audit(req, 'auth.2fa_disabled', `user#${user.id}`, '', user)
  res.status(204).end()
})

export default router
