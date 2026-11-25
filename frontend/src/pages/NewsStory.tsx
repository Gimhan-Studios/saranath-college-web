import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { motion } from 'motion/react'
import Img from '../components/Img'
import { NewsCard } from '../components/Cards'
import { useNews, useNewsStory } from '../lib/hooks'
import { fmtDate, paragraphs } from '../lib/format'
import NotFound from './NotFound'

export default function NewsStory() {
  const { slug = '' } = useParams()
  const { data: n, isLoading, isError } = useNewsStory(slug)
  const { data: all } = useNews()
  if (isError) return <NotFound />
  if (isLoading || !n) return <div className="wrap pb-20 pt-28 sm:pt-36"><div className="skeleton h-[50vh] sm:h-[60vh]" /></div>
  const more = (all ?? []).filter((x) => x.id !== n.id).slice(0, 3)

  return (
    <article>
      <header className="relative bg-navy-900 pb-24 pt-24 text-white sm:pb-40 sm:pt-36 lg:pt-40">
        <div className="wrap max-w-4xl">
          <Link to="/news" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-white/75 hover:text-gold-300"><ArrowLeft className="h-4 w-4" />All news</Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300 sm:mt-6 sm:text-sm">
              <span>{n.category}</span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="inline-flex items-center gap-1.5 font-normal normal-case tracking-normal text-white/80"><CalendarDays className="h-4 w-4" />{fmtDate(n.date)}</span>
            </div>
            <h1 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight sm:mt-5 sm:text-5xl lg:text-6xl">{n.title}</h1>
            {n.excerpt && <p className="mt-4 text-base leading-7 text-white/80 sm:mt-5 sm:text-lg sm:leading-8">{n.excerpt}</p>}
          </motion.div>
        </div>
      </header>
      <div className="wrap -mt-14 max-w-4xl sm:-mt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.65 }} className="overflow-hidden rounded-2xl shadow-2xl sm:rounded-3xl">
          <Img src={n.image} alt={n.image_alt} className="aspect-[16/9] w-full object-cover" />
        </motion.div>
        <div className="prose-school mx-auto max-w-2xl py-10 sm:py-14">{paragraphs(n.body).map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
      {more.length > 0 && (
        <section className="bg-paper py-12 sm:py-16"><div className="wrap"><h2 className="mb-6 font-serif text-2xl font-semibold text-navy-900 sm:mb-8 sm:text-3xl">More news</h2><div className="grid gap-5 sm:gap-6 md:grid-cols-3">{more.map((m) => <NewsCard key={m.id} n={m} />)}</div></div></section>
      )}
    </article>
  )
}
