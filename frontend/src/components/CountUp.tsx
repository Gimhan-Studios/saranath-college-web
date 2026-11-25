import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

export default function CountUp({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const end = parseInt(value.replace(/[^\d]/g, ''), 10)
  const numeric = !isNaN(end) && /^[\d,]+$/.test(value)
  const from = end > 1500 && end < 2100 ? end - 120 : 0
  const [n, setN] = useState(numeric && !reduce ? from : end)

  useEffect(() => {
    if (!inView || !numeric || reduce) return
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1800)
      setN(Math.round(from + (end - from) * (1 - Math.pow(1 - k, 4))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, numeric, reduce, end, from])

  return <span ref={ref}>{numeric ? (end > 9999 ? n.toLocaleString() : n) : value}{suffix}</span>
}
