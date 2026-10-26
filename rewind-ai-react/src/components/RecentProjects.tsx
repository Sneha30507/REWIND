import { Link } from 'react-router-dom'
import { projects } from '../data'
import SectionHeader from './SectionHeader'

export default function RecentProjects() {
  return (
    <section className="px-7 pt-[26px]">
      <SectionHeader title="Recent Projects" to="/projects" />
      <div className="mb-8 overflow-hidden rounded-[14px] border border-[#1F1F42] bg-ink-850">
        {projects.slice(0, 4).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 border-b border-line-soft px-[18px] py-3.5 last:border-b-0"
          >
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-white ${p.colorClass}`}>
              {p.initial}
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-2 font-semibold">
              {p.name}
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#1B1B3E] px-2.5 py-[3px] text-[11px] font-medium text-[#B9B9D8]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[13px] text-[#A0A0C0] sm:w-[190px]">Last edited {p.edited}</div>
            <Link
              to="/projects"
              className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
