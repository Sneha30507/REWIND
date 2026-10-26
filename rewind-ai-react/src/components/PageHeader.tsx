import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
