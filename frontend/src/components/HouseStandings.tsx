import { motion } from 'motion/react'
import { Crown, Trophy } from 'lucide-react'
import type { House } from '../lib/types'

export default function HouseStandings({ houses, compact = false }: { houses: House[]; compact?: boolean }) {
  const ranked = [...houses].sort((a, b) => b.points - a.points)
  const max = Math.max(1, ...ranked.map((h) => h.points))
  const anyPoints = ranked.some((h) => h.points > 0)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ranked.map((h, i) => (
        <motion.article
          key={h.id}
          layout
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_20px_40px_-24px_rgba(6,23,61,.35)] ring-1 ring-line"
        >
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: h.color_hex }} />
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150" style={{ background: h.color_hex }} />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.25em]" style={{ color: h.color_hex }}>{h.colour_name}</div>
              <h3 className="mt-1 font-serif text-3xl font-bold text-navy-900">{h.name}</h3>
              {h.name_si && <div className="font-sinhala text-sm text-muted">{h.name_si}</div>}
            </div>
            {anyPoints && (
              <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${i === 0 ? 'bg-gold-500 text-navy-900' : 'bg-paper text-navy-900'}`}>
                {i === 0 ? <Crown className="h-5 w-5" /> : i + 1}
              </div>
            )}
          </div>
          <div className="relative mt-6">
            <div className="flex items-end justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">Points</span>
              <span className="font-serif text-4xl font-bold text-navy-900">{h.points.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper">
              <motion.div
                className="h-full rounded-full"
                style={{ background: h.color_hex }}
                initial={{ width: 0 }} whileInView={{ width: `${(h.points / max) * 100}%` }} viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          {!compact && (
            <div className="relative mt-5 space-y-1 text-sm text-muted">
              {h.symbol && <div><span className="font-semibold text-navy-900">Symbol:</span> {h.symbol}</div>}
              {h.motto && <div className="italic">“{h.motto}”</div>}
              {h.captain && <div><span className="font-semibold text-navy-900">Captain:</span> {h.captain}</div>}
            </div>
          )}
        </motion.article>
      ))}
      {!anyPoints && (
        <div className="col-span-full flex items-center justify-center gap-2 text-sm text-muted"><Trophy className="h-4 w-4 text-gold-600" />Points will appear here once the sports meet begins.</div>
      )}
    </div>
  )
}
