import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronDown, ChevronRight, Home, Menu, Newspaper, X } from 'lucide-react'
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
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const linkCls = (active: boolean) =>
    `relative whitespace-nowrap shrink-0 px-3 py-2 text-[0.84rem] font-semibold tracking-wide transition ${solid ? (active ? 'text-navy-900' : 'text-navy-900/70 hover:text-navy-900') : active ? 'text-white' : 'text-white/85 hover:text-white'}`

  const mobileSections = [
    {
      heading: 'College',
      links: [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About & History' },
        { to: '/academics', label: 'Academics & Streams' },
      ],
    },
    {
      heading: 'Student Life',
      links: [
        { to: '/student-life', label: 'Clubs, Societies & Sports' },
        { to: '/houses', label: 'Houses & Sports Meet' },
        { to: '/gallery', label: 'Photo Gallery' },
      ],
    },
    {
      heading: 'Updates & Contact',
      links: [
        { to: '/news', label: 'School News' },
        { to: '/events', label: 'Events Calendar' },
        { to: '/contact', label: 'Contact & Feedback' },
      ],
    },
  ]

  const isNavActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? 'bg-white/90 shadow-[0_1px_0_rgba(6,23,61,.08)] backdrop-blur-xl' : 'bg-gradient-to-b from-navy-950/70 to-transparent'}`}>
        <div className="wrap flex h-14 items-center justify-between gap-4 sm:h-[72px]">
          <Link to="/" className="flex min-h-[44px] items-center gap-2.5 whitespace-nowrap shrink-0" aria-label="Saranath College home">
            <img src={logo} alt="" className="h-9 w-auto drop-shadow sm:h-11" />
            <span className={`font-serif text-lg font-bold sm:text-xl ${solid ? 'text-navy-900' : 'text-white'}`}>
              Saranath College
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.slice(0, 5).map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <button className={`${linkCls(item.children.some((c) => pathname.startsWith(c.to)))} inline-flex items-center gap-1`} aria-haspopup="true">
                    {item.label}<ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
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

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/contact"
              className={`hidden min-h-[40px] items-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition lg:inline-flex ${
                solid
                  ? 'bg-navy-900 text-white hover:bg-navy-800'
                  : 'bg-gold-500 text-navy-900 hover:bg-gold-400'
              }`}
            >
              Contact Us
            </Link>
            <button
              onClick={() => setOpen(true)}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold tracking-wider transition lg:hidden ${
                solid ? 'bg-navy-900 text-white' : 'bg-white/15 text-white backdrop-blur'
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Natural Thumb Zone) */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-safe backdrop-blur-lg lg:hidden"
      >
        <div className="grid h-14 grid-cols-4 items-center">
          <Link
            to="/"
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              pathname === '/' ? 'text-navy-900 font-semibold' : 'text-muted'
            }`}
          >
            <Home className={`h-5 w-5 ${pathname === '/' ? 'text-gold-600' : ''}`} />
            <span>Home</span>
          </Link>
          <Link
            to="/events"
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              pathname.startsWith('/events') ? 'text-navy-900 font-semibold' : 'text-muted'
            }`}
          >
            <CalendarDays className={`h-5 w-5 ${pathname.startsWith('/events') ? 'text-gold-600' : ''}`} />
            <span>Events</span>
          </Link>
          <Link
            to="/news"
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              pathname.startsWith('/news') ? 'text-navy-900 font-semibold' : 'text-muted'
            }`}
          >
            <Newspaper className={`h-5 w-5 ${pathname.startsWith('/news') ? 'text-gold-600' : ''}`} />
            <span>News</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              open ? 'text-navy-900 font-semibold' : 'text-muted'
            }`}
            aria-label="More pages"
          >
            <Menu className="h-5 w-5" />
            <span>Explore</span>
          </button>
        </div>
      </nav>

      {/* Mobile Action Sheet / Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col justify-end bg-navy-950/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="flex max-h-[86vh] flex-col rounded-t-3xl bg-white text-navy-900 shadow-2xl pb-safe"
            >
              <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line" />
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="" className="h-8 w-auto" />
                  <div>
                    <div className="font-serif text-lg font-bold leading-none text-navy-900">Saranath College</div>
                    <div className="mt-0.5 text-[11px] text-muted">Kuliyapitiya · Since 1882</div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-paper text-navy-900 hover:bg-line"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-5 overflow-y-auto px-5 py-5" aria-label="Mobile">
                {mobileSections.map((sec) => (
                  <div key={sec.heading}>
                    <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {sec.heading}
                    </div>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper/50">
                      {sec.links.map((l) => {
                        const active = isNavActive(l.to)
                        return (
                          <Link
                            key={l.to}
                            to={l.to}
                            className={`flex min-h-[52px] items-center justify-between px-4 py-3 text-[15px] font-medium transition active:bg-line/50 ${
                              active ? 'bg-white font-semibold text-navy-900' : 'text-ink'
                            }`}
                          >
                            <span>{l.label}</span>
                            <ChevronRight className={`h-4 w-4 ${active ? 'text-gold-600' : 'text-muted/60'}`} />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="border-t border-line bg-paper px-5 py-4 text-center font-sinhala text-sm font-medium text-navy-900">
                පඤ්ඤා නරානං රතනං
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
