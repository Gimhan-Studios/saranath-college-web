import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useSettings } from '../lib/hooks'

type Item = { to: string; label: string; children?: { to: string; label: string; note: string }[] }
export const NAV: Item[] = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  {
    to: '/student-life', label: 'Student Life', children: [
      { to: '/student-life', label: 'Clubs, Societies & Sports', note: 'Find your community' },
      { to: '/houses', label: 'Houses & Sports Meet', note: 'Live house standings' },
      { to: '/gallery', label: 'Gallery', note: 'Moments from school life' },
    ],
  },
  {
    to: '/news', label: 'News & Events', children: [
      { to: '/news', label: 'Latest School News', note: 'Stories and announcements' },
      { to: '/events', label: 'Upcoming & Past Events', note: 'The school calendar' },
    ],
  },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const [solid, setSolid] = useState(!home)
  const [open, setOpen] = useState(false)
  const { data } = useSettings()
  const logo = data?.school.logo || '/media/seed/crest-transparent.webp'

  useEffect(() => {
    const on = () => setSolid(!home || window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [home])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : '' }, [open])

  const linkCls = (active: boolean) =>
    `relative px-3 py-2 text-[0.82rem] font-semibold tracking-wide transition ${solid ? (active ? 'text-navy-900' : 'text-navy-900/70 hover:text-navy-900') : active ? 'text-white' : 'text-white/80 hover:text-white'}`

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid ? 'bg-white/85 shadow-[0_1px_0_rgba(6,23,61,.08)] backdrop-blur-xl' : 'bg-gradient-to-b from-navy-950/60 to-transparent'}`}>
        <div className="wrap flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Saranath College home">
            <img src={logo} alt="" className="h-11 w-auto drop-shadow" />
            <div className="leading-tight">
              <div className={`font-serif text-xl font-bold ${solid ? 'text-navy-900' : 'text-white'}`}>Saranath College</div>
              <div className={`text-[0.62rem] font-semibold uppercase tracking-[0.25em] ${solid ? 'text-gold-600' : 'text-gold-300'}`}>Kuliyapitiya · Est. 1882</div>
            </div>
          </Link>

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {NAV.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <button className={`${linkCls(item.children.some((c) => pathname.startsWith(c.to)))} inline-flex items-center gap-1`} aria-haspopup="true">
                    {item.label}<ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="card overflow-hidden p-2">
                      {item.children.map((c) => (
                        <Link key={c.to} to={c.to} className="block rounded-xl px-4 py-3 transition hover:bg-paper">
                          <div className="text-sm font-semibold text-navy-900">{c.label}</div>
                          <div className="text-xs text-muted">{c.note}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} end className={({ isActive }) => linkCls(isActive)}>
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gold-500" />}
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          <button
            onClick={() => setOpen(true)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-[0.2em] lg:hidden ${solid ? 'bg-navy-900 text-white' : 'bg-white/15 text-white backdrop-blur'}`}
            aria-label="Open menu"
          >
            MENU <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-navy-900 text-white lg:hidden"
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
          >
            <div className="wrap flex h-[72px] items-center justify-between">
              <img src={logo} alt="" className="h-10 w-auto" />
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Close menu"><X /></button>
            </div>
            <nav className="wrap flex-1 overflow-y-auto pb-10 pt-4" aria-label="Mobile">
              {NAV.flatMap((i) => (i.children ? i.children.map((c) => ({ to: c.to, label: c.label })) : [{ to: i.to, label: i.label }])).map((l, i) => (
                <motion.div key={l.to + l.label} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <Link to={l.to} className="flex items-baseline gap-4 border-b border-white/10 py-4 font-serif text-3xl">
                    <span className="font-sans text-xs text-gold-400">{String(i + 1).padStart(2, '0')}</span>{l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="wrap pb-8 font-sinhala text-gold-300">පඤ්ඤා නරානං රතනං</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
