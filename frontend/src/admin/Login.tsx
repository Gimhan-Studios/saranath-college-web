import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth, type Me } from './auth'

export default function Login() {
  const { setMe } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [needOtp, setNeedOtp] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      setMe(await api<Me>('/api/auth/login', { method: 'POST', body: { username, password, otp: needOtp ? otp : undefined } }))
    } catch (ex) {
      if (ex instanceof ApiError && ex.message === 'otp_required') { setNeedOtp(true); setErr('') }
      else setErr(ex instanceof ApiError ? ex.message : 'Could not reach the server.')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <img src="/media/seed/hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900/80 to-navy-700/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3"><img src="/media/seed/crest-transparent.webp" alt="" className="h-14" /><div className="font-serif text-2xl font-bold">Saranath College</div></div>
          <div>
            <div className="font-sinhala text-4xl text-gold-300">පඤ්ඤා නරානං රතනං</div>
            <p className="mt-4 max-w-md text-white/70">Administration portal. Only authorised staff may sign in. All activity is recorded.</p>
          </div>
        </div>
      </div>
      <div className="grid place-items-center bg-paper p-6">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><img src="/media/seed/crest-transparent.webp" alt="" className="h-16" /></div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-gold-400"><Lock className="h-5 w-5" /></div>
          <h1 className="mt-5 font-serif text-4xl font-semibold text-navy-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">{needOtp ? 'Enter the 6-digit code from your authenticator app.' : 'Use the account given to you by the site administrator.'}</p>
          <div className="mt-8 space-y-4">
            {!needOtp ? (
              <>
                <div><label className="label" htmlFor="u">Username</label><input id="u" className="field" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus maxLength={64} /></div>
                <div>
                  <label className="label" htmlFor="p">Password</label>
                  <div className="relative"><input id="p" type={show ? 'text' : 'password'} className="field pr-12" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                </div>
              </>
            ) : (
              <div><label className="label" htmlFor="otp">Authentication code</label><input id="otp" className="field text-center font-mono text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus required /></div>
            )}
            {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200" role="alert">{err}</p>}
            <button className="btn-navy w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            {needOtp && <button type="button" className="w-full text-sm text-muted" onClick={() => { setNeedOtp(false); setOtp('') }}>Back</button>}
          </div>
          <p className="mt-8 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-emerald-600" />Protected by account lockout, encrypted sessions and optional two-step sign-in.</p>
        </motion.form>
      </div>
    </div>
  )
}
