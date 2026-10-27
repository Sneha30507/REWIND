import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../endpoints'
import { errorMessage, projectColor, projectInitial, timeAgo } from '../format'
import type { ProjectRecord } from '../types'
import SectionHeader from './SectionHeader'
import { EmptyState, ErrorState, LoadingState } from './States'

export default function RecentProjects() {
  const [items, setItems] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    projectsApi
      .list({ limit: 4 })
      .then((page) => {
        if (!cancelled) setItems(page.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return (
    <section className="px-7 pt-[26px]">
      <SectionHeader title="Recent Projects" to="/projects" />
      <div className="mb-8">
        {loading ? (
          <LoadingState label="Loading projects..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : items.length === 0 ? (
          <EmptyState>
            No projects yet. <Link to="/projects" className="text-brand-link hover:underline">Create your first project</Link>.
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[#1F1F42] bg-ink-850">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-4 border-b border-line-soft px-[18px] py-3.5 last:border-b-0"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-white ${projectColor(p.id)}`}>
                  {projectInitial(p.title)}
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-2 font-semibold">
                  {p.title}
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-[#1B1B3E] px-2.5 py-[3px] text-[11px] font-medium text-[#B9B9D8]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[13px] text-[#A0A0C0] sm:w-[190px]">Last edited {timeAgo(p.updated_at)}</div>
                <Link
                  to={`/projects/${p.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
