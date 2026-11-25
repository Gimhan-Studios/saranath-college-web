import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { ConfirmDelete, Drawer, FormFields, PageTitle, toast, type Field } from './ui'

export interface ResourceConfig {
  key: string
  title: string
  singular: string
  sub: string
  fields: Field[]
  defaults: Record<string, unknown>
  columns: { label: string; render: (row: Row) => React.ReactNode; className?: string }[]
  searchText: (row: Row) => string
  publicKeys: string[] // public queries to refresh after a change
}
type Row = Record<string, unknown> & { id: number }

export default function ResourceManager({ cfg }: { cfg: ResourceConfig }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Row[]>({ queryKey: ['admin', cfg.key], queryFn: () => api<Row[]>(`/api/admin/${cfg.key}`) })
  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [q, setQ] = useState('')

  const rows = useMemo(() => (data ?? []).filter((r) => cfg.searchText(r).toLowerCase().includes(q.toLowerCase())), [data, q, cfg])

  const open = (row: Row | null) => {
    setErrors({})
    if (row) { setEditing(row); setCreating(false); setValues(Object.fromEntries(cfg.fields.map((f) => [f.name, row[f.name]]))) }
    else { setEditing(null); setCreating(true); setValues({ ...cfg.defaults }) }
  }
  const close = () => { setEditing(null); setCreating(false) }
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin', cfg.key] }); cfg.publicKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }) }

  const save = useMutation({
    mutationFn: () => {
      const body = Object.fromEntries(cfg.fields.map((f) => [f.name, values[f.name] ?? cfg.defaults[f.name]]))
      return editing ? api(`/api/admin/${cfg.key}/${editing.id}`, { method: 'PUT', body }) : api(`/api/admin/${cfg.key}`, { method: 'POST', body })
    },
    onSuccess: () => { toast(`${cfg.singular} saved`); invalidate(); close() },
    onError: (e) => { if (e instanceof ApiError) { setErrors(e.fields); toast(e.message, 'err') } },
  })

  return (
    <div>
      <PageTitle title={cfg.title} sub={cfg.sub} action={<button className="btn-navy w-full sm:w-auto" onClick={() => open(null)}><Plus className="h-4 w-4" />Add {cfg.singular.toLowerCase()}</button>} />
      <div className="card overflow-hidden">
        <div className="border-b border-line p-4"><label className="relative block max-w-sm"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="field py-2.5 pl-10" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></label></div>

        {/* Mobile card list */}
        <div className="divide-y divide-line md:hidden">
          {isLoading && <p className="px-4 py-10 text-center text-sm text-muted">Loading…</p>}
          {!isLoading && rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">Nothing here yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {cfg.columns.map((c, idx) => (
                    <div key={idx} className="min-w-0 text-sm">{c.render(r)}</div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => open(r)} className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-paper hover:text-navy-900" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <ConfirmDelete label={cfg.singular} onConfirm={async () => { try { await api(`/api/admin/${cfg.key}/${r.id}`, { method: 'DELETE' }); toast('Deleted'); invalidate() } catch (e) { toast(e instanceof ApiError ? e.message : 'Delete failed', 'err') } }} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted"><tr>{cfg.columns.map((c) => <th key={c.label} className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>{c.label}</th>)}<th className="w-28 px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-line">
              {isLoading && <tr><td colSpan={cfg.columns.length + 1} className="px-4 py-10 text-center text-muted">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={cfg.columns.length + 1} className="px-4 py-10 text-center text-muted">Nothing here yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-paper/60">
                  {cfg.columns.map((c) => <td key={c.label} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.render(r)}</td>)}
                  <td className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1">
                    <button onClick={() => open(r)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-paper hover:text-navy-900" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <ConfirmDelete label={cfg.singular} onConfirm={async () => { try { await api(`/api/admin/${cfg.key}/${r.id}`, { method: 'DELETE' }); toast('Deleted'); invalidate() } catch (e) { toast(e instanceof ApiError ? e.message : 'Delete failed', 'err') } }} />
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={!!editing || creating} title={editing ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`} onClose={close}
        footer={<><button className="btn-outline" onClick={close}>Cancel</button><button className="btn-navy" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save'}</button></>}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}><FormFields fields={cfg.fields} values={values} onChange={setValues} errors={errors} /></form>
      </Drawer>
    </div>
  )
}
