import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import Img from './Img'
import type { News, SchoolEvent } from '../lib/types'
import { dayMonth, fmtDate } from '../lib/format'

export function NewsCard({ n, large = false }: { n: News; large?: boolean }) {
  return (
    <Link to={`/news/${n.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(6,23,61,.35)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Img src={n.image} alt={n.image_alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-600">
          <span>{n.category}</span>
          <span aria-hidden="true" className="text-muted/50">·</span>
          <time className="text-muted">{fmtDate(n.date)}</time>
        </div>
        <h3 className={`mt-2 font-serif font-semibold leading-snug text-navy-900 ${large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>{n.title}</h3>
        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-muted sm:mt-3 sm:leading-7">{n.excerpt}</p>
        <span className="mt-auto inline-flex min-h-[36px] items-center gap-1 pt-4 text-sm font-semibold text-navy-700 sm:pt-5">Read story <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  )
}

export function EventRow({ e }: { e: SchoolEvent }) {
  const d = dayMonth(e.date)
  return (
    <Link to={`/events/${e.slug}`} className="group grid grid-cols-[68px_1fr] items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(6,23,61,.35)] sm:grid-cols-[80px_144px_1fr] sm:items-center sm:gap-5 sm:p-5">
      <div className="grid h-[68px] w-[68px] place-items-center rounded-xl bg-navy-900 text-center text-white sm:h-20 sm:w-20">
        <div>
          <div className="font-serif text-2xl font-bold leading-none tabular-nums sm:text-3xl">{d.day}</div>
          <div className="mt-1 text-[0.62rem] font-bold tracking-[0.18em] text-gold-400">{d.month} {String(d.year).slice(2)}</div>
        </div>
      </div>
      <div className="hidden overflow-hidden rounded-xl sm:block"><Img src={e.image} alt={e.image_alt} className="h-20 w-full object-cover transition duration-700 group-hover:scale-110" /></div>
      <div className="min-w-0">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold-600">{e.category}</span>
        <h3 className="mt-0.5 font-serif text-xl font-semibold leading-snug text-navy-900 sm:mt-1 sm:text-2xl">{e.title}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{fmtDate(e.date)}{e.time && ` · ${e.time}`}</span>
          {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{e.venue}</span>}
        </div>
      </div>
    </Link>
  )
}

export function Skeletons({ n = 3, className = 'h-72' }: { n?: number; className?: string }) {
  return <>{Array.from({ length: n }).map((_, i) => <div key={i} className={`skeleton ${className}`} />)}</>
}
