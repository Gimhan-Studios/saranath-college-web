import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import Img from './Img'
import type { News, SchoolEvent } from '../lib/types'
import { dayMonth, fmtDate } from '../lib/format'

export function NewsCard({ n, large = false }: { n: News; large?: boolean }) {
  return (
    <Link to={`/news/${n.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(6,23,61,.45)]">
      <div className={`relative overflow-hidden ${large ? 'aspect-[16/10]' : 'aspect-[16/10]'}`}>
        <Img src={n.image} alt={n.image_alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="chip absolute left-4 top-4 bg-white/90 text-navy-900 backdrop-blur">{n.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <time className="text-xs font-semibold uppercase tracking-widest text-gold-600">{fmtDate(n.date)}</time>
        <h3 className={`mt-2 font-serif font-semibold leading-snug text-navy-900 ${large ? 'text-3xl' : 'text-2xl'}`}>{n.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{n.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-navy-700">Read story <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  )
}

export function EventRow({ e }: { e: SchoolEvent }) {
  const d = dayMonth(e.date)
  return (
    <Link to={`/events/${e.slug}`} className="group grid grid-cols-[auto_1fr] gap-5 rounded-2xl bg-white p-4 ring-1 ring-line transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(6,23,61,.45)] sm:grid-cols-[auto_160px_1fr] sm:p-5">
      <div className="grid h-20 w-20 place-items-center rounded-xl bg-navy-900 text-center text-white">
        <div><div className="font-serif text-3xl font-bold leading-none">{d.day}</div><div className="mt-1 text-[0.65rem] font-bold tracking-[0.2em] text-gold-400">{d.month} {String(d.year).slice(2)}</div></div>
      </div>
      <div className="hidden overflow-hidden rounded-xl sm:block"><Img src={e.image} alt={e.image_alt} className="h-20 w-full object-cover transition duration-700 group-hover:scale-110" /></div>
      <div className="col-span-2 sm:col-span-1">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold-600">{e.category}</span>
        <h3 className="mt-1 font-serif text-xl font-semibold text-navy-900 sm:text-2xl">{e.title}</h3>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(e.date)}{e.time && ` · ${e.time}`}</span>
          {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.venue}</span>}
        </div>
      </div>
    </Link>
  )
}

export function Skeletons({ n = 3, className = 'h-72' }: { n?: number; className?: string }) {
  return <>{Array.from({ length: n }).map((_, i) => <div key={i} className={`skeleton ${className}`} />)}</>
}
