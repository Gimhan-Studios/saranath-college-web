import PageHero from '../components/PageHero'
import { Reveal, SectionHeading } from '../components/Reveal'
import HouseStandings from '../components/HouseStandings'
import { Skeletons } from '../components/Cards'
import { useHouses, useSettings } from '../lib/hooks'

export default function Houses() {
  const { data: houses } = useHouses()
  const { data: site } = useSettings()
  return (
    <>
      <PageHero eyebrow={site?.school.sports_meet_title || 'Inter-House Sports Meet'} title="Our Houses" lead="Four houses bring every Saranathian together in friendly competition, on the track, the field and the stage." image="/media/seed/track-and-field.webp" crumbs={[{ to: '/student-life', label: 'Student Life' }]} />
      <section className="bg-navy-900 py-14 sm:py-20">
        <div className="wrap">
          <SectionHeading light eyebrow="Live standings" title="House points" lead={site?.school.sports_meet_note} />
          {houses ? <HouseStandings houses={houses} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeletons n={4} className="h-64" /></div>}
        </div>
      </section>
      <section className="bg-white py-14 sm:py-20">
        <div className="wrap grid gap-5 sm:gap-6 md:grid-cols-2">
          {(houses ?? []).slice().sort((a, b) => a.position - b.position).map((h, i) => (
            <Reveal key={h.id} delay={i * 0.06} className="relative overflow-hidden rounded-2xl p-6 text-white sm:rounded-3xl sm:p-8" style={{ background: `linear-gradient(135deg, ${h.color_hex}, #06173d 130%)` }}>
              <div className="absolute -right-6 -top-6 font-serif text-[7rem] font-bold leading-none opacity-10 sm:-right-8 sm:-top-8 sm:text-[9rem]">{h.name[0]}</div>
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">{h.colour_name} · {h.symbol}</div>
                <h3 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{h.name} <span className="font-sinhala text-xl text-white/75 sm:text-2xl">{h.name_si}</span></h3>
                {h.motto && <div className="mt-2 font-serif text-lg italic text-white/90 sm:text-xl">“{h.motto}”</div>}
                <p className="mt-3.5 max-w-lg text-sm leading-7 text-white/85 sm:mt-4 sm:text-base">{h.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
