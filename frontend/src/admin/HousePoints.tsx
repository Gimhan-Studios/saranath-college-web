import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, Save } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { House } from '../lib/types'
import { PageTitle, toast } from './ui'

export default function HousePoints() {
  const qc = useQueryClient()
  const { data } = useQuery<House[]>({ queryKey: ['admin', 'houses'], queryFn: () => api('/api/admin/houses') })
  const [pts, setPts] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState<number | null>(null)
  useEffect(() => { if (data) setPts(Object.fromEntries(data.map((h) => [h.id, h.points]))) }, [data])

  async function save(h: House) {
    setBusy(h.id)
    try {
      await api(`/api/admin/houses/${h.id}/points`, { method: 'PATCH', body: { points: pts[h.id] } })
      toast(`${h.name}: ${pts[h.id]} points saved`)
      qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['houses'] })
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Save failed', 'err') } finally { setBusy(null) }
  }
  const bump = (id: number, d: number) => setPts((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + d) }))

  return (
    <div>
      <PageTitle title="Sports Meet Points" sub="Add or subtract points as results come in, then press Save. The public website updates within a minute." />
      <div className="grid gap-5 md:grid-cols-2">
        {(data ?? []).map((h) => {
          const changed = pts[h.id] !== h.points
          return (
            <div key={h.id} className="card overflow-hidden">
              <div className="h-2" style={{ background: h.color_hex }} />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">{h.name}</h2><span className="text-xs tabular-nums text-muted">Saved: {h.points}</span></div>
                <div className="mt-5 flex items-center gap-3">
                  <button onClick={() => bump(h.id, -1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ring-line transition hover:bg-paper" aria-label="Minus 1"><Minus className="h-5 w-5" /></button>
                  <input type="number" min={0} value={pts[h.id] ?? 0} onChange={(e) => setPts((p) => ({ ...p, [h.id]: Math.max(0, parseInt(e.target.value || '0', 10)) }))} className="field text-center font-serif text-3xl font-bold tabular-nums" aria-label={`${h.name} points`} />
                  <button onClick={() => bump(h.id, 1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ring-line transition hover:bg-paper" aria-label="Plus 1"><Plus className="h-5 w-5" /></button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((n) => <button key={n} onClick={() => bump(h.id, n)} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-paper px-3 py-2 text-xs font-semibold tabular-nums text-navy-900 ring-1 ring-line transition hover:bg-gold-300/40">+{n}</button>)}
                </div>
                <button onClick={() => save(h)} disabled={!changed || busy === h.id} className="btn-navy mt-5 w-full"><Save className="h-4 w-4" />{busy === h.id ? 'Saving…' : changed ? 'Save' : 'Saved'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
