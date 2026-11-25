import type {
  AcademicLevel,
  AcademicStream,
  AdminSession,
  AuditLog,
  Club,
  EventItem,
  FeedbackRecord,
  GalleryPhoto,
  House,
  NewsArticle,
  PrincipalSettings,
  RateEvent,
  SchoolSettings,
  TimelineItem,
  User,
} from './types.ts'

const counters: Record<string, number> = {}

export const store = {
  nextId(key: string): number {
    counters[key] = (counters[key] ?? 0) + 1
    return counters[key]
  },
  users: [] as User[],
  sessions: new Map<string, AdminSession>(),
  rateEvents: [] as RateEvent[],
  auditLog: [] as AuditLog[],
  news: [] as NewsArticle[],
  events: [] as EventItem[],
  houses: [] as House[],
  levels: [] as AcademicLevel[],
  streams: [] as AcademicStream[],
  clubs: [] as Club[],
  timeline: [] as TimelineItem[],
  gallery: [] as GalleryPhoto[],
  feedback: [] as FeedbackRecord[],
  schoolSettings: null as SchoolSettings | null,
  principalSettings: null as PrincipalSettings | null,
}

export function slugify(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 100) || 'item'
  )
}

export function uniqueSlug(items: { id: number; slug: string }[], title: string, excludeId = 0): string {
  const base = slugify(title)
  let slug = base
  let n = 2
  while (items.some((x) => x.slug === slug && x.id !== excludeId)) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}
