import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function PageHero({ eyebrow, title, lead, image, crumbs = [] }: { eyebrow: string; title: string; lead?: string; image?: string; crumbs?: { to: string; label: string }[] }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 pb-20 pt-36 text-white sm:pb-24 sm:pt-44">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950/90 via-navy-900/80 to-navy-700/60" />
      <div className="pointer-events-none absolute -left-40 top-0 h-full w-80 animate-beam bg-gradient-to-r from-transparent via-gold-300/20 to-transparent blur-2xl" />
      <div className="wrap relative">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-white/60">
          <Link to="/" className="hover:text-gold-300">Home</Link>
          {crumbs.map((c) => (
            <span key={c.to} className="inline-flex items-center gap-1"><ChevronRight className="h-3 w-3" /><Link to={c.to} className="hover:text-gold-300">{c.label}</Link></span>
          ))}
          <ChevronRight className="h-3 w-3" /><span className="text-white/90">{title}</span>
        </nav>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="eyebrow text-gold-400">{eyebrow}</div>
          <h1 className="mt-3 max-w-4xl text-balance font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">{title}</h1>
          {lead && <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{lead}</p>}
        </motion.div>
      </div>
    </section>
  )
}
