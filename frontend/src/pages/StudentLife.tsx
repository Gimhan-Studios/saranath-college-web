import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { User, X } from 'lucide-react'
import PageHero from '../components/PageHero'
import { SectionHeading } from '../components/Reveal'
import Img from '../components/Img'
import { Skeletons } from '../components/Cards'
import { useClubs } from '../lib/hooks'
import type { Club } from '../lib/types'

export default function StudentLife() {
  const { data } = useClubs()
  const [kind, setKind] = useState<'all' | 'club' | 'sport'>('all')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState<Club | null>(null)

  const byKind = (data ?? []).filter((c) => kind === 'all' || c.kind === kind)
  const cats = useMemo(() => ['all', ...Array.from(new Set(byKind.map((c) => c.category).filter(Boolean)))], [byKind])
  const list = byKind.filter((c) => cat === 'all' || c.category === cat)

  return (
    <>
      <PageHero eyebrow="Clubs, Societies & Sports" title="Student Life" lead="From the first practice to the final whistle, from the stage to the science lab: there is a place for every Saranathian." image="/media/seed/students-together.webp" />
      <section className="bg-paper py-20">
        <div className="wrap">
          <SectionHeading eyebrow="Find your community" title="Grow through shared interests" />
          <div className="mb-4 inline-flex rounded-full bg-white p-1 ring-1 ring-line">
            {(['all', 'club', 'sport'] as const).map((k) => (
              <button key={k} onClick={() => { setKind(k); setCat('all') }} className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${kind === k ? 'text-white' : 'text-navy-900/70 hover:text-navy-900'}`}>
                {kind === k && <motion.span layoutId="kind-pill" className="absolute inset-0 rounded-full bg-navy-900" />}
                <span className="relative">{k === 'all' ? 'Everything' : k === 'club' ? 'Clubs & Societies' : 'Sports'}</span>
              </button>
            ))}
          </div>
          <div className="mb-10 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`chip px-4 py-2 transition ${cat === c ? 'bg-gold-500 text-navy-900' : 'bg-white text-muted ring-1 ring-line hover:text-navy-900'}`}>{c === 'all' ? 'All' : c}</button>
            ))}
          </div>
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {!data && <Skeletons n={6} className="h-80" />}
            <AnimatePresence mode="popLayout">
              {list.map((c) => (
                <motion.button
                  layout key={c.id} onClick={() => setOpen(c)}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}
                  className="group overflow-hidden rounded-2xl bg-white text-left ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(6,23,61,.45)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <span className={`chip absolute left-4 top-4 ${c.kind === 'sport' ? 'bg-gold-500 text-navy-900' : 'bg-white/90 text-navy-900'}`}>{c.kind === 'sport' ? 'Sport' : 'Club'} · {c.category}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl font-semibold text-navy-900">{c.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{c.description}</p>
                    <span className="mt-4 inline-block text-sm font-semibold text-navy-700">Learn more →</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-end bg-navy-950/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div
              role="dialog" aria-modal="true" aria-label={open.name}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
            >
              <div className="relative"><Img src={open.image} alt={open.name} className="aspect-[16/9] w-full object-cover" />
                <button onClick={() => setOpen(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90" aria-label="Close"><X className="h-5 w-5" /></button></div>
              <div className="p-7">
                <div className="eyebrow">{open.kind === 'sport' ? 'Sport' : 'Club'} · {open.category}</div>
                <h3 className="mt-2 font-serif text-4xl font-semibold text-navy-900">{open.name}</h3>
                <p className="mt-4 leading-8 text-muted">{open.description}</p>
                {open.details && <p className="mt-3 leading-8 text-muted">{open.details}</p>}
                {open.teacher_in_charge && <div className="mt-5 flex items-center gap-2 text-sm"><User className="h-4 w-4 text-gold-600" /><b>Teacher in charge:</b> {open.teacher_in_charge}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
