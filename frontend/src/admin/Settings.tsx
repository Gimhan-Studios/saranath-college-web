import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Principal, School, Stat } from '../lib/types'
import { FormFields, PageTitle, toast, type Field } from './ui'

function useSettingsForm<T extends object>(key: 'school' | 'principal') {
  const qc = useQueryClient()
  const { data } = useQuery<T>({ queryKey: ['admin', 'settings', key], queryFn: () => api(`/api/admin/settings/${key}`) })
  const [values, setValues] = useState<T | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data) setValues(data) }, [data])
  async function save() {
    setBusy(true); setErrors({})
    try { await api(`/api/admin/settings/${key}`, { method: 'PUT', body: values }); toast('Saved'); qc.invalidateQueries({ queryKey: ['settings'] }); qc.invalidateQueries({ queryKey: ['admin', 'settings', key] }) }
    catch (e) { if (e instanceof ApiError) { setErrors(e.fields); toast(e.message, 'err') } } finally { setBusy(false) }
  }
  return { values, setValues, errors, busy, save }
}

const SCHOOL_FIELDS: Field[] = [
  { name: 'name', label: 'School name', type: 'text' }, { name: 'location', label: 'Town', type: 'text' },
  { name: 'founded', label: 'Year founded', type: 'number' }, { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'motto_si', label: 'Motto (Sinhala)', type: 'text' }, { name: 'motto_en', label: 'Motto meaning (English)', type: 'text' },
  { name: 'tagline', label: 'Tagline', type: 'text', span: 2 },
  { name: 'intro_statement', label: 'Home page statement', type: 'textarea', rows: 3 },
  { name: 'address', label: 'Address', type: 'text', span: 2 }, { name: 'email', label: 'Email', type: 'text' }, { name: 'office_hours', label: 'Office hours', type: 'text' },
  { name: 'facebook', label: 'Facebook page link', type: 'text', placeholder: 'https://…' }, { name: 'youtube', label: 'YouTube link', type: 'text', placeholder: 'https://…' },
  { name: 'map_embed_query', label: 'Map search text', type: 'text', span: 2, help: 'What to search on Google Maps, e.g. "Saranath College Kuliyapitiya".' },
  { name: 'sports_meet_title', label: 'Sports meet title', type: 'text' }, { name: 'sports_meet_note', label: 'Sports meet note', type: 'text' },
  { name: 'hero_image', label: 'Home page main photo', type: 'image' }, { name: 'logo', label: 'Crest / logo (transparent PNG is best)', type: 'image' },
]

export function SchoolSettingsPage() {
  const { values, setValues, errors, busy, save } = useSettingsForm<School>('school')
  if (!values) return <div className="skeleton h-96" />
  const stats = values.stats ?? []
  const setStat = (i: number, k: keyof Stat, v: string) => setValues({ ...values, stats: stats.map((s, j) => (j === i ? { ...s, [k]: v } : s)) })
  return (
    <div>
      <PageTitle title="School Info" sub="Name, motto, contact details and home page photos." action={<button className="btn-navy" onClick={save} disabled={busy}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save changes'}</button>} />
      <div className="card p-6"><FormFields fields={SCHOOL_FIELDS} values={values as unknown as Record<string, unknown>} onChange={(v) => setValues(v as unknown as School)} errors={errors} /></div>
      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Home page numbers</h2>
        <p className="text-sm text-muted">Shown under the welcome statement. Numbers count up when they scroll into view.</p>
        <div className="mt-4 space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_2fr_auto] gap-2">
              <input className="field" placeholder="124" value={s.value} onChange={(e) => setStat(i, 'value', e.target.value)} aria-label="Number" />
              <input className="field" placeholder="+" value={s.suffix} onChange={(e) => setStat(i, 'suffix', e.target.value)} aria-label="Suffix" />
              <input className="field" placeholder="Label" value={s.label} onChange={(e) => setStat(i, 'label', e.target.value)} aria-label="Label" />
              <button className="grid w-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-600" onClick={() => setValues({ ...values, stats: stats.filter((_, j) => j !== i) })} aria-label="Remove"><X className="h-4 w-4" /></button>
            </div>
          ))}
          {stats.length < 8 && <button className="btn-outline" onClick={() => setValues({ ...values, stats: [...stats, { value: '', suffix: '', label: '' }] })}><Plus className="h-4 w-4" />Add number</button>}
        </div>
      </div>
    </div>
  )
}

const PRINCIPAL_FIELDS: Field[] = [
  { name: 'name', label: 'Name', type: 'text' }, { name: 'title', label: 'Title', type: 'text' },
  { name: 'photo', label: 'Photo (portrait)', type: 'image' },
  { name: 'quote', label: 'Highlighted quote', type: 'textarea', rows: 2 },
  { name: 'message', label: 'Message', type: 'textarea', rows: 14, help: 'Leave a blank line between paragraphs.' },
]

export function PrincipalSettingsPage() {
  const { values, setValues, errors, busy, save } = useSettingsForm<Principal>('principal')
  if (!values) return <div className="skeleton h-96" />
  return (
    <div>
      <PageTitle title="Principal's Message" action={<button className="btn-navy" onClick={save} disabled={busy}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save changes'}</button>} />
      <div className="card p-6"><FormFields fields={PRINCIPAL_FIELDS} values={values as unknown as Record<string, unknown>} onChange={(v) => setValues(v as unknown as Principal)} errors={errors} /></div>
    </div>
  )
}
