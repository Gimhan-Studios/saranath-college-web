import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Briefcase, Check, Target } from 'lucide-react'
import PageHero from '../components/PageHero'
import { Reveal, SectionHeading } from '../components/Reveal'
import Img from '../components/Img'
import { Skeletons } from '../components/Cards'
import { useAcademics } from '../lib/hooks'

export default function Academics() {
  const { data } = useAcademics()
  const [active, setActive] = useState(0)
  const streams = data?.streams ?? []
  const s = streams[active]

  return (
    <>
      <PageHero eyebrow="Education & Academic Pathways" title="Academics" lead="A learning journey from junior secondary through the G.C.E. Ordinary Level and Advanced Level programmes." image="/media/seed/learning-together.webp" />

      <section className="bg-paper py-24">
        <div className="wrap">
          <SectionHeading eyebrow="01 / Levels" title="Stages of learning" />
          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-gold-500/0 via-gold-500 to-gold-500/0 md:block" />
            {data ? data.levels.map((l, i) => (
              <Reveal key={l.id} delay={i * 0.12} className="card relative overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy-900 font-serif text-2xl font-bold text-gold-400 ring-8 ring-paper">{i + 1}</div>
                  <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">{l.grade_range}</div><h3 className="font-serif text-2xl font-semibold text-navy-900">{l.name}</h3></div>
                </div>
                <Img src={l.image} alt={l.name} className="aspect-[16/9] w-full object-cover" />
                <p className="p-6 text-sm leading-7 text-muted">{l.description}</p>
              </Reveal>
            )) : <Skeletons n={3} className="h-96" />}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="wrap">
          <SectionHeading eyebrow="02 / Advanced Level" title="Choose your stream" lead="Subject combinations and availability can change. Please contact the school office for current A/L options." />
          {streams.length > 0 && s && (
            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
              <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" role="tablist" aria-label="A/L streams">
                {streams.map((st, i) => (
                  <button
                    key={st.id} role="tab" aria-selected={i === active} onClick={() => setActive(i)}
                    className={`relative shrink-0 rounded-2xl px-5 py-4 text-left transition ${i === active ? 'text-white' : 'bg-paper text-navy-900 hover:bg-line/60'}`}
                  >
                    {i === active && <motion.span layoutId="stream-pill" className="absolute inset-0 rounded-2xl bg-navy-900" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative flex items-center gap-4">
                      <span className={`font-serif text-2xl font-bold ${i === active ? 'text-gold-400' : 'text-navy-900/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span><span className="block whitespace-nowrap font-semibold">{st.name}</span><span className={`block text-xs ${i === active ? 'text-white/60' : 'text-muted'}`}>{st.category}</span></span>
                    </span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="card overflow-hidden">
                  <div className="relative h-56 sm:h-72">
                    <Img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
                    <h3 className="absolute bottom-6 left-6 font-serif text-4xl font-semibold text-white sm:text-5xl">{s.name}</h3>
                  </div>
                  <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
                    <div>
                      <p className="leading-8 text-muted">{s.description}</p>
                      <div className="mt-6 space-y-4 text-sm">
                        {s.focus && <div className="flex gap-3"><Target className="h-5 w-5 shrink-0 text-gold-600" /><div><b className="text-navy-900">Focus.</b> {s.focus}</div></div>}
                        {s.careers && <div className="flex gap-3"><Briefcase className="h-5 w-5 shrink-0 text-gold-600" /><div><b className="text-navy-900">Careers.</b> {s.careers}</div></div>}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-paper p-6">
                      <div className="eyebrow">Subjects</div>
                      <ul className="mt-4 space-y-3">
                        {s.subjects.map((sub, i) => (
                          <motion.li key={sub} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-start gap-3 text-sm font-medium text-navy-900">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500 text-navy-900"><Check className="h-3 w-3" /></span>{sub}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
