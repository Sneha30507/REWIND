import { FormEvent, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { projectColors, projects as initialProjects } from '../data'
import type { Project } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

export default function Projects() {
  const [items, setItems] = useState<Project[]>(initialProjects)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const tags = useMemo(() => ['All', ...Array.from(new Set(items.flatMap((p) => p.tags)))], [items])
  const activeTag = tags.includes(tag) ? tag : 'All'
  const visible = items.filter(
    (p) =>
      (activeTag === 'All' || p.tags.includes(activeTag)) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  )

  const addProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const project: Project = {
      id: Date.now(),
      name: n,
      initial: n[0].toUpperCase(),
      colorClass: projectColors[items.length % projectColors.length],
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      edited: 'just now',
      description: 'New project',
      progress: 0,
    }
    setItems([project, ...items])
    setName('')
    setTagsInput('')
    setShowForm(false)
  }

  const removeProject = (id: number) => setItems(items.filter((p) => p.id !== id))

  return (
    <div className="px-7 py-8">
      <PageHeader
        title="My Projects"
        subtitle={`${items.length} projects remembered by Rewind`}
        action={
          <button type="button" className={primaryBtn} onClick={() => setShowForm(!showForm)}>
            <Icon name="plus" /> New Project
          </button>
        }
      />

      {showForm && (
        <form onSubmit={addProject} className={`${panelCls} mb-6 flex flex-wrap items-end gap-3 p-5`}>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
            Project name
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blog Platform" autoFocus />
          </label>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
            Tags (comma separated)
            <input className={inputCls} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, TypeScript" />
          </label>
          <button type="submit" className={primaryBtn}>Add project</button>
          <button type="button" className={ghostBtn} onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex min-h-[44px] min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border border-[#26264A] bg-ink-700 px-3.5 text-muted sm:max-w-[320px]">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search projects"
            placeholder="Search projects..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#E8E8F5] outline-none placeholder:text-muted"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              aria-pressed={activeTag === t}
              className={`min-h-[44px] rounded-full border px-4 text-[13px] font-medium ${
                activeTag === t ? 'border-brand bg-brand text-white' : 'border-line-strong bg-ink-700 text-[#D0D0EA] hover:border-brand'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${panelCls} p-10 text-center text-muted`}>No projects match your search.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
          {visible.map((p) => (
            <article key={p.id} className={`${panelCls} flex flex-col gap-4 p-5`}>
              <div className="flex items-start gap-3.5">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-white ${p.colorClass}`}>{p.initial}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{p.name}</h2>
                  <p className="mt-1 text-[13px] leading-normal text-muted">{p.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProject(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-dim hover:bg-[#1B1B42] hover:text-white"
                >
                  <Icon name="trash" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#1B1B3E] px-2.5 py-[3px] text-[11px] font-medium text-[#B9B9D8]">{t}</span>
                ))}
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-muted">
                  <span>Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1B1B3E]">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-dim">Edited {p.edited}</span>
                <button type="button" className="min-h-[44px] rounded-md bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover">Open</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
