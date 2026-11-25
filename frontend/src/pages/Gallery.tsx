import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import PageHero from '../components/PageHero'
import Img from '../components/Img'
import { Skeletons } from '../components/Cards'
import { useGallery } from '../lib/hooks'

const FILTERS = [['all', 'All moments'], ['sport', 'Sport'], ['arts', 'Arts & culture'], ['learning', 'Learning'], ['community', 'Community'], ['events', 'Events']]

export default function Gallery() {
  const { data } = useGallery()
  const [f, setF] = useState('all')
  const [idx, setIdx] = useState<number | null>(null)
  const list = (data ?? []).filter((p) => f === 'all' || p.category === f)

  useEffect(() => {
    if (idx === null) return
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIdx(null)
      if (e.key === 'ArrowRight') setIdx((i) => (i! + 1) % list.length)
      if (e.key === 'ArrowLeft') setIdx((i) => (i! - 1 + list.length) % list.length)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [idx, list.length])

  const cur = idx !== null ? list[idx] : null
  return (
    <>
      <PageHero eyebrow="A few moments" title="Gallery" lead="Moments from sports, learning, creative activities and community life." image="/media/seed/school-grounds.webp" crumbs={[{ to: '/student-life', label: 'Student Life' }]} />
      <section className="bg-paper py-16">
        <div className="wrap">
          <div className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map(([v, l]) => <button key={v} onClick={() => setF(v)} className={`chip px-4 py-2 ${f === v ? 'bg-navy-900 text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{l}</button>)}
          </div>
          <motion.div layout className="grid grid-flow-dense auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-3 lg:grid-cols-4">
            {!data && <Skeletons n={8} className="h-full" />}
            {list.map((p, i) => (
              <motion.button
                layout key={p.id} onClick={() => setIdx(i)}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className={`group relative overflow-hidden rounded-2xl ${p.size === 'tall' ? 'row-span-2' : ''} ${p.size === 'wide' ? 'col-span-2' : ''}`}
              >
                <Img src={p.image} alt={p.alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/75 via-transparent p-4 text-left opacity-0 transition group-hover:opacity-100"><span className="text-sm font-semibold text-white">{p.caption}</span></div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>
      <AnimatePresence>
        {cur && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-navy-950/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIdx(null)} role="dialog" aria-modal="true" aria-label={cur.caption}>
            <motion.figure key={cur.id} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img src={cur.image} alt={cur.alt} className="max-h-[80vh] w-auto rounded-xl" />
              <figcaption className="mt-3 text-center text-white/80">{cur.caption}</figcaption>
            </motion.figure>
            <button className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" onClick={() => setIdx(null)} aria-label="Close"><X /></button>
            <button className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setIdx((idx! - 1 + list.length) % list.length) }} aria-label="Previous"><ChevronLeft /></button>
            <button className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setIdx((idx! + 1) % list.length) }} aria-label="Next"><ChevronRight /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
