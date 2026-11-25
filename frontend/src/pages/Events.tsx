import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PageHero from '../components/PageHero'
import { EventRow, Skeletons } from '../components/Cards'
import { splitEvents, useEvents } from '../lib/hooks'

export default function Events() {
  const { data } = useEvents()
  const { upcoming, past } = splitEvents(data)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [cat, setCat] = useState('all')
  const base = tab === 'upcoming' ? upcoming : past
  const cats = useMemo(() => ['all', ...Array.from(new Set(base.map((e) => e.category)))], [base])
  const list = base.filter((e) => cat === 'all' || e.category === cat)

  return (
    <>
      <PageHero eyebrow="College calendar" title="Upcoming & Past Events" lead="From sports meets to prize givings, everything happening at Saranath in one place." image="/media/seed/track-and-field.webp" />
      <section className="bg-paper py-16">
        <div className="wrap max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-line">
              {(['upcoming', 'past'] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setCat('all') }} className={`relative rounded-full px-5 py-2.5 text-sm font-semibold ${tab === t ? 'text-white' : 'text-navy-900/70'}`}>
                  {tab === t && <motion.span layoutId="ev-tab" className="absolute inset-0 rounded-full bg-navy-900" />}
                  <span className="relative">{t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`chip px-3.5 py-1.5 ${cat === c ? 'bg-gold-500 text-navy-900' : 'bg-white text-muted ring-1 ring-line'}`}>{c === 'all' ? 'All' : c}</button>)}
            </div>
          </div>
          <div className="space-y-4">
            {!data && <Skeletons n={4} className="h-28" />}
            <AnimatePresence mode="popLayout">
              {list.map((e, i) => (
                <motion.div key={e.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}><EventRow e={e} /></motion.div>
              ))}
            </AnimatePresence>
            {data && list.length === 0 && <p className="py-16 text-center text-muted">{tab === 'upcoming' ? 'No upcoming events have been announced yet. Check back soon.' : 'No past events to show.'}</p>}
          </div>
        </div>
      </section>
    </>
  )
}
