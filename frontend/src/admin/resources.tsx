import type { ResourceConfig } from './ResourceManager'
import { fmtDate, todayISO } from '../lib/format'

const today = todayISO
const thumb = (src: unknown) => (src ? <img src={String(src)} alt="" className="h-11 w-16 rounded-lg object-cover" /> : <div className="h-11 w-16 rounded-lg bg-paper" />)
const pill = (on: unknown, yes = 'Published', no = 'Hidden') => <span className={`chip ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-paper text-muted'}`}>{on ? yes : no}</span>
const posField = { name: 'position', label: 'Display order', type: 'number' as const, help: 'Smaller numbers show first.' }

export const RESOURCES: Record<string, ResourceConfig> = {
  events: {
    key: 'events', title: 'Events', singular: 'Event', publicKeys: ['events'],
    sub: 'Events dated today or later show as "Upcoming"; earlier ones move to "Past" automatically.',
    defaults: { title: '', category: 'General', date: today(), time: '', venue: '', excerpt: '', body: '', outcome: '', image: '', image_alt: '', published: true },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Time', type: 'text', placeholder: '8.00 am' },
      { name: 'category', label: 'Category', type: 'select', options: [['General', 'General'], ['Sports', 'Sports'], ['Academic', 'Academic'], ['Cultural', 'Cultural'], ['Ceremony', 'Ceremony'], ['Student Activities', 'Student Activities'], ['Religious', 'Religious']] },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2, help: 'Shown on cards and on Saranath TV.' },
      { name: 'body', label: 'Full description', type: 'textarea', rows: 6, help: 'Leave a blank line between paragraphs.' },
      { name: 'outcome', label: 'Highlights & results (after the event)', type: 'textarea', rows: 3 },
      { name: 'image', label: 'Photo', type: 'image' },
      { name: 'image_alt', label: 'Photo description (for screen readers)', type: 'text', span: 2 },
      { name: 'published', label: 'Show on the website', type: 'bool' },
    ],
    columns: [
      { label: '', render: (r) => thumb(r.image), className: 'w-20' },
      { label: 'Event', render: (r) => <><div className="font-semibold text-navy-900">{String(r.title)}</div><div className="text-xs text-muted">{String(r.category)}</div></> },
      { label: 'Date', render: (r) => <span className="whitespace-nowrap">{fmtDate(String(r.date), { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
      { label: 'When', render: (r) => String(r.date) >= today() ? <span className="chip bg-gold-300/40 text-navy-900">Upcoming</span> : <span className="chip bg-paper text-muted">Past</span> },
      { label: 'Status', render: (r) => pill(r.published) },
    ],
    searchText: (r) => `${r.title} ${r.category} ${r.venue}`,
  },
  news: {
    key: 'news', title: 'School News', singular: 'Story', publicKeys: ['news'], sub: 'Announcements and stories shown on the News page and the home page.',
    defaults: { title: '', category: 'General', date: today(), excerpt: '', body: '', image: '', image_alt: '', featured: false, published: true },
    fields: [
      { name: 'title', label: 'Headline', type: 'text', required: true, span: 2 },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'category', label: 'Category', type: 'select', options: [['General', 'General'], ['Academics', 'Academics'], ['Sports', 'Sports'], ['Announcements', 'Announcements'], ['Achievements', 'Achievements'], ['School Feature', 'School Feature']] },
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2 },
      { name: 'body', label: 'Story', type: 'textarea', rows: 10, help: 'Leave a blank line between paragraphs.' },
      { name: 'image', label: 'Photo', type: 'image' },
      { name: 'image_alt', label: 'Photo description', type: 'text', span: 2 },
      { name: 'featured', label: 'Featured story', type: 'bool' },
      { name: 'published', label: 'Show on the website', type: 'bool' },
    ],
    columns: [
      { label: '', render: (r) => thumb(r.image), className: 'w-20' },
      { label: 'Story', render: (r) => <><div className="font-semibold text-navy-900">{String(r.title)}</div><div className="text-xs text-muted">{String(r.category)}</div></> },
      { label: 'Date', render: (r) => <span className="whitespace-nowrap">{fmtDate(String(r.date), { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
      { label: 'Status', render: (r) => pill(r.published) },
    ],
    searchText: (r) => `${r.title} ${r.category}`,
  },
  houses: {
    key: 'houses', title: 'Houses', singular: 'House', publicKeys: ['houses'], sub: 'House names, colours and details. For quick point updates use "Sports Meet Points".',
    defaults: { name: '', name_si: '', symbol: '', colour_name: '', color_hex: '#1c57c4', motto: '', description: '', points: 0, captain: '', position: 0 },
    fields: [
      { name: 'name', label: 'House name', type: 'text', required: true }, { name: 'name_si', label: 'Name in Sinhala', type: 'text' },
      { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'Royal Swan' }, { name: 'colour_name', label: 'Colour name', type: 'text' },
      { name: 'color_hex', label: 'Colour', type: 'color' }, { name: 'points', label: 'Points', type: 'number' },
      { name: 'motto', label: 'House motto', type: 'text', span: 2 }, { name: 'captain', label: 'House captain', type: 'text' }, posField,
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    ],
    columns: [
      { label: '', render: (r) => <span className="block h-8 w-8 rounded-full ring-2 ring-white" style={{ background: String(r.color_hex) }} />, className: 'w-14' },
      { label: 'House', render: (r) => <div className="font-semibold text-navy-900">{String(r.name)}</div> },
      { label: 'Points', render: (r) => <span className="font-serif text-xl font-bold">{String(r.points)}</span> },
      { label: 'Captain', render: (r) => String(r.captain || '—') },
    ],
    searchText: (r) => String(r.name),
  },
  levels: {
    key: 'levels', title: 'Academic Levels', singular: 'Level', publicKeys: ['academics'], sub: 'Junior Secondary, O/L, A/L and so on.',
    defaults: { grade_range: '', name: '', description: '', image: '', position: 0 },
    fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'grade_range', label: 'Grades', type: 'text', placeholder: 'Grades 6 to 8', required: true }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'image', label: 'Photo', type: 'image' }, posField],
    columns: [{ label: '', render: (r) => thumb(r.image), className: 'w-20' }, { label: 'Level', render: (r) => <div className="font-semibold text-navy-900">{String(r.name)}</div> }, { label: 'Grades', render: (r) => String(r.grade_range) }, { label: 'Order', render: (r) => String(r.position) }],
    searchText: (r) => String(r.name),
  },
  streams: {
    key: 'streams', title: 'A/L Streams', singular: 'Stream', publicKeys: ['academics'], sub: 'Advanced Level subject streams and their subjects.',
    defaults: { name: '', category: '', focus: '', careers: '', description: '', subjects: [], image: '', position: 0 },
    fields: [{ name: 'name', label: 'Stream name', type: 'text', required: true }, { name: 'category', label: 'Category', type: 'text', placeholder: 'Science stream' }, { name: 'focus', label: 'Focus', type: 'text', span: 2 }, { name: 'careers', label: 'Careers', type: 'text', span: 2 }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'subjects', label: 'Subjects', type: 'list' }, { name: 'image', label: 'Photo', type: 'image' }, posField],
    columns: [{ label: '', render: (r) => thumb(r.image), className: 'w-20' }, { label: 'Stream', render: (r) => <div className="font-semibold text-navy-900">{String(r.name)}</div> }, { label: 'Subjects', render: (r) => <span className="text-xs text-muted">{(r.subjects as string[]).join(', ')}</span> }],
    searchText: (r) => String(r.name),
  },
  clubs: {
    key: 'clubs', title: 'Clubs, Societies & Sports', singular: 'Club or sport', publicKeys: ['clubs'], sub: 'Everything shown on the Student Life page.',
    defaults: { name: '', kind: 'club', category: '', description: '', details: '', teacher_in_charge: '', image: '', position: 0 },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'kind', label: 'Type', type: 'select', options: [['club', 'Club / society'], ['sport', 'Sport']] },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Arts, Learning, Team sport…' }, { name: 'teacher_in_charge', label: 'Teacher in charge', type: 'text' },
      { name: 'description', label: 'Short description', type: 'textarea', rows: 2 }, { name: 'details', label: 'More details', type: 'textarea', rows: 4 },
      { name: 'image', label: 'Photo', type: 'image' }, posField,
    ],
    columns: [{ label: '', render: (r) => thumb(r.image), className: 'w-20' }, { label: 'Name', render: (r) => <div className="font-semibold text-navy-900">{String(r.name)}</div> }, { label: 'Type', render: (r) => pill(r.kind === 'sport', 'Sport', 'Club') }, { label: 'Category', render: (r) => String(r.category) }],
    searchText: (r) => `${r.name} ${r.category}`,
  },
  timeline: {
    key: 'timeline', title: 'History Timeline', singular: 'Milestone', publicKeys: ['timeline'], sub: 'Milestones shown in "A Journey Through Time".',
    defaults: { year: '', date_note: '', title: '', description: '', position: 0 },
    fields: [{ name: 'year', label: 'Year', type: 'text', required: true, placeholder: '1882' }, { name: 'date_note', label: 'Exact date (optional)', type: 'text', placeholder: 'July 7' }, { name: 'title', label: 'Title', type: 'text', required: true, span: 2 }, { name: 'description', label: 'Description', type: 'textarea' }, posField],
    columns: [{ label: 'Year', render: (r) => <span className="font-serif text-xl font-bold">{String(r.year)}</span> }, { label: 'Milestone', render: (r) => <div className="font-semibold text-navy-900">{String(r.title)}</div> }, { label: 'Order', render: (r) => String(r.position) }],
    searchText: (r) => `${r.year} ${r.title}`,
  },
  gallery: {
    key: 'gallery', title: 'Gallery', singular: 'Photo', publicKeys: ['gallery'], sub: 'Photos on the Gallery page and the home page.',
    defaults: { image: '', caption: '', alt: '', category: 'community', size: 'normal', position: 0 },
    fields: [
      { name: 'image', label: 'Photo', type: 'image', required: true }, { name: 'caption', label: 'Caption', type: 'text', span: 2 }, { name: 'alt', label: 'Photo description', type: 'text', span: 2 },
      { name: 'category', label: 'Category', type: 'select', options: [['community', 'Community'], ['sport', 'Sport'], ['learning', 'Learning'], ['arts', 'Arts & culture'], ['events', 'Events']] },
      { name: 'size', label: 'Tile size', type: 'select', options: [['normal', 'Normal'], ['wide', 'Wide'], ['tall', 'Tall']] }, posField,
    ],
    columns: [{ label: '', render: (r) => thumb(r.image), className: 'w-20' }, { label: 'Caption', render: (r) => <div className="font-semibold text-navy-900">{String(r.caption || '—')}</div> }, { label: 'Category', render: (r) => String(r.category) }, { label: 'Order', render: (r) => String(r.position) }],
    searchText: (r) => `${r.caption} ${r.category}`,
  },
}
