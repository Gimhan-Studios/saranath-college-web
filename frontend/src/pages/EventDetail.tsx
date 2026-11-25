import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, MapPin, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import Img from '../components/Img'
import { useEvent } from '../lib/hooks'
import { daysUntil, fmtDate, paragraphs } from '../lib/format'
import NotFound from './NotFound'

export default function EventDetail() {
  const { slug = '' } = useParams()
  const { data: e, isLoading, isError } = useEvent(slug)
  if (isError) return <NotFound />
  if (isLoading || !e) return <div className="wrap pb-20 pt-36"><div className="skeleton h-[60vh]" /></div>
  const d = daysUntil(e.date)

  return (
    <article>
      <header className="relative overflow-hidden bg-navy-950 pb-16 pt-32 text-white sm:pt-40">
        <Img src={e.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 to-navy-950/40" />
        <div className="wrap relative max-w-4xl">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-gold-300"><ArrowLeft className="h-4 w-4" />All events</Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mt-6 flex flex-wrap gap-2"><span className="chip bg-gold-500 text-navy-900">{e.category}</span><span className="chip bg-white/15">{d > 0 ? `In ${d} days` : d === 0 ? 'Today' : 'Past event'}</span></div>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-tight sm:text-6xl">{e.title}</h1>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-white/80">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold-400" />{fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {e.time && <span className="inline-flex items-center gap-2"><Clock className="h-5 w-5 text-gold-400" />{e.time}</span>}
              {e.venue && <span className="inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-gold-400" />{e.venue}</span>}
            </div>
          </motion.div>
        </div>
      </header>
      <div className="wrap max-w-3xl py-14">
        {e.excerpt && <p className="mb-8 font-serif text-2xl leading-snug text-navy-900">{e.excerpt}</p>}
        <div className="prose-school">{paragraphs(e.body).filter((p) => p !== e.excerpt).map((p, i) => <p key={i}>{p}</p>)}</div>
        {e.outcome && (
          <div className="mt-8 rounded-2xl bg-gold-300/25 p-6 ring-1 ring-gold-500/30">
            <div className="flex items-center gap-2 font-semibold text-navy-900"><Trophy className="h-5 w-5 text-gold-600" />Highlights & results</div>
            <div className="prose-school mt-3">{paragraphs(e.outcome).map((p, i) => <p key={i}>{p}</p>)}</div>
          </div>
        )}
      </div>
    </article>
  )
}
