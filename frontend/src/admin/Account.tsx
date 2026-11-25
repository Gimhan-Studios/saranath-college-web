import { useState, type FormEvent } from 'react'
import { ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from './auth'
import { PageTitle, toast } from './ui'

function PasswordForm({ onDone }: { onDone?: () => void }) {
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (pw !== pw2) { setErr('The new passwords do not match.'); return }
    setBusy(true)
    try { await api('/api/auth/change-password', { method: 'POST', body: { current_password: cur, new_password: pw } }); toast('Password changed'); setCur(''); setPw(''); setPw2(''); onDone?.() }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : 'Failed') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="cp">Current password</label><input id="cp" type="password" className="field" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required /></div>
      <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" className="field" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={12} /><p className="mt-1 text-xs text-muted">At least 12 characters, with letters and numbers. A short sentence works well.</p></div>
      <div><label className="label" htmlFor="np2">Repeat new password</label><input id="np2" type="password" className="field" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
      <button className="btn-navy" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  )
}

export function ForceChangePassword() {
  const { refresh, logout } = useAuth()
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-serif text-3xl font-semibold text-navy-900">Choose a new password</h1>
        <p className="mb-6 mt-2 text-sm text-muted">Your account was set up with a temporary password. Please choose your own before continuing.</p>
        <PasswordForm onDone={refresh} />
        <button onClick={logout} className="mt-4 text-sm text-muted">Sign out</button>
      </div>
    </div>
  )
}

export default function Account() {
  const { me, refresh } = useAuth()
  const [setup, setSetup] = useState<{ secret: string; qr_svg_data_url: string } | null>(null)
  const [otp, setOtp] = useState('')
  const [pw, setPw] = useState('')

  async function start() { try { setSetup(await api('/api/auth/2fa/setup', { method: 'POST' })) } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed', 'err') } }
  async function confirm(e: FormEvent) { e.preventDefault(); try { await api('/api/auth/2fa/confirm', { method: 'POST', body: { otp } }); toast('Two-step sign-in is on'); setSetup(null); setOtp(''); refresh() } catch (ex) { toast(ex instanceof ApiError ? ex.message : 'Failed', 'err') } }
  async function disable(e: FormEvent) { e.preventDefault(); try { await api('/api/auth/2fa/disable', { method: 'POST', body: { password: pw } }); toast('Two-step sign-in turned off'); setPw(''); refresh() } catch (ex) { toast(ex instanceof ApiError ? ex.message : 'Failed', 'err') } }

  return (
    <div>
      <PageTitle title="My Account" sub={`Signed in as @${me?.username}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6"><h2 className="mb-4 font-semibold text-navy-900">Change password</h2><PasswordForm /></div>
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900"><Smartphone className="h-5 w-5 text-gold-600" />Two-step sign-in</h2>
          <p className="mt-2 text-sm text-muted">Adds a 6-digit code from an app like Google Authenticator or Microsoft Authenticator. Even if someone learns your password, they cannot sign in without your phone. Strongly recommended for every admin.</p>
          {me?.totp_enabled ? (
            <form onSubmit={disable} className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck className="h-5 w-5" />Two-step sign-in is ON</div>
              <input type="password" className="field" placeholder="Enter your password to turn it off" value={pw} onChange={(e) => setPw(e.target.value)} required />
              <button className="btn-outline text-red-600"><ShieldOff className="h-4 w-4" />Turn off</button>
            </form>
          ) : setup ? (
            <form onSubmit={confirm} className="mt-5 space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted"><li>Open your authenticator app and scan this code.</li><li>Type the 6-digit code it shows.</li></ol>
              <img src={setup.qr_svg_data_url} alt="QR code for authenticator app" className="h-48 w-48 rounded-xl bg-white p-2 ring-1 ring-line" />
              <p className="text-xs text-muted">Can't scan? Enter this key: <code className="break-all rounded bg-paper px-1.5 py-0.5">{setup.secret}</code></p>
              <input className="field text-center font-mono text-xl tracking-[0.4em]" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" required />
              <button className="btn-navy">Confirm and turn on</button>
            </form>
          ) : <button className="btn-navy mt-5" onClick={start}><ShieldCheck className="h-4 w-4" />Set up two-step sign-in</button>}
        </div>
      </div>
    </div>
  )
}
