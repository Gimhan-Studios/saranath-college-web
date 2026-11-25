import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lock, Mail, Phone } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from './auth'
import { ConfirmDelete, PageTitle, toast } from './ui'

interface FB { id: number; kind: string; name: string; email: string; phone: string; subject: string; message: string; status: string; admin_note: string; created_at: string }
const STATUS = ['new', 'read', 'resolved', 'archived']
const kindColor: Record<string, string> = { complaint: 'bg-red-50 text-red-700', suggestion: 'bg-blue-50 text-blue-700', feedback: 'bg-emerald-50 text-emerald-700', comment: 'bg-paper text-navy-900' }

export default function FeedbackInbox() {
  const { me } = useAuth()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const { data } = useQuery<FB[]>({ queryKey: ['admin', 'feedback', filter], queryFn: () => api(`/api/admin/feedback${filter ? `?status=${filter}` : ''}`) })
  const [sel, setSel] = useState<FB | null>(null)
  const [note, setNote] = useState('')

  async function update(f: FB, status: string, admin_note = f.admin_note) {
    try {
      const r = await api<FB>(`/api/admin/feedback/${f.id}`, { method: 'PUT', body: { status, admin_note } })
      setSel(r); qc.invalidateQueries({ queryKey: ['admin', 'feedback'] }); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Update failed', 'err') }
  }
  const open = (f: FB) => { setSel(f); setNote(f.admin_note); if (f.status === 'new') update(f, 'read') }

  return (
    <div>
      <PageTitle title="Comments & Feedback" sub="Private messages from the public. Stored encrypted; only signed-in admins can read them." />
      <div className="-mx-4 mb-4 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
        {['', ...STATUS].map((s) => <button key={s} onClick={() => setFilter(s)} className={`chip min-h-[40px] shrink-0 px-4 py-2 capitalize ${filter === s ? 'bg-navy-900 text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{s || 'All'}</button>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className={`card max-h-[70vh] divide-y divide-line overflow-y-auto ${sel ? 'hidden lg:block' : 'block'}`}>
          {data?.length === 0 && <p className="p-8 text-center text-sm text-muted">No messages.</p>}
          {data?.map((f) => (
            <button key={f.id} onClick={() => open(f)} className={`block min-h-[72px] w-full p-4 text-left transition hover:bg-paper ${sel?.id === f.id ? 'bg-paper' : ''}`}>
              <div className="flex items-center gap-2">
                {f.status === 'new' && <span className="h-2 w-2 rounded-full bg-gold-500" />}
                <span className={`chip capitalize ${kindColor[f.kind]}`}>{f.kind}</span>
                <span className="ml-auto text-xs text-muted tabular-nums">{new Date(f.created_at + 'Z').toLocaleDateString()}</span>
              </div>
              <div className={`mt-2 truncate text-sm ${f.status === 'new' ? 'font-semibold text-navy-900' : 'text-navy-900/80'}`}>{f.subject || f.message.slice(0, 60)}</div>
              <div className="truncate text-xs text-muted">{f.name || 'Anonymous'}</div>
            </button>
          ))}
        </div>
        <div className={`card min-h-[50vh] p-5 sm:p-6 ${sel ? 'block' : 'hidden lg:block'}`}>
          {!sel ? <div className="grid h-full place-items-center text-center text-sm text-muted"><div><Lock className="mx-auto mb-3 h-8 w-8 text-gold-600" />Select a message to read it.</div></div> : (
            <div>
              <button type="button" onClick={() => setSel(null)} className="mb-4 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-navy-700 lg:hidden">
                <ArrowLeft className="h-4 w-4" />Back to inbox
              </button>
              <div className="flex flex-wrap items-center gap-2"><span className={`chip capitalize ${kindColor[sel.kind]}`}>{sel.kind}</span><span className="text-xs text-muted tabular-nums">{new Date(sel.created_at + 'Z').toLocaleString()}</span></div>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">{sel.subject || '(no subject)'}</h2>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                <span>{sel.name || 'Anonymous'}</span>
                {sel.email && <a href={`mailto:${sel.email}`} className="inline-flex min-h-[36px] items-center gap-1 hover:text-navy-900"><Mail className="h-4 w-4" />{sel.email}</a>}
                {sel.phone && <a href={`tel:${sel.phone}`} className="inline-flex min-h-[36px] items-center gap-1 hover:text-navy-900"><Phone className="h-4 w-4" />{sel.phone}</a>}
              </div>
              <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-paper p-4 leading-7 text-navy-900 sm:mt-6 sm:p-5">{sel.message}</p>
              <label className="label mt-5 sm:mt-6" htmlFor="note">Internal note (only admins see this)</label>
              <textarea id="note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select className="field w-auto" value={sel.status} onChange={(e) => update(sel, e.target.value, note)}>{STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
                <button className="btn-navy" onClick={() => { update(sel, sel.status, note); toast('Note saved') }}>Save note</button>
                {me?.role === 'superadmin' && <span className="ml-auto"><ConfirmDelete label="message" onConfirm={async () => { await api(`/api/admin/feedback/${sel.id}`, { method: 'DELETE' }); setSel(null); qc.invalidateQueries({ queryKey: ['admin', 'feedback'] }); toast('Deleted') }} /></span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
