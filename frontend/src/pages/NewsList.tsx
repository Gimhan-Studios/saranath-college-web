import { useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import { Reveal } from '../components/Reveal'
import { NewsCard, Skeletons } from '../components/Cards'
import { useNews } from '../lib/hooks'
import { Search } from 'lucide-react'

export default function NewsList() {
  const { data } = useNews()
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const cats = useMemo(() => ['all', ...Array.from(new Set((data ?? []).map((n) => n.category)))], [data])
  const list = (data ?? []).filter((n) => (cat === 'all' || n.category === cat) && (n.title + n.excerpt).toLowerCase().includes(q.toLowerCase()))
  const [lead, ...rest] = list

  return (
    <>
      <PageHero eyebrow="Latest School News" title="News" lead="Announcements, achievements and stories from across the Saranath community." image="/media/seed/school-celebration.webp" />
      <section className="bg-paper py-16">
        <div className="wrap">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`chip px-4 py-2 transition ${cat === c ? 'bg-navy-900 text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy-900'}`}>{c === 'all' ? 'All news' : c}</button>)}
            </div>
            <label className="relative w-full md:w-72"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news" className="field rounded-full pl-11" aria-label="Search news" /></label>
          </div>
          {!data && <div className="grid gap-6 md:grid-cols-3"><Skeletons n={3} className="h-96" /></div>}
          {data && list.length === 0 && <p className="py-20 text-center text-muted">No stories match your search.</p>}
          {lead && <Reveal className="mb-6"><NewsCard n={lead} large /></Reveal>}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((n, i) => <Reveal key={n.id} delay={(i % 3) * 0.08}><NewsCard n={n} /></Reveal>)}
          </div>
        </div>
      </section>
    </>
  )
}
