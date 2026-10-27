import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { EmptyState, ErrorState, InlineError, LoadingState } from '../components/States'
import { projectsApi } from '../endpoints'
import {
  errorMessage, parseTags, projectColor, projectInitial, projectStatuses, statusLabel, timeAgo,
} from '../format'
import { useDebounced } from '../hooks'
import type { ProjectRecord, ProjectStatus } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

const PAGE_SIZE = 50

export default function Projects() {
  const [items, setItems] = useState<ProjectRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query)
  const [tag, setTag] = useState('All')

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Search runs on the server (title or description); tag chips filter what is loaded.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    projectsApi
      .list({ q: debouncedQuery, limit: PAGE_SIZE, offset: 0 })
      .then((page) => {
        if (cancelled) return
        setItems(page.items)
        setTotal(page.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setItems([])
        setTotal(0)
        setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, reloadKey])

  const tags = useMemo(() => ['All', ...Array.from(new Set(items.flatMap((p) => p.tags)))], [items])
  const activeTag = tags.includes(tag) ? tag : 'All'
  const visible = items.filter((p) => activeTag === 'All' || p.tags.includes(activeTag))

  const addProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Please enter a project name.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const created = await projectsApi.create({
        title: name.trim(),
        description: description.trim(),
        status,
        progress: status === 'completed' ? 100 : 0,
        tags: parseTags(tagsInput),
      })
      if (!query.trim()) {
        setItems((prev) => [created, ...prev])
        setTotal((n) => n + 1)
      } else {
        setQuery('') // clear the search so the new project is visible (list reloads)
      }
      setName('')
      setDescription('')
      setStatus('active')
      setTagsInput('')
      setShowForm(false)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const removeProject = async (p: ProjectRecord) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    setBusyId(p.id)
    setActionError(null)
    try {
      const result = await projectsApi.remove(p.id)
      setItems((prev) => prev.filter((x) => x.id !== result.id))
      setTotal((n) => Math.max(0, n - 1))
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    setActionError(null)
    try {
      const page = await projectsApi.list({ q: debouncedQuery, limit: PAGE_SIZE, offset: items.length })
      setItems((prev) => [...prev, ...page.items.filter((n) => !prev.some((p) => p.id === n.id))])
      setTotal(page.total)
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="px-7 py-8">
      <PageHeader
        title="My Projects"
        subtitle={loading || error ? 'Projects remembered by Rewind' : `${total} project${total === 1 ? '' : 's'} remembered by Rewind`}
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
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="e.g. Blog Platform" autoFocus />
          </label>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
            Description
            <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is it about?" />
          </label>
          <label className="flex min-w-[160px] flex-col gap-1.5 text-[13px] text-muted">
            Status
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {projectStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
            Tags (comma separated)
            <input className={inputCls} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, TypeScript" />
          </label>
          <button type="submit" className={`${primaryBtn} disabled:opacity-60`} disabled={saving}>
            {saving ? 'Adding...' : 'Add project'}
          </button>
          <button type="button" className={ghostBtn} onClick={() => setShowForm(false)}>Cancel</button>
          <div className="basis-full"><InlineError message={formError} /></div>
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
            maxLength={200}
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

      <div className="mb-3"><InlineError message={actionError} /></div>

      {loading ? (
        <LoadingState label="Loading your projects..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : visible.length === 0 ? (
        <EmptyState>
          {debouncedQuery.trim() || activeTag !== 'All'
            ? 'No projects match your search.'
            : 'No projects yet. Click "New Project" to add your first one.'}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
            {visible.map((p) => (
              <article key={p.id} className={`${panelCls} flex flex-col gap-4 p-5`}>
                <div className="flex items-start gap-3.5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-white ${projectColor(p.id)}`}>{projectInitial(p.title)}</div>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-semibold">{p.title}</h2>
                    <p className="mt-1 break-words text-[13px] leading-normal text-muted">{p.description || 'No description'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProject(p)}
                    disabled={busyId === p.id}
                    aria-label={`Delete ${p.title}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-dim hover:bg-[#1B1B42] hover:text-white disabled:opacity-50"
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
                    <span>{statusLabel(p.status)} · {p.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#1B1B3E]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-dim">Edited {timeAgo(p.updated_at)}</span>
                  <Link to={`/projects/${p.id}`} className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover">Open</Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-muted">
            <span>Showing {items.length} of {total}</span>
            {items.length < total && (
              <button type="button" className={ghostBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
