import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { todayISO } from './format'
import type { Club, House, Level, News, Photo, SchoolEvent, SiteSettings, Stream, TimelineItem } from './types'

const q = <T,>(key: string, path: string) => () => useQuery<T>({ queryKey: [key], queryFn: () => api<T>(path) })

export const useSettings = q<SiteSettings>('settings', '/api/public/settings')
export const useNews = q<News[]>('news', '/api/public/news')
export const useEvents = q<SchoolEvent[]>('events', '/api/public/events')
export const useHouses = q<House[]>('houses', '/api/public/houses')
export const useAcademics = q<{ levels: Level[]; streams: Stream[] }>('academics', '/api/public/academics')
export const useClubs = q<Club[]>('clubs', '/api/public/clubs')
export const useTimeline = q<TimelineItem[]>('timeline', '/api/public/timeline')
export const useGallery = q<Photo[]>('gallery', '/api/public/gallery')

export function useNewsStory(slug: string) {
  return useQuery<News>({ queryKey: ['news', slug], queryFn: () => api<News>(`/api/public/news/${encodeURIComponent(slug)}`), retry: false })
}
export function useEvent(slug: string) {
  return useQuery<SchoolEvent>({ queryKey: ['event', slug], queryFn: () => api<SchoolEvent>(`/api/public/events/${encodeURIComponent(slug)}`), retry: false })
}

export function splitEvents(events: SchoolEvent[] = []) {
  const today = todayISO()
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date))
  return { upcoming, past }
}
