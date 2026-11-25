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
      <section className="bg-paper py-20">
        <div className="wrap">
          <SectionHeading eyebrow="Live standings" title="House points" lead={site?.school.sports_meet_note} />
          {houses ? <HouseStandings houses={houses} /> : <div className="grid gap-4 sm:grid-cols-4"><Skeletons n={4} className="h-64" /></div>}
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="wrap grid gap-6 md:grid-cols-2">
          {(houses ?? []).slice().sort((a, b) => a.position - b.position).map((h, i) => (
            <Reveal key={h.id} delay={i * 0.08} className="relative overflow-hidden rounded-3xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${h.color_hex}, #06173d 130%)` }}>
              <div className="absolute -right-8 -top-8 font-serif text-[9rem] font-bold leading-none opacity-10">{h.name[0]}</div>
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">{h.colour_name} · {h.symbol}</div>
                <h3 className="mt-2 font-serif text-4xl font-semibold">{h.name} <span className="font-sinhala text-2xl text-white/70">{h.name_si}</span></h3>
                {h.motto && <div className="mt-2 font-serif text-xl italic text-white/85">“{h.motto}”</div>}
                <p className="mt-4 max-w-lg leading-7 text-white/80">{h.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
