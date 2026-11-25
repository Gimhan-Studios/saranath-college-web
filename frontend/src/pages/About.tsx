import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { Reveal, SectionHeading } from '../components/Reveal'
import Timeline from '../components/Timeline'
import Img from '../components/Img'
import { Skeletons } from '../components/Cards'
import { useSettings, useTimeline } from '../lib/hooks'
import { paragraphs } from '../lib/format'

export default function About() {
  const { data: site } = useSettings()
  const { data: timeline } = useTimeline()
  const { hash } = useLocation()
  const s = site?.school
  const p = site?.principal
  useEffect(() => {
    if (hash && site) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 300)
  }, [hash, site])

  return (
    <>
      <PageHero eyebrow={`Since ${s?.founded ?? 1882}`} title="About Saranath" lead={s?.intro_statement} image={s?.hero_image} />

      <section className="bg-paper py-24">
        <div className="wrap">
          <SectionHeading center eyebrow="Our History" title="A Journey Through Time" />
          {timeline ? <Timeline items={timeline} /> : <div className="mx-auto grid max-w-3xl gap-4"><Skeletons n={5} className="h-24" /></div>}
        </div>
      </section>

      {p?.message && (
        <section id="principal" className="scroll-mt-24 bg-white py-24">
          <div className="wrap grid gap-14 lg:grid-cols-[320px_1fr]">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <div className="overflow-hidden rounded-3xl bg-navy-900">
                {p.photo ? <Img src={p.photo} alt={p.name} className="aspect-[4/5] w-full object-cover" /> : <div className="grid aspect-[4/5] place-items-center"><img src={s?.logo} alt="" className="h-36" /></div>}
              </div>
              <div className="mt-5 font-serif text-2xl font-semibold text-navy-900">{p.name}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{p.title}</div>
            </Reveal>
            <article>
              <Reveal><div className="eyebrow">From the Principal</div><h2 className="mt-3 font-serif text-5xl font-semibold text-navy-900">Principal's Message</h2></Reveal>
              {p.quote && <Reveal delay={0.1}><blockquote className="my-10 border-l-4 border-gold-500 pl-6 font-serif text-3xl italic leading-snug text-navy-800">“{p.quote}”</blockquote></Reveal>}
              <Reveal delay={0.15} className="prose-school">{paragraphs(p.message).map((t, i) => <p key={i}>{t}</p>)}</Reveal>
              <Reveal delay={0.2}><div className="mt-8 font-serif text-3xl italic text-navy-900">{p.name}</div><div className="text-xs uppercase tracking-[0.2em] text-muted">{p.title}</div></Reveal>
            </article>
          </div>
        </section>
      )}

      <section className="bg-navy-900 py-24 text-center text-white">
        <div className="wrap">
          <Reveal><img src={s?.logo} alt="Saranath College crest" className="mx-auto h-28" /></Reveal>
          <Reveal delay={0.1}><div className="eyebrow mt-8 text-gold-400">Our Motto</div></Reveal>
          <Reveal delay={0.15}><div className="mt-4 font-sinhala text-5xl font-bold text-gold-300 sm:text-6xl">{s?.motto_si}</div></Reveal>
          <Reveal delay={0.2}><div className="mt-4 font-serif text-2xl italic text-white/80">“{s?.motto_en}”</div></Reveal>
        </div>
      </section>
    </>
  )
}
