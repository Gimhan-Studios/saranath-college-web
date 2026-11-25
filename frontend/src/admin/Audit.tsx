import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { PageTitle } from './ui'

interface A { id: number; username: string; action: string; target: string; detail: string; ip: string; created_at: string }

export default function AuditPage() {
  const { data } = useQuery<A[]>({ queryKey: ['admin', 'audit'], queryFn: () => api('/api/admin/audit') })
  return (
    <div>
      <PageTitle title="Activity Log" sub="Every sign-in, failed attempt and change, newest first." />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Detail</th><th className="px-4 py-3">IP</th></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.map((a) => (
              <tr key={a.id} className={a.action.startsWith('auth.failed') || a.action === 'auth.locked' ? 'bg-red-50/50' : ''}>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{new Date(a.created_at + 'Z').toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-navy-900">{a.username || '—'}</td>
                <td className="px-4 py-2.5"><code className="rounded bg-paper px-1.5 py-0.5 text-xs">{a.action}</code></td>
                <td className="px-4 py-2.5 text-xs text-muted">{a.target} {a.detail}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
