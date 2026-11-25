import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Clock, Lock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Facebook } from '../components/BrandIcons'
import PageHero from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { useSettings } from '../lib/hooks'
import { api, ApiError } from '../lib/api'

const KINDS = [
  ['comment', 'Comment'],
  ['feedback', 'Feedback'],
  ['suggestion', 'Suggestion'],
  ['complaint', 'Complaint'],
] as const

export default function Contact() {
  const { data } = useSettings()
  const s = data?.school
  const { hash } = useLocation()
  const [kind, setKind] = useState<string>('feedback')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})

  useEffect(() => { if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 300) }, [hash])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setFieldErr({})
    if (form.message.trim().length < 10) { setFieldErr({ message: 'Please write at least 10 characters.' }); return }
    setBusy(true)
    try {
      await api('/api/public/feedback', { method: 'POST', body: { kind, ...form, email: form.email || null } })
      setDone(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '', website: '' })
    } catch (ex) {
      if (ex instanceof ApiError) { setErr(ex.message); setFieldErr(ex.fields) } else setErr('Could not send. Please check your connection.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHero eyebrow="Get in touch" title="Contact & Feedback" lead="Visit us, call the office, or send the school a private message." image={s?.hero_image} />
      <section className="bg-paper py-20">
        <div className="wrap grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Reveal className="card p-7">
              <h2 className="font-serif text-3xl font-semibold text-navy-900">{s?.name}</h2>
              <ul className="mt-6 space-y-5 text-sm">
                {s?.address && <li className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400"><MapPin className="h-4 w-4" /></span><div><b className="block text-navy-900">Address</b><span className="text-muted">{s.address}</span></div></li>}
                {s?.phone && <li className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400"><Phone className="h-4 w-4" /></span><div><b className="block text-navy-900">Phone</b><a className="text-muted hover:text-navy-900" href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></div></li>}
                {s?.email && <li className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400"><Mail className="h-4 w-4" /></span><div><b className="block text-navy-900">Email</b><a className="text-muted hover:text-navy-900" href={`mailto:${s.email}`}>{s.email}</a></div></li>}
                {s?.office_hours && <li className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400"><Clock className="h-4 w-4" /></span><div><b className="block text-navy-900">Office hours</b><span className="text-muted">{s.office_hours}</span></div></li>}
                {s?.facebook && <li className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-400"><Facebook className="h-4 w-4" /></span><div><b className="block text-navy-900">Facebook</b><a className="text-muted hover:text-navy-900" href={s.facebook} target="_blank" rel="noopener noreferrer">Follow the College</a></div></li>}
              </ul>
            </Reveal>
            {s?.map_embed_query && (
              <Reveal delay={0.1} className="overflow-hidden rounded-2xl ring-1 ring-line">
                <iframe
                  title="Map to Saranath College"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(s.map_embed_query)}&output=embed`}
                  className="h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </Reveal>
            )}
          </div>

          <Reveal delay={0.1} id="feedback" className="card scroll-mt-28 p-7 sm:p-10">
            <div className="eyebrow">Comments & Feedback</div>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-navy-900">What would you like the school to know?</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />Your message is encrypted and sent privately to the school administration. It is never published on the website.</p>

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                  <h3 className="mt-4 font-serif text-3xl font-semibold text-navy-900">Thank you</h3>
                  <p className="mt-2 text-muted">Your message has reached the school. If you left contact details, someone may get back to you.</p>
                  <button className="btn-outline mt-6" onClick={() => setDone(false)}>Send another message</button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="mt-8 space-y-5" noValidate>
                  <fieldset>
                    <legend className="label">Type of message</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {KINDS.map(([v, l]) => (
                        <label key={v} className={`cursor-pointer rounded-xl px-3 py-2.5 text-center text-sm font-semibold ring-1 transition ${kind === v ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-900 ring-line hover:ring-navy-600/40'}`}>
                          <input type="radio" name="kind" value={v} checked={kind === v} onChange={() => setKind(v)} className="sr-only" />{l}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><label className="label" htmlFor="f-name">Name <span className="text-muted">(optional)</span></label><input id="f-name" className="field" maxLength={120} value={form.name} onChange={set('name')} autoComplete="name" /></div>
                    <div><label className="label" htmlFor="f-phone">Phone <span className="text-muted">(optional)</span></label><input id="f-phone" className="field" maxLength={20} value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />{fieldErr.phone && <p className="mt-1 text-xs text-red-600">Use numbers only.</p>}</div>
                  </div>
                  <div><label className="label" htmlFor="f-email">Email <span className="text-muted">(optional)</span></label><input id="f-email" type="email" className="field" maxLength={254} value={form.email} onChange={set('email')} autoComplete="email" />{fieldErr.email && <p className="mt-1 text-xs text-red-600">Please enter a valid email.</p>}</div>
                  <div><label className="label" htmlFor="f-subject">Subject <span className="text-muted">(optional)</span></label><input id="f-subject" className="field" maxLength={160} value={form.subject} onChange={set('subject')} /></div>
                  <div>
                    <label className="label" htmlFor="f-message">Message</label>
                    <textarea id="f-message" rows={6} className="field resize-y" maxLength={4000} value={form.message} onChange={set('message')} required />
                    <div className="mt-1 flex justify-between text-xs"><span className="text-red-600">{fieldErr.message}</span><span className="text-muted">{form.message.length}/4000</span></div>
                  </div>
                  {/* honeypot: hidden from people, bots fill it */}
                  <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label></div>
                  {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{err}</p>}
                  <button type="submit" disabled={busy} className="btn-navy w-full py-3.5 sm:w-auto">{busy ? 'Sending…' : <>Send privately <Send className="h-4 w-4" /></>}</button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </section>
    </>
  )
}
