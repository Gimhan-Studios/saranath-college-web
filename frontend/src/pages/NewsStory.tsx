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
  if (isLoading || !n) return <div className="wrap pb-20 pt-36"><div className="skeleton h-[60vh]" /></div>
  const more = (all ?? []).filter((x) => x.id !== n.id).slice(0, 3)

  return (
    <article>
      <header className="relative bg-navy-900 pb-40 pt-32 text-white sm:pt-40">
        <div className="wrap max-w-4xl">
          <Link to="/news" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-gold-300"><ArrowLeft className="h-4 w-4" />All news</Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm"><span className="chip bg-gold-500 text-navy-900">{n.category}</span><span className="inline-flex items-center gap-1.5 text-white/70"><CalendarDays className="h-4 w-4" />{fmtDate(n.date)}</span></div>
            <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-tight sm:text-6xl">{n.title}</h1>
            {n.excerpt && <p className="mt-5 text-lg leading-8 text-white/75">{n.excerpt}</p>}
          </motion.div>
        </div>
      </header>
      <div className="wrap -mt-28 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="overflow-hidden rounded-3xl shadow-2xl">
          <Img src={n.image} alt={n.image_alt} className="aspect-[16/9] w-full object-cover" />
        </motion.div>
        <div className="prose-school mx-auto max-w-2xl py-14">{paragraphs(n.body).map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
      {more.length > 0 && (
        <section className="bg-paper py-16"><div className="wrap"><h2 className="mb-8 font-serif text-3xl font-semibold text-navy-900">More news</h2><div className="grid gap-6 md:grid-cols-3">{more.map((m) => <NewsCard key={m.id} n={m} />)}</div></div></section>
      )}
    </article>
  )
}
