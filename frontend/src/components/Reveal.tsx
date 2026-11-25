import { motion, type HTMLMotionProps } from 'motion/react'

type Props = HTMLMotionProps<'div'> & { delay?: number; y?: number }

export function Reveal({ delay = 0, y = 28, children, ...rest }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({ eyebrow, title, lead, center, light }: { eyebrow: string; title: string; lead?: string; center?: boolean; light?: boolean }) {
  return (
    <Reveal className={`${center ? 'mx-auto text-center' : ''} mb-12 max-w-2xl`}>
      <div className={`eyebrow ${light ? 'text-gold-400' : ''}`}>{eyebrow}</div>
      <h2 className={`mt-3 font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl ${light ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
      <div className={`mt-5 h-[3px] w-14 rounded-full bg-gold-500 ${center ? 'mx-auto' : ''}`} />
      {lead && <p className={`mt-5 text-[1.05rem] leading-8 ${light ? 'text-white/70' : 'text-muted'}`}>{lead}</p>}
    </Reveal>
  )
}
