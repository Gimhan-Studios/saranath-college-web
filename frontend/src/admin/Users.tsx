import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Plus, ShieldCheck } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from './auth'
import { Drawer, FormFields, PageTitle, toast, type Field } from './ui'

interface U { id: number; username: string; full_name: string; role: string; is_active: boolean; totp_enabled: boolean; last_login_at: string | null }

const NEW_FIELDS: Field[] = [
  { name: 'username', label: 'Username', type: 'text', required: true, help: 'Letters, numbers, dot, dash or underscore.' },
  { name: 'full_name', label: 'Full name', type: 'text' },
  { name: 'role', label: 'Role', type: 'select', options: [['editor', 'Editor: manages content and feedback'], ['superadmin', 'Super admin: also manages users and security']] },
  { name: 'password', label: 'Temporary password', type: 'text', required: true, help: 'At least 12 characters with letters and numbers. They must change it at first sign-in.' },
]
const EDIT_FIELDS: Field[] = [
  { name: 'full_name', label: 'Full name', type: 'text' },
  { name: 'role', label: 'Role', type: 'select', options: [['editor', 'Editor'], ['superadmin', 'Super admin']] },
  { name: 'is_active', label: 'Account active', type: 'bool' },
  { name: 'reset_password', label: 'Reset password (leave empty to keep)', type: 'text', span: 2 },
]

export default function UsersPage() {
  const { me } = useAuth()
  const qc = useQueryClient()
  const { data } = useQuery<U[]>({ queryKey: ['admin', 'users'], queryFn: () => api('/api/admin/users') })
  const [mode, setMode] = useState<'new' | U | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true); setErrors({})
    try {
      if (mode === 'new') await api('/api/admin/users', { method: 'POST', body: values })
      else if (mode) await api(`/api/admin/users/${mode.id}`, { method: 'PUT', body: { ...values, reset_password: values.reset_password || null } })
      toast('Saved'); setMode(null); qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (e) { if (e instanceof ApiError) { setErrors(e.fields); toast(e.message, 'err') } } finally { setBusy(false) }
  }

  return (
    <div>
      <PageTitle title="Admin Users" sub="Give each staff member their own account. Never share passwords." action={<button className="btn-navy" onClick={() => { setValues({ role: 'editor', username: '', full_name: '', password: '' }); setMode('new') }}><Plus className="h-4 w-4" />Add user</button>} />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">2-step</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3">Status</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><div className="font-semibold text-navy-900">{u.full_name || u.username}</div><div className="text-xs text-muted">@{u.username}</div></td>
                <td className="px-4 py-3 capitalize">{u.role === 'superadmin' ? 'Super admin' : 'Editor'}</td>
                <td className="px-4 py-3">{u.totp_enabled ? <span className="chip bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" />On</span> : <span className="chip bg-paper text-muted">Off</span>}</td>
                <td className="px-4 py-3 text-xs text-muted">{u.last_login_at ? new Date(u.last_login_at + 'Z').toLocaleString() : 'Never'}</td>
                <td className="px-4 py-3">{u.is_active ? <span className="chip bg-emerald-50 text-emerald-700">Active</span> : <span className="chip bg-red-50 text-red-700">Disabled</span>}</td>
                <td className="px-4 py-3 text-right">
                  <button className="btn-outline py-1.5" onClick={() => { setValues({ full_name: u.full_name, role: u.role, is_active: u.is_active, reset_password: '' }); setMode(u) }}>Edit</button>
                  {u.totp_enabled && u.id !== me?.id && <button className="ml-2 text-xs text-muted hover:text-red-600" onClick={async () => { await api(`/api/admin/users/${u.id}/reset-2fa`, { method: 'POST' }); toast('Two-step sign-in reset'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }) }}><KeyRound className="inline h-3.5 w-3.5" /> Reset 2-step</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Drawer open={!!mode} title={mode === 'new' ? 'New admin user' : 'Edit user'} onClose={() => setMode(null)} footer={<><button className="btn-outline" onClick={() => setMode(null)}>Cancel</button><button className="btn-navy" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
        <FormFields fields={mode === 'new' ? NEW_FIELDS : EDIT_FIELDS} values={values} onChange={setValues} errors={errors} />
      </Drawer>
    </div>
  )
}
