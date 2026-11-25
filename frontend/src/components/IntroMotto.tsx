import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const KEY = 'sc-intro-seen'

function graphemes(text: string): string[] {
  try {
    const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter
    if (Seg) return [...new Seg('si', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  } catch { /* fall through */ }
  return text.split(/(\s)/)
}

/** Full-screen opening: the crest, then the motto written letter by letter, then the curtain lifts. */
export default function IntroMotto({ motto, logo, name, founded }: { motto: string; logo: string; name: string; founded: number }) {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem(KEY) } catch { return true }
  })
  const parts = useMemo(() => graphemes(motto), [motto])
  const typingEnd = 0.55 + parts.length * 0.055

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => close(), reduce ? 450 : (typingEnd + 1.1) * 1000)
    return () => { clearTimeout(t); document.body.style.overflow = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  function close() {
    try { sessionStorage.setItem(KEY, '1') } catch { /* private mode */ }
    document.body.style.overflow = ''
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[200] grid cursor-pointer place-items-center overflow-hidden bg-navy-950 text-center text-white"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.75, ease: [0.77, 0, 0.18, 1] }}
          onClick={close}
          role="dialog"
          aria-label={`${name} welcome`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(28,87,196,.35),transparent_60%)]" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/10 sm:h-[42rem] sm:w-[42rem]"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[15rem] w-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/15 sm:h-[28rem] sm:w-[28rem]"
            initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
          />
          <div className="relative px-6">
            <motion.img
              src={logo} alt=""
              className="mx-auto h-24 w-auto drop-shadow-[0_0_40px_rgba(230,189,94,.45)] sm:h-32"
              initial={{ scale: 0.7, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="mt-6 font-sinhala text-3xl font-bold leading-snug text-gold-300 sm:mt-8 sm:text-5xl lg:text-6xl" aria-label={motto}>
              {parts.map((p, i) =>
                p.trim() === '' ? <span key={i}>&nbsp;</span> : (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5 + i * 0.055, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >{p}</motion.span>
                ),
              )}
            </div>
            <motion.div
              className="mx-auto mt-5 h-px w-36 bg-gradient-to-r from-transparent via-gold-400 to-transparent sm:mt-6 sm:w-48"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: typingEnd - 0.15, duration: 0.65 }}
            />
            <motion.div
              className="mt-4 text-[11px] font-semibold tracking-[0.25em] text-white/75 sm:mt-5 sm:text-sm sm:tracking-[0.4em]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: typingEnd, duration: 0.7 }}
            >
              {name.toUpperCase()} · {founded}
            </motion.div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close() }}
            className="absolute bottom-6 right-5 min-h-[44px] min-w-[44px] rounded-full border border-white/25 px-5 py-2 text-[0.7rem] font-bold tracking-[0.25em] text-white/80 transition hover:bg-white/10 sm:bottom-8 sm:right-6"
          >
            SKIP
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
