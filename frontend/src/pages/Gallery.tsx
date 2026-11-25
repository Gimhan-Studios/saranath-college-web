import { useEffect, useRef, useState } from 'react'
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
  const touchStartX = useRef<number | null>(null)
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
  const prev = () => setIdx((i) => (i! - 1 + list.length) % list.length)
  const next = () => setIdx((i) => (i! + 1) % list.length)

  return (
    <>
      <PageHero eyebrow="A few moments" title="Gallery" lead="Moments from sports, learning, creative activities and community life." image="/media/seed/school-grounds.webp" crumbs={[{ to: '/student-life', label: 'Student Life' }]} />
      <section className="bg-paper py-12 sm:py-16">
        <div className="wrap">
          <div className="-mx-4 mb-8 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTERS.map(([v, l]) => (
              <button key={v} onClick={() => setF(v)} className={`min-h-[40px] shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${f === v ? 'bg-navy-900 text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy-900'}`}>{l}</button>
            ))}
          </div>
          <motion.div layout className="grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-3 lg:grid-cols-4">
            {!data && <Skeletons n={8} className="h-full" />}
            {list.map((p, i) => (
              <motion.button
                layout key={p.id} onClick={() => setIdx(i)}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className={`group relative overflow-hidden rounded-2xl ${p.size === 'tall' ? 'row-span-2' : ''} ${p.size === 'wide' ? 'col-span-2' : ''}`}
              >
                <Img src={p.image} alt={p.alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/75 via-transparent p-3.5 text-left opacity-100 transition sm:p-4 sm:opacity-0 sm:group-hover:opacity-100">
                  <span className="text-xs font-semibold text-white sm:text-sm">{p.caption}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>
      <AnimatePresence>
        {cur && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-navy-950/95 p-4 pb-safe"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIdx(null)}
            onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
              touchStartX.current = null
              if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev() }
            }}
            role="dialog" aria-modal="true" aria-label={cur.caption}
          >
            <button className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-5 sm:top-5" onClick={() => setIdx(null)} aria-label="Close"><X /></button>
            <motion.figure key={cur.id} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img src={cur.image} alt={cur.alt} className="max-h-[72vh] w-auto rounded-xl object-contain sm:max-h-[80vh]" />
              <figcaption className="mt-3 text-center text-sm text-white/85 sm:text-base">{cur.caption}</figcaption>
            </motion.figure>
            <button className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous"><ChevronLeft /></button>
            <button className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next"><ChevronRight /></button>
            <div className="mt-5 flex items-center gap-4 sm:hidden" onClick={(e) => e.stopPropagation()}>
              <button className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" onClick={prev} aria-label="Previous"><ChevronLeft /></button>
              <span className="font-mono text-xs text-white/70 tabular-nums">{idx! + 1} / {list.length}</span>
              <button className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" onClick={next} aria-label="Next"><ChevronRight /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
