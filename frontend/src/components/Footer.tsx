import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { Facebook, Youtube } from './BrandIcons'
import { useSettings } from '../lib/hooks'

export default function Footer() {
  const { data } = useSettings()
  const s = data?.school
  const year = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-white/70">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="wrap relative grid gap-10 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-12">
        <div>
          <div className="flex items-center gap-3">
            <img src={s?.logo || '/media/seed/crest-transparent.webp'} alt="" className="h-12 w-auto sm:h-14" />
            <div>
              <div className="font-serif text-xl font-bold text-white sm:text-2xl">{s?.name || 'Saranath College'}</div>
              <div className="text-xs uppercase tracking-[0.22em] text-gold-400">{s?.location || 'Kuliyapitiya'}</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7">{s?.tagline}</p>
          <p className="mt-3 font-sinhala text-base text-gold-300 sm:text-lg">{s?.motto_si}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:contents">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white sm:mb-4">Explore</h4>
            <ul className="space-y-1 text-sm">
              {[['/about', 'Our History'], ['/academics', 'Academics'], ['/student-life', 'Clubs & Sports'], ['/houses', 'Houses']].map(([to, l]) => (
                <li key={to}><Link to={to} className="inline-flex min-h-[40px] items-center transition hover:text-gold-300">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white sm:mb-4">Stay updated</h4>
            <ul className="space-y-1 text-sm">
              {[['/news', 'School News'], ['/events', 'Events'], ['/gallery', 'Gallery'], ['/contact', 'Comments & Feedback']].map(([to, l]) => (
                <li key={to}><Link to={to} className="inline-flex min-h-[40px] items-center transition hover:text-gold-300">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white sm:mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            {s?.address && <li className="flex gap-3 py-1"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />{s.address}</li>}
            {s?.phone && <li><a href={`tel:${s.phone.replace(/\s/g, '')}`} className="inline-flex min-h-[40px] items-center gap-3 hover:text-gold-300"><Phone className="h-4 w-4 shrink-0 text-gold-400" />{s.phone}</a></li>}
            {s?.email && <li><a href={`mailto:${s.email}`} className="inline-flex min-h-[40px] items-center gap-3 hover:text-gold-300"><Mail className="h-4 w-4 shrink-0 text-gold-400" />{s.email}</a></li>}
          </ul>
          <div className="mt-4 flex gap-3">
            {s?.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-full bg-white/5 transition hover:bg-gold-500 hover:text-navy-900"><Facebook className="h-4 w-4" /></a>}
            {s?.youtube && <a href={s.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid h-11 w-11 place-items-center rounded-full bg-white/5 transition hover:bg-gold-500 hover:text-navy-900"><Youtube className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {s?.name || 'Saranath College'}, {s?.location || 'Kuliyapitiya'}. All rights reserved.</span>
          <span className="text-white/40">Proud to be Saranathian</span>
        </div>
      </div>
    </footer>
  )
}
