import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-paper px-6 pt-24 text-center">
      <div>
        <div className="font-serif text-[8rem] font-bold leading-none text-navy-900/10">404</div>
        <h1 className="-mt-8 font-serif text-4xl font-semibold text-navy-900">Page not found</h1>
        <p className="mt-3 text-muted">The page you are looking for has moved or does not exist.</p>
        <Link to="/" className="btn-navy mt-8">Back to home</Link>
      </div>
    </section>
  )
}
