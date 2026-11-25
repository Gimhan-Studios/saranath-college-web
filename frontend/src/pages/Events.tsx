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
      <section className="bg-paper py-12 sm:py-16">
        <div className="wrap max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-full rounded-full bg-white p-1 ring-1 ring-line sm:w-auto">
              {(['upcoming', 'past'] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setCat('all') }} className={`relative min-h-[44px] flex-1 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap sm:flex-initial sm:px-5 ${tab === t ? 'text-white' : 'text-navy-900/70'}`}>
                  {tab === t && <motion.span layoutId="ev-tab" className="absolute inset-0 rounded-full bg-navy-900" />}
                  <span className="relative tabular-nums">{t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}</span>
                </button>
              ))}
            </div>
            <div className="-mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
              {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`min-h-[40px] shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${cat === c ? 'bg-gold-500 text-navy-900' : 'bg-white text-muted ring-1 ring-line hover:text-navy-900'}`}>{c === 'all' ? 'All' : c}</button>)}
            </div>
          </div>
          <div className="space-y-3.5 sm:space-y-4">
            {!data && <Skeletons n={4} className="h-24 sm:h-28" />}
            <AnimatePresence mode="popLayout">
              {list.map((e, i) => (
                <motion.div key={e.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}><EventRow e={e} /></motion.div>
              ))}
            </AnimatePresence>
            {data && list.length === 0 && <p className="py-16 text-center text-muted">{tab === 'upcoming' ? 'No upcoming events have been announced yet. Check back soon.' : 'No past events to show.'}</p>}
          </div>
        </div>
      </section>
    </>
  )
}
