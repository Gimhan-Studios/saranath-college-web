import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 28, restDelta: 0.001 })
  const [showTop, setShowTop] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [pathname])
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 700)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip pb-14 lg:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300" />
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-gold-500/40 bg-navy-900 text-gold-400 shadow-xl transition hover:bg-navy-800 hover:text-white lg:bottom-6 lg:right-6 lg:h-12 lg:w-12"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
