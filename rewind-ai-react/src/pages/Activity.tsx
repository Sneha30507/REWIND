import { useState } from 'react'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { activityLog } from '../data'
import type { ActivityGroup, ActivityKind } from '../types'

type Filter = 'all' | ActivityKind

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'project', label: 'Projects' },
  { key: 'ai', label: 'AI' },
  { key: 'vault', label: 'Vault' },
  { key: 'search', label: 'Search' },
]

const groups: ActivityGroup[] = ['Today', 'Yesterday', 'Earlier']

export default function Activity() {
  const [filter, setFilter] = useState<Filter>('all')
  const entries = activityLog.filter((a) => filter === 'all' || a.kind === filter)

  return (
    <div className="px-7 py-8">
      <PageHeader title="Activity History" subtitle="Everything Rewind has seen you do" />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`min-h-[44px] rounded-full border px-4 text-[13px] font-medium ${
              filter === f.key ? 'border-brand bg-brand text-white' : 'border-line-strong bg-ink-700 text-[#D0D0EA] hover:border-brand'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="rounded-[14px] border border-line-card bg-ink-800 p-10 text-center text-muted">No activity yet.</div>
      )}

      {groups.map((g) => {
        const items = entries.filter((a) => a.group === g)
        if (items.length === 0) return null
        return (
          <section key={g} className="mb-7">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-dim">{g}</h2>
            <div className="overflow-hidden rounded-[14px] border border-[#1F1F42] bg-ink-850">
              {items.map((a) => (
                <div key={a.id} className="flex items-center gap-4 border-b border-line-soft px-[18px] py-3.5 last:border-b-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#1B1B42] text-brand-link">
                    <Icon name={a.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-dim">{a.detail}</div>
                  </div>
                  <span className="text-[13px] text-[#A0A0C0]">{a.time}</span>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
