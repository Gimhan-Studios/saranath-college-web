import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, BookOpen, ChevronDown, MessageSquareHeart, Users } from 'lucide-react'
import IntroMotto from '../components/IntroMotto'
import { Reveal, SectionHeading } from '../components/Reveal'
import CountUp from '../components/CountUp'
import Timeline from '../components/Timeline'
import HouseStandings from '../components/HouseStandings'
import EventsTV from '../components/EventsTV'
import { NewsCard, Skeletons } from '../components/Cards'
import Img from '../components/Img'
import { splitEvents, useAcademics, useClubs, useEvents, useGallery, useHouses, useNews, useSettings, useTimeline } from '../lib/hooks'
import { paragraphs } from '../lib/format'

const rise = { hidden: { y: '110%' }, show: { y: 0 } }

export default function Home() {
  const { data: site } = useSettings()
  const school = site?.school
  const principal = site?.principal
  const { data: timeline } = useTimeline()
  const { data: houses } = useHouses()
  const { data: events } = useEvents()
  const { data: news } = useNews()
  const { data: academics } = useAcademics()
  const { data: clubs } = useClubs()
  const { data: gallery } = useGallery()
  const { upcoming, past } = splitEvents(events)

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const founded = school?.founded ?? 1882
  const age = new Date().getFullYear() - founded
  const motto = school?.motto_si || 'පඤ්ඤා නරානං රතනං'

  return (
    <>
      <IntroMotto motto={motto} logo={school?.logo || '/media/seed/crest-transparent.webp'} name={school?.name || 'Saranath College'} founded={founded} />

      {/* HERO */}
      <section ref={heroRef} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-navy-950">
        <motion.div style={{ y: bgY }} className="absolute inset-0">
          <motion.img
            src={school?.hero_image || '/media/seed/hero.webp'} alt=""
            className="h-full w-full object-cover"
            initial={{ scale: 1.2 }} animate={{ scale: 1.05 }} transition={{ duration: 12, ease: 'easeOut' }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/45 to-navy-950/90" />
        <div className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 animate-beam bg-gradient-to-r from-transparent via-gold-300/15 to-transparent blur-3xl" />
        <img src={school?.logo || '/media/seed/crest-transparent.webp'} alt="" className="pointer-events-none absolute -right-24 bottom-0 hidden h-[80%] w-auto opacity-[0.06] lg:block" />

        <motion.div style={{ opacity: fade }} className="wrap relative flex h-full flex-col justify-center pt-16 text-white">
          <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.15, delayChildren: 0.4 }}>
            <div className="overflow-hidden"><motion.div variants={rise} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-2xl italic text-gold-300 sm:text-3xl">Welcome to</motion.div></div>
            <div className="overflow-hidden pb-2"><motion.h1 variants={rise} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-[clamp(3.2rem,11vw,8.5rem)] font-semibold leading-[0.95] tracking-tight">{school?.name || 'Saranath College'}</motion.h1></div>
            <div className="overflow-hidden"><motion.div variants={rise} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="mt-4 text-xs font-semibold tracking-[0.45em] text-white/80 sm:text-sm">{(school?.location || 'Kuliyapitiya').toUpperCase()} · SINCE {founded}</motion.div></div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.9 }} className="mt-10 flex flex-wrap gap-3">
              <Link to="/about" className="btn-gold">Discover our story <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/events" className="btn-ghost">Upcoming events</Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <a href="#legacy" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold tracking-[0.35em] text-white/70">
          SCROLL <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* STATEMENT + STATS */}
      <section id="legacy" className="relative bg-white py-24 sm:py-32">
        <div className="wrap text-center">
          <Reveal><div className="eyebrow">A legacy of {age} years</div></Reveal>
          <Reveal delay={0.1}><div className="mx-auto my-6 h-[3px] w-14 rounded-full bg-gold-500" /></Reveal>
          <Reveal delay={0.15}>
            <p className="mx-auto max-w-4xl text-balance font-serif text-3xl leading-snug text-navy-900 sm:text-[2.6rem]">{school?.intro_statement}</p>
          </Reveal>
        </div>
        <div className="wrap mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line lg:grid-cols-4">
          {(school?.stats ?? []).map((s, i) => (
            <Reveal key={i} delay={i * 0.1} className="bg-white px-6 py-10 text-center">
              <div className="font-serif text-5xl font-bold text-navy-900 sm:text-6xl"><CountUp value={s.value} suffix={s.suffix} /></div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HISTORY */}
      <section className="bg-paper py-24 sm:py-32">
        <div className="wrap">
          <SectionHeading center eyebrow="Our History" title="A Journey Through Time" lead="The milestones that shaped our College, from a humble beginning to the institution we are proud of today." />
          {timeline ? <Timeline items={timeline} /> : <div className="mx-auto grid max-w-3xl gap-4"><Skeletons n={4} className="h-24" /></div>}
        </div>
      </section>

      {/* PRINCIPAL */}
      {principal?.message && (
        <section className="relative overflow-hidden bg-white py-24 sm:py-32">
          <div className="wrap grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-gradient-to-br from-gold-300 to-gold-600 opacity-80" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy-900">
                {principal.photo ? <Img src={principal.photo} alt={principal.name} className="h-full w-full object-cover" /> : (
                  <div className="grid h-full place-items-center"><img src={school?.logo} alt="" className="h-40 w-auto opacity-90" /></div>
                )}
              </div>
              <div className="relative -mt-10 ml-6 mr-6 rounded-2xl bg-navy-900 px-6 py-4 text-white shadow-xl">
                <div className="font-serif text-xl font-semibold">{principal.name}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold-400">{principal.title}</div>
              </div>
            </Reveal>
            <div>
              <Reveal><div className="eyebrow">From the Principal</div></Reveal>
              <Reveal delay={0.1}><h2 className="mt-3 font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">Principal's Message</h2></Reveal>
              <Reveal delay={0.15}><blockquote className="mt-8 border-l-4 border-gold-500 pl-6 font-serif text-2xl italic leading-snug text-navy-800 sm:text-3xl">“{principal.quote}”</blockquote></Reveal>
              <Reveal delay={0.2}><p className="mt-6 leading-8 text-muted">{paragraphs(principal.message)[0]}</p></Reveal>
              <Reveal delay={0.25}><Link to="/about#principal" className="btn-navy mt-8">Read the full message <ArrowRight className="h-4 w-4" /></Link></Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ACADEMICS */}
      <section className="bg-paper py-24 sm:py-32">
        <div className="wrap">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Education & Academic Pathways" title="Learning for the future" lead="A learning journey from junior secondary through G.C.E. Ordinary Level and Advanced Level." />
            <Reveal className="mb-12"><Link to="/academics" className="btn-outline">All pathways <ArrowRight className="h-4 w-4" /></Link></Reveal>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(academics?.levels ?? []).map((l, i) => (
              <Reveal key={l.id} delay={i * 0.1}>
                <Link to="/academics" className="group relative block aspect-[4/5] overflow-hidden rounded-3xl">
                  <Img src={l.image} alt={l.name} className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <div className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">{l.grade_range}</div>
                    <h3 className="mt-2 font-serif text-3xl font-semibold">{l.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75 transition-all duration-500 md:max-h-0 md:opacity-0 md:group-hover:max-h-32 md:group-hover:opacity-100">{l.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 flex flex-wrap justify-center gap-2">
            {(academics?.streams ?? []).map((s) => <Link to="/academics" key={s.id} className="chip bg-white px-4 py-2 text-sm text-navy-900 ring-1 ring-line transition hover:bg-navy-900 hover:text-white"><BookOpen className="mr-2 h-4 w-4 text-gold-600" />{s.name}</Link>)}
          </Reveal>
        </div>
      </section>

      {/* HOUSES */}
      <section className="relative overflow-hidden bg-navy-900 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(28,87,196,.35),transparent_60%)]" />
        <div className="wrap relative">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading light eyebrow={school?.sports_meet_title || 'Inter-House Sports Meet'} title="House Standings" lead={school?.sports_meet_note} />
            <Reveal className="mb-12"><Link to="/houses" className="btn-ghost">About our houses <ArrowRight className="h-4 w-4" /></Link></Reveal>
          </div>
          {houses ? <HouseStandings houses={houses} compact /> : <div className="grid gap-4 sm:grid-cols-4"><Skeletons n={4} className="h-48" /></div>}
        </div>
      </section>

      {/* EVENTS TV */}
      <section className="relative overflow-hidden bg-navy-950 py-24 sm:py-32">
        <div className="wrap relative">
          <SectionHeading light center eyebrow="Upcoming & Past Events" title="Saranath TV" lead="Tune in to what's coming up at the College, or replay the highlights." />
          {events ? <EventsTV upcoming={upcoming} past={past} /> : <div className="skeleton mx-auto aspect-video max-w-5xl" />}
          <Reveal className="mt-10 text-center"><Link to="/events" className="btn-gold">Full events calendar <ArrowRight className="h-4 w-4" /></Link></Reveal>
        </div>
      </section>

      {/* NEWS */}
      <section className="bg-paper py-24 sm:py-32">
        <div className="wrap">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Latest School News" title="Stories from Saranath" />
            <Reveal className="mb-12"><Link to="/news" className="btn-outline">All news <ArrowRight className="h-4 w-4" /></Link></Reveal>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {news ? news.slice(0, 3).map((n, i) => <Reveal key={n.id} delay={i * 0.1}><NewsCard n={n} /></Reveal>) : <Skeletons n={3} className="h-96" />}
          </div>
        </div>
      </section>

      {/* CLUBS MARQUEE + GALLERY */}
      <section className="overflow-hidden bg-white py-24 sm:py-32">
        <div className="wrap">
          <SectionHeading center eyebrow="Clubs, Societies & Sports" title="Find your place" lead="Try a new interest, build a skill and meet people who are excited about the same things you are." />
        </div>
        <div className="relative flex overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex shrink-0 animate-marquee gap-3 pr-3 hover:[animation-play-state:paused]">
            {[...(clubs ?? []), ...(clubs ?? [])].map((c, i) => (
              <Link key={i} to="/student-life" className="flex shrink-0 items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 ring-1 ring-line transition hover:bg-navy-900 hover:text-white">
                <Img src={c.image} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="text-sm font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="wrap mt-14 grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4">
          {(gallery ?? []).slice(0, 6).map((g, i) => (
            <Reveal key={g.id} delay={i * 0.06} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'row-span-2' : ''} ${i === 3 ? 'md:col-span-2' : ''}`}>
              <Img src={g.image} alt={g.alt} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/70 to-transparent p-4 opacity-0 transition group-hover:opacity-100"><span className="text-sm font-semibold text-white">{g.caption}</span></div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/student-life" className="btn-navy"><Users className="h-4 w-4" />Clubs & sports</Link>
          <Link to="/gallery" className="btn-outline">Open the gallery</Link>
        </Reveal>
      </section>

      {/* MOTTO + FEEDBACK */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-24 text-center text-white sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/10" />
        <div className="wrap relative">
          <Reveal><img src={school?.logo} alt="Saranath College crest" className="mx-auto h-24 w-auto" /></Reveal>
          <Reveal delay={0.1}><div className="eyebrow mt-8 text-gold-400">Our Motto</div></Reveal>
          <Reveal delay={0.15}><div className="mt-4 font-sinhala text-4xl font-bold text-gold-300 sm:text-6xl">{motto}</div></Reveal>
          <Reveal delay={0.2}><div className="mt-4 font-serif text-2xl italic text-white/80">“{school?.motto_en}”</div></Reveal>
          <Reveal delay={0.3} className="mx-auto mt-14 max-w-xl rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur">
            <MessageSquareHeart className="mx-auto h-8 w-8 text-gold-400" />
            <h3 className="mt-3 font-serif text-3xl font-semibold">Your voice matters</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">Send the school a comment, suggestion or concern. Messages go privately to the school administration and are never shown publicly.</p>
            <Link to="/contact#feedback" className="btn-gold mt-6">Share feedback</Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
