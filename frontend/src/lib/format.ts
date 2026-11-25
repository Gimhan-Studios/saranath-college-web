export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', opts)
}
export function dayMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return { day: d.toLocaleDateString('en-GB', { day: '2-digit' }), month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), year: d.getFullYear() }
}
export function daysUntil(iso: string) {
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(ms / 86400000)
}
export const paragraphs = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
/** Today's date as YYYY-MM-DD in the visitor's own time zone (not UTC). */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
