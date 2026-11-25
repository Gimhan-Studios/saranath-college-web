import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import type { TimelineItem } from '../lib/types'

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <div className="absolute bottom-0 left-[15px] top-0 w-[2px] bg-line md:left-1/2 md:-translate-x-1/2" />
      <motion.div style={{ scaleY: fill }} className="absolute bottom-0 left-[15px] top-0 w-[2px] origin-top bg-gradient-to-b from-gold-400 to-gold-600 md:left-1/2 md:-translate-x-1/2" />
      <ol className="space-y-9 md:space-y-4">
        {items.map((t, i) => {
          const right = i % 2 === 1
          return (
            <li key={t.id} className="relative md:grid md:grid-cols-2 md:gap-16">
              <motion.span
                className="absolute left-[8px] top-2 z-10 grid h-4 w-4 place-items-center rounded-full border-2 border-gold-500 bg-white md:left-1/2 md:-translate-x-1/2"
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              />
              <motion.div
                className={`ml-10 sm:ml-12 md:ml-0 ${right ? 'md:col-start-2' : 'md:text-right'}`}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${right ? '' : 'md:justify-end'}`}>
                  <span className="font-serif text-4xl font-bold leading-none text-navy-900/90 tabular-nums sm:text-5xl">{t.year}</span>
                  {t.date_note && <small className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-600">{t.date_note}</small>}
                </div>
                <h3 className="mt-2.5 text-lg font-semibold text-navy-900 sm:mt-3">{t.title}</h3>
                <p className={`mt-1.5 max-w-md text-[0.95rem] leading-7 text-muted ${right ? '' : 'md:ml-auto'}`}>{t.description}</p>
              </motion.div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
