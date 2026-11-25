import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, ImagePlus, Loader2, Plus, Trash2, X, AlertTriangle } from 'lucide-react'
import { api, ApiError } from '../lib/api'

/* ------------------------------------------------------------- field types */
export type Field =
  | { name: string; label: string; type: 'text' | 'textarea' | 'date' | 'number' | 'color' | 'image' | 'bool' | 'list'; help?: string; required?: boolean; rows?: number; span?: 2; placeholder?: string }
  | { name: string; label: string; type: 'select'; options: [string, string][]; help?: string; required?: boolean; span?: 2 }

type Values = Record<string, unknown>

export function FormFields({ fields, values, onChange, errors = {} }: { fields: Field[]; values: Values; onChange: (v: Values) => void; errors?: Record<string, string> }) {
  const set = (name: string, v: unknown) => onChange({ ...values, [name]: v })
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => {
        const v = values[f.name]
        const id = `f-${f.name}`
        const err = errors[f.name]
        const wide = f.span === 2 || f.type === 'textarea' || f.type === 'image' || f.type === 'list'
        return (
          <div key={f.name} className={wide ? 'sm:col-span-2' : ''}>
            {f.type !== 'bool' && <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>}
            {f.type === 'text' && <input id={id} className="field" value={(v as string) ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />}
            {f.type === 'textarea' && <textarea id={id} className="field resize-y" rows={f.rows ?? 4} value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)} />}
            {f.type === 'date' && <input id={id} type="date" className="field" value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)} />}
            {f.type === 'number' && <input id={id} type="number" min={0} className="field" value={(v as number) ?? 0} onChange={(e) => set(f.name, e.target.value === '' ? 0 : parseInt(e.target.value, 10))} />}
            {f.type === 'color' && (
              <div className="flex gap-3"><input id={id} type="color" className="h-12 w-16 cursor-pointer rounded-xl border border-line" value={(v as string) || '#1c57c4'} onChange={(e) => set(f.name, e.target.value)} /><input className="field" value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)} /></div>
            )}
            {f.type === 'select' && (
              <select id={id} className="field" value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                {f.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
              </select>
            )}
            {f.type === 'bool' && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                <span className={`relative h-6 w-11 rounded-full transition ${v ? 'bg-emerald-500' : 'bg-line'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${v ? 'left-[22px]' : 'left-0.5'}`} /></span>
                <input type="checkbox" className="sr-only" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />
                <span className="text-sm font-medium text-navy-900">{f.label}</span>
              </label>
            )}
            {f.type === 'image' && <ImageInput value={(v as string) ?? ''} onChange={(p) => set(f.name, p)} />}
            {f.type === 'list' && <ListInput value={(v as string[]) ?? []} onChange={(l) => set(f.name, l)} />}
            {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
            {err && <p className="mt-1 text-xs font-medium text-red-600">{err}</p>}
          </div>
        )
      })}
    </div>
  )
}

function ImageInput({ value, onChange }: { value: string; onChange: (p: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function upload(file: File) {
    setErr('')
    if (file.size > 6 * 1024 * 1024) { setErr('Image must be under 6 MB.'); return }
    setBusy(true)
    const fd = new FormData(); fd.append('file', file)
    try { onChange((await api<{ path: string }>('/api/admin/upload', { method: 'POST', form: fd })).path) } catch (e) { setErr(e instanceof ApiError ? e.message : 'Upload failed') } finally { setBusy(false) }
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid h-28 w-44 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-line">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-muted" />}
      </div>
      <div className="space-y-2">
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <div className="flex gap-2">
          <button type="button" className="btn-outline py-2" onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{value ? 'Replace' : 'Upload'} image</button>
          {value && <button type="button" className="btn py-2 text-red-600 hover:bg-red-50" onClick={() => onChange('')}>Remove</button>}
        </div>
        <p className="text-xs text-muted">JPG, PNG or WebP up to 6 MB. Location data in photos is removed automatically.</p>
        {err && <p className="text-xs font-medium text-red-600">{err}</p>}
      </div>
    </div>
  )
}

function ListInput({ value, onChange }: { value: string[]; onChange: (l: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => { if (draft.trim()) { onChange([...value, draft.trim()]); setDraft('') } }
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((s, i) => <span key={i} className="chip gap-1 bg-paper py-1.5 text-navy-900 ring-1 ring-line">{s}<button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${s}`}><X className="h-3.5 w-3.5" /></button></span>)}
      </div>
      <div className="flex gap-2"><input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder="Type and press Enter" /><button type="button" onClick={add} className="btn-outline"><Plus className="h-4 w-4" /></button></div>
    </div>
  )
}

/* ------------------------------------------------------------- drawer, toast, confirm */
export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-navy-950/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }}>
            <header className="flex items-center justify-between border-b border-line px-6 py-4"><h2 className="font-serif text-2xl font-semibold text-navy-900">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper" aria-label="Close"><X className="h-5 w-5" /></button></header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            <footer className="flex justify-end gap-2 border-t border-line bg-paper px-6 py-4">{footer}</footer>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

let toastFn: (msg: string, kind?: 'ok' | 'err') => void = () => {}
export const toast = (msg: string, kind: 'ok' | 'err' = 'ok') => toastFn(msg, kind)
export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: 'ok' | 'err' }[]>([])
  toastFn = (msg, kind = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, msg, kind }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500)
  }
  return (
    <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white shadow-xl ${t.kind === 'ok' ? 'bg-navy-900' : 'bg-red-600'}`}>
            {t.kind === 'ok' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4" />}{t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function ConfirmDelete({ label, onConfirm }: { label: string; onConfirm: () => Promise<void> }) {
  const [ask, setAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!ask) return <button onClick={() => setAsk(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${label}`}><Trash2 className="h-4 w-4" /></button>
  return (
    <span className="inline-flex items-center gap-1">
      <button disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false); setAsk(false) } }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">{busy ? '…' : 'Delete'}</button>
      <button onClick={() => setAsk(false)} className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-paper">Cancel</button>
    </span>
  )
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="font-serif text-4xl font-semibold text-navy-900">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {action}
    </div>
  )
}
