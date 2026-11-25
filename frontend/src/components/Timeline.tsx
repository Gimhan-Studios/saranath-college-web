import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import type { TimelineItem } from '../lib/types'

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <div className="absolute bottom-0 left-[19px] top-0 w-[2px] bg-line md:left-1/2 md:-translate-x-1/2" />
      <motion.div style={{ scaleY: fill }} className="absolute bottom-0 left-[19px] top-0 w-[2px] origin-top bg-gradient-to-b from-gold-400 to-gold-600 md:left-1/2 md:-translate-x-1/2" />
      <ol className="space-y-10 md:space-y-4">
        {items.map((t, i) => {
          const right = i % 2 === 1
          return (
            <li key={t.id} className="relative md:grid md:grid-cols-2 md:gap-16">
              <motion.span
                className="absolute left-[12px] top-2 z-10 grid h-4 w-4 place-items-center rounded-full border-2 border-gold-500 bg-white md:left-1/2 md:-translate-x-1/2"
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              />
              <motion.div
                className={`ml-12 md:ml-0 ${right ? 'md:col-start-2' : 'md:text-right'}`}
                initial={{ opacity: 0, x: right ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="font-serif text-5xl font-bold leading-none text-navy-900/90">
                  {t.year}{t.date_note && <small className="ml-2 align-middle font-sans text-xs font-semibold uppercase tracking-widest text-gold-600">{t.date_note}</small>}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-navy-900">{t.title}</h3>
                <p className={`mt-2 max-w-md text-[0.96rem] leading-7 text-muted ${right ? '' : 'md:ml-auto'}`}>{t.description}</p>
              </motion.div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
