import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Image, Inbox, Newspaper, Plus, Trophy, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from './auth'
import type { House } from '../lib/types'

interface Dash { news: number; upcoming_events: number; past_events: number; clubs: number; gallery: number; feedback_new: number; feedback_total: number; houses: House[]; recent_activity: { id: number; username: string; action: string; detail: string; created_at: string }[] }

export default function Dashboard() {
  const { me } = useAuth()
  const { data } = useQuery<Dash>({ queryKey: ['admin', 'dashboard'], queryFn: () => api('/api/admin/dashboard') })
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const tiles = [
    { to: 'events', label: 'Upcoming events', value: data?.upcoming_events, icon: CalendarDays },
    { to: 'news', label: 'News stories', value: data?.news, icon: Newspaper },
    { to: 'clubs', label: 'Clubs & sports', value: data?.clubs, icon: Users },
    { to: 'gallery', label: 'Gallery photos', value: data?.gallery, icon: Image },
  ]
  const max = Math.max(1, ...(data?.houses ?? []).map((h) => h.points))
  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-navy-900">{greet}, {me?.full_name?.split(' ')[0] || me?.username}</h1>
      <p className="mt-1 text-sm text-muted">Here is what is happening on the website.</p>

      {!!data?.feedback_new && (
        <Link to="/admin/feedback" className="mt-6 flex items-center gap-4 rounded-2xl bg-gold-300/30 p-5 ring-1 ring-gold-500/40 transition hover:bg-gold-300/50">
          <Inbox className="h-6 w-6 text-gold-600" /><div><b className="text-navy-900">{data.feedback_new} new message{data.feedback_new > 1 ? 's' : ''}</b><div className="text-sm text-muted">Private comments and feedback from the public.</div></div>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.to} to={`/admin/${t.to}`} className="card p-5 transition hover:-translate-y-0.5">
            <t.icon className="h-5 w-5 text-gold-600" />
            <div className="mt-4 font-serif text-4xl font-bold text-navy-900">{t.value ?? '–'}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold text-navy-900"><Trophy className="h-5 w-5 text-gold-600" />House standings</h2><Link to="/admin/points" className="text-sm font-semibold text-navy-700">Update points →</Link></div>
          <div className="mt-6 space-y-4">
            {(data?.houses ?? []).map((h) => (
              <div key={h.id}>
                <div className="flex justify-between text-sm"><span className="font-semibold text-navy-900">{h.name}</span><span className="font-serif text-lg font-bold">{h.points}</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-paper"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${(h.points / max) * 100}%`, background: h.color_hex }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-navy-900">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            {[['events', 'Add an event'], ['news', 'Post school news'], ['gallery', 'Add gallery photos'], ['points', 'Update sports meet points']].map(([to, l]) => (
              <Link key={to} to={`/admin/${to}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy-900 ring-1 ring-line transition hover:bg-paper"><Plus className="h-4 w-4 text-gold-600" />{l}</Link>
            ))}
          </div>
          {!!data?.recent_activity.length && (
            <>
              <h2 className="mt-8 font-semibold text-navy-900">Recent activity</h2>
              <ul className="mt-3 space-y-2 text-xs text-muted">
                {data.recent_activity.map((a) => <li key={a.id}><b className="text-navy-900">{a.username || 'someone'}</b> · {a.action} {a.detail && `· ${a.detail}`}</li>)}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
