import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Academics from './pages/Academics'
import StudentLife from './pages/StudentLife'
import Houses from './pages/Houses'
import NewsList from './pages/NewsList'
import NewsStory from './pages/NewsStory'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// The admin panel is a separate bundle: public visitors never download its code.
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading…</div>}><AdminApp /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="academics" element={<Academics />} />
        <Route path="student-life" element={<StudentLife />} />
        <Route path="houses" element={<Houses />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/:slug" element={<NewsStory />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:slug" element={<EventDetail />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
