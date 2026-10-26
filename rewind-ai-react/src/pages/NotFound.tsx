import { Link } from 'react-router-dom'
import { primaryBtn } from '../ui'

export default function NotFound() {
  return (
    <div className="grid flex-1 place-items-center px-7 py-20 text-center">
      <div>
        <div className="text-6xl font-extrabold text-brand-accent">404</div>
        <p className="mb-6 mt-2 text-muted">This page does not exist.</p>
        <Link to="/" className={primaryBtn}>Back to Home</Link>
      </div>
    </div>
  )
}
