import { useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, CalendarDays, ClipboardList, ExternalLink, GraduationCap, History, Image, Inbox, LayoutDashboard, LogOut, Menu, Newspaper, School, Shield, Trophy, User, UserCog, Users, Flag } from 'lucide-react'
import { AuthProvider, useAuth } from './auth'
import Login from './Login'
import Dashboard from './Dashboard'
import HousePoints from './HousePoints'
import FeedbackInbox from './FeedbackInbox'
import { SchoolSettingsPage, PrincipalSettingsPage } from './Settings'
import UsersPage from './Users'
import AuditPage from './Audit'
import Account, { ForceChangePassword } from './Account'
import ResourceManager from './ResourceManager'
import { RESOURCES } from './resources'
import { Toaster } from './ui'
import { api } from '../lib/api'

export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
      <Toaster />
    </AuthProvider>
  )
}

function Gate() {
  const { me, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-paper text-muted">Checking your session…</div>
  if (!me) return <Login />
  if (me.must_change_password) return <ForceChangePassword />
  return <Shell />
}

const NAV = [
  { group: 'Overview', items: [{ to: '', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Sports', items: [{ to: 'points', label: 'Sports Meet Points', icon: Trophy }, { to: 'houses', label: 'Houses', icon: Flag }] },
  { group: 'Content', items: [
    { to: 'events', label: 'Events', icon: CalendarDays }, { to: 'news', label: 'School News', icon: Newspaper },
    { to: 'levels', label: 'Academic Levels', icon: GraduationCap }, { to: 'streams', label: 'A/L Streams', icon: BookOpen },
    { to: 'clubs', label: 'Clubs & Sports', icon: Users }, { to: 'timeline', label: 'History Timeline', icon: History }, { to: 'gallery', label: 'Gallery', icon: Image },
  ] },
  { group: 'Private', items: [{ to: 'feedback', label: 'Comments & Feedback', icon: Inbox }] },
  { group: 'Site', items: [{ to: 'school', label: 'School Info', icon: School }, { to: 'principal', label: "Principal's Message", icon: User }] },
]
const SUPER = { group: 'Security', items: [{ to: 'users', label: 'Admin Users', icon: UserCog }, { to: 'audit', label: 'Activity Log', icon: ClipboardList }] }

function Shell() {
  const { me, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { data: dash } = useQuery<{ feedback_new: number }>({ queryKey: ['admin', 'dashboard'], queryFn: () => api('/api/admin/dashboard'), refetchInterval: 60_000 })
  const groups = me?.role === 'superadmin' ? [...NAV, SUPER] : NAV

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-white/70">
      <Link to="/admin" className="flex items-center gap-3 px-6 py-6"><img src="/media/seed/crest-transparent.webp" alt="" className="h-10" /><div><div className="font-serif text-lg font-bold text-white">Saranath</div><div className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-gold-400">Admin Panel</div></div></Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="px-3 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-white/30">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={`/admin/${it.to}`} end={it.to === ''} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
                <it.icon className="h-4 w-4" />{it.label}
                {it.to === 'feedback' && !!dash?.feedback_new && <span className="ml-auto rounded-full bg-gold-500 px-2 text-xs font-bold text-navy-900">{dash.feedback_new}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />View website</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-navy-950/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="h-full w-72" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} onClick={(e) => e.stopPropagation()}>{sidebar}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur sm:px-8">
          <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-paper lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 text-xs text-muted lg:flex"><Shield className="h-4 w-4 text-emerald-600" />Secure session · signs out after 30 minutes idle</div>
          <div className="flex items-center gap-2">
            <Link to="/admin/account" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-paper">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-xs font-bold text-gold-400">{(me?.full_name || me?.username || '?').slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-sm font-medium text-navy-900 sm:block">{me?.full_name || me?.username}</span>
            </Link>
            <button onClick={logout} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="points" element={<HousePoints />} />
                {Object.values(RESOURCES).map((r) => <Route key={r.key} path={r.key} element={<ResourceManager key={r.key} cfg={r} />} />)}
                <Route path="feedback" element={<FeedbackInbox />} />
                <Route path="school" element={<SchoolSettingsPage />} />
                <Route path="principal" element={<PrincipalSettingsPage />} />
                <Route path="account" element={<Account />} />
                {me?.role === 'superadmin' && <Route path="users" element={<UsersPage />} />}
                {me?.role === 'superadmin' && <Route path="audit" element={<AuditPage />} />}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
