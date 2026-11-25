import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pause, Play, Clock } from 'lucide-react'
import type { SchoolEvent } from '../lib/types'
import { daysUntil, fmtDate } from '../lib/format'

/** "College TV": a broadcast-style screen that cycles through upcoming and past events. */
export default function EventsTV({ upcoming, past }: { upcoming: SchoolEvent[]; past: SchoolEvent[] }) {
  const [channel, setChannel] = useState<'upcoming' | 'past'>(upcoming.length ? 'upcoming' : 'past')
  const list = (channel === 'upcoming' ? upcoming : past).slice(0, 6)
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  const ev = list[i % Math.max(1, list.length)]

  useEffect(() => setI(0), [channel])
  useEffect(() => {
    if (!playing || list.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 6000)
    return () => clearInterval(t)
  }, [playing, list.length, channel])

  const go = (d: number) => setI((x) => (x + d + list.length) % list.length)

  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="rounded-[2rem] bg-gradient-to-b from-[#1b2333] to-[#0b0f18] p-3 shadow-[0_40px_80px_-30px_rgba(3,11,32,.7)] ring-1 ring-white/10 sm:p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-navy-950 sm:aspect-[16/9]">
          <AnimatePresence mode="wait">
            {ev ? (
              <motion.div key={channel + ev.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <motion.img
                  src={ev.image || '/media/seed/hero.webp'} alt={ev.image_alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: 'linear' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/10" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-gold-500 text-navy-900">{ev.category}</span>
                    {channel === 'upcoming' && daysUntil(ev.date) >= 0 && (
                      <span className="chip bg-white/15 text-white backdrop-blur">{daysUntil(ev.date) === 0 ? 'Today' : `In ${daysUntil(ev.date)} days`}</span>
                    )}
                  </div>
                  <h3 className="mt-4 max-w-2xl font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">{ev.title}</h3>
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">{ev.excerpt}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/80 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold-400" />{fmtDate(ev.date)}</span>
                    {ev.time && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold-400" />{ev.time}</span>}
                    {ev.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold-400" />{ev.venue}</span>}
                  </div>
                  <Link to={`/events/${ev.slug}`} className="btn-gold mt-6">View event</Link>
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/60">No events on this channel yet.</div>
            )}
          </AnimatePresence>

          {/* broadcast chrome */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.2em] text-white backdrop-blur sm:left-6 sm:top-6">
            <span className={`h-2 w-2 rounded-full ${channel === 'upcoming' ? 'animate-pulse bg-red-500' : 'bg-white/50'}`} />
            {channel === 'upcoming' ? 'COMING UP' : 'REPLAY'}
          </div>
          <div className="absolute right-4 top-4 font-mono text-[0.65rem] tracking-widest text-white/60 sm:right-6 sm:top-6">SC·TV {list.length ? `${(i % list.length) + 1}/${list.length}` : ''}</div>
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.025)_0,rgba(255,255,255,.025)_1px,transparent_1px,transparent_3px)]" />
          {playing && list.length > 1 && (
            <motion.div key={`bar-${channel}-${i}`} className="absolute bottom-0 left-0 h-1 bg-gold-400" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
          )}
        </div>

        {/* remote */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:mt-4">
          <div className="inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            {(['upcoming', 'past'] as const).map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${channel === c ? 'bg-gold-500 text-navy-900' : 'text-white/70 hover:text-white'}`}>
                {c === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10" aria-label="Previous event"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPlaying((p) => !p)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10" aria-label="Next event"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <div className="mx-auto h-4 w-40 rounded-b-2xl bg-gradient-to-b from-[#1b2333] to-transparent" />
    </div>
  )
}
