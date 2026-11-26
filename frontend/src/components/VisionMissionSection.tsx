import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Img from './Img'
import { Reveal } from './Reveal'
import { CAMPUS_PHOTOS } from '../lib/campusMedia'

export default function VisionMissionSection({ showCta = true, bg = 'bg-white' }: { showCta?: boolean; bg?: string }) {
  return (
    <section className={`relative overflow-hidden ${bg} py-16 sm:py-24 lg:py-28`}>
      <div className="wrap grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <Reveal className="mx-auto w-full max-w-[360px] sm:max-w-[420px] lg:max-w-none">
          <figure className="relative overflow-hidden rounded-3xl border border-line bg-navy-950 shadow-[0_24px_48px_-28px_rgba(6,23,61,.32)]">
            <div className="aspect-[3/4] overflow-hidden">
              <Img
                src={CAMPUS_PHOTOS.visionMissionTree}
                alt="Wooden plaques carved in the shape of Sri Lanka displaying the Sinhala Vision and Mission of Saranath College on the campus mango tree"
                className="h-full w-full object-cover object-center transition duration-700 hover:scale-[1.03]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 via-navy-950/55 to-transparent p-5 pt-16 text-white sm:p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
                අඹ ගස · Mangifera indica
              </div>
              <figcaption className="mt-1 font-serif text-lg text-white/95">
                Vision & Mission carved at the heart of campus
              </figcaption>
            </div>
          </figure>
        </Reveal>

        <div>
          <Reveal>
            <div className="eyebrow">Our Guiding Purpose</div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-2.5 text-balance font-serif text-3xl font-semibold text-navy-900 sm:mt-3 sm:text-5xl">
              Vision & Mission
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-7 border-t border-line pt-6 sm:mt-8 sm:pt-7">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                <span>Our Vision</span>
                <span aria-hidden="true" className="text-muted/50">·</span>
                <span className="font-sinhala normal-case tracking-normal text-navy-900/75">අපගේ දර්ශනය</span>
              </div>
              <p className="mt-3 font-sinhala text-xl font-bold leading-relaxed text-navy-900 sm:text-2xl">
                “ප්‍රශස්ත අධ්‍යාපනයක් තුළින් විශිෂ්ට දරුවෙක්”
              </p>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
                Shaping an extraordinary, well-rounded child through exemplary education.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-6 border-t border-line pt-6 sm:mt-7 sm:pt-7">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                <span>Our Mission</span>
                <span aria-hidden="true" className="text-muted/50">·</span>
                <span className="font-sinhala normal-case tracking-normal text-navy-900/75">අපගේ මෙහෙවර</span>
              </div>
              <p className="mt-3 font-sinhala text-lg font-semibold leading-relaxed text-navy-900 sm:text-xl">
                “ජාති ආගම් කුල භේදයෙන් තොරව සියළුම දරු දැරියන්ට අධ්‍යාපනයේ සම අවස්ථා ලබා දෙමින් ජාතික අධ්‍යාපන අරමුණු කරා පියනැගීම අපේ මෙහෙවර වේ.”
              </p>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
                Providing equal educational opportunities to every child without distinction of ethnicity, religion, or status, guiding them together toward national educational goals.
              </p>
            </div>
          </Reveal>

          {showCta && (
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/academics" className="btn-navy w-full sm:w-auto">
                  Explore academic pathways <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/about" className="btn-outline w-full sm:w-auto">
                  Our 140+ year story
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
