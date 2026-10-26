import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  to: string
}

export default function SectionHeader({ title, to }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">{title}</h2>
      <Link to={to} className="text-[13px] text-brand-link hover:underline">
        View all
      </Link>
    </div>
  )
}
