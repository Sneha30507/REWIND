import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { EmptyState, ErrorState, InlineError, LoadingState } from '../components/States'
import { errorMessage, parseTags, timeAgo, titleCase } from '../format'
import { useDebounced } from '../hooks'
import { memoriesApi } from '../endpoints'
import type { CategoryCount, IconName, MemoryRecord } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

const PAGE_SIZE = 20

interface CategoryMeta {
  label: string
  icon: IconName
  bg: string
}

/** The Vault's four original types are stored as the memory "category". */
const typeMeta: Record<string, CategoryMeta> = {
  doc: { label: 'Documents', icon: 'doc', bg: 'bg-[#1F6FC9]' },
  code: { label: 'Code', icon: 'code', bg: 'bg-[#3A2F9A]' },
  link: { label: 'Links', icon: 'link', bg: 'bg-[#139B6A]' },
  image: { label: 'Images', icon: 'image', bg: 'bg-[#C0408F]' },
  general: { label: 'Notes', icon: 'database', bg: 'bg-[#4A52D6]' },
}
const statCategories = ['doc', 'code', 'link', 'image']
const knownCategories = [...statCategories, 'general']

function metaFor(category: string): CategoryMeta {
  return typeMeta[category] ?? { label: titleCase(category), icon: 'doc', bg: 'bg-[#2C2C58]' }
}

export default function Vault() {
  const [items, setItems] = useState<MemoryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<CategoryCount[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('doc')
  const [tagsInput, setTagsInput] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const loadCounts = useCallback(() => {
    memoriesApi
      .categories()
      .then((res) => setCounts(res.items))
      .catch(() => setCounts(null)) // counters show "-"; the list reports real errors itself
  }, [])

  useEffect(loadCounts, [loadCounts])

  // (Re)load the first page whenever the search text or category filter changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    memoriesApi
      .list({
        q: debouncedQuery,
        category: filter === 'all' ? undefined : filter,
        limit: PAGE_SIZE,
        offset: 0,
      })
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
  }, [debouncedQuery, filter, reloadKey])

  const countOf = (c: string): string => {
    if (!counts) return '-'
    return String(counts.find((x) => x.category === c)?.count ?? 0)
  }
  const extraCategories = (counts ?? []).map((c) => c.category).filter((c) => !knownCategories.includes(c))
  const filterOptions = ['all', ...knownCategories, ...extraCategories]

  /** After a create, show the new memory right away if it belongs in the current view. */
  const matchesView = (m: MemoryRecord) =>
    !query.trim() && (filter === 'all' || filter === m.category.toLowerCase())

  const resetForm = () => {
    setTitle('')
    setCategory('doc')
    setTagsInput('')
    setContent('')
    setFormError(null)
  }

  const createMemory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Please enter a title.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const created = await memoriesApi.create({
        title: title.trim(),
        content,
        category,
        tags: parseTags(tagsInput),
      })
      if (matchesView(created)) {
        setItems((prev) => [created, ...prev])
        setTotal((n) => n + 1)
        setNotice(null)
      } else {
        setNotice(`Saved "${created.title}". It is hidden by your current search or filter.`)
      }
      setShowForm(false)
      resetForm()
      loadCounts()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const addLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const u = url.trim()
    if (!u) return
    setLinkSaving(true)
    setLinkError(null)
    try {
      const created = await memoriesApi.create({ title: u.slice(0, 200), content: u, category: 'link', tags: [] })
      if (matchesView(created)) {
        setItems((prev) => [created, ...prev])
        setTotal((n) => n + 1)
      } else {
        setNotice(`Saved link "${created.title}". It is hidden by your current search or filter.`)
      }
      setUrl('')
      loadCounts()
    } catch (err) {
      setLinkError(errorMessage(err))
    } finally {
      setLinkSaving(false)
    }
  }

  const remove = async (m: MemoryRecord) => {
    if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return
    setBusyId(m.id)
    setActionError(null)
    try {
      const result = await memoriesApi.remove(m.id)
      setItems((prev) => prev.filter((x) => x.id !== result.id))
      setTotal((n) => Math.max(0, n - 1))
      loadCounts()
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
      const page = await memoriesApi.list({
        q: debouncedQuery,
        category: filter === 'all' ? undefined : filter,
        limit: PAGE_SIZE,
        offset: items.length,
      })
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
        title="Knowledge Vault"
        subtitle="Notes, docs and links Rewind remembers for you"
        action={
          <button type="button" className={primaryBtn} onClick={() => setShowForm(!showForm)}>
            <Icon name="plus" /> New memory
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createMemory} className={`${panelCls} mb-6 flex flex-col gap-4 p-5`}>
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[220px] flex-[2] flex-col gap-1.5 text-[13px] text-muted">
              Title
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Deployment checklist"
                autoFocus
              />
            </label>
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
              Type
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {knownCategories.map((c) => (
                  <option key={c} value={c}>{typeMeta[c].label}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
              Tags (comma separated)
              <input className={inputCls} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="react, notes" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Content
            <textarea
              className={`${inputCls} min-h-[120px] py-3`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={50000}
              placeholder="What should Rewind remember?"
            />
          </label>
          <InlineError message={formError} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={`${primaryBtn} disabled:opacity-60`} disabled={saving}>
              {saving ? 'Saving...' : 'Save memory'}
            </button>
            <button type="button" className={ghostBtn} onClick={() => { setShowForm(false); resetForm() }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCategories.map((t) => (
          <div key={t} className={`${panelCls} flex items-center gap-3.5 p-4`}>
            <div className={`grid h-10 w-10 place-items-center rounded-[10px] text-white ${typeMeta[t].bg}`}>
              <Icon name={typeMeta[t].icon} />
            </div>
            <div>
              <b className="block text-[22px] leading-none">{countOf(t)}</b>
              <span className="text-xs text-muted">{typeMeta[t].label}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addLink} className="mb-6 flex flex-wrap gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Link to remember"
          placeholder="Paste a link to remember..."
          className={`${inputCls} min-w-[240px] flex-1 sm:max-w-[420px]`}
        />
        <button type="submit" className={`${ghostBtn} disabled:opacity-60`} disabled={linkSaving}>
          <Icon name="link" /> {linkSaving ? 'Adding...' : 'Add link'}
        </button>
        <div className="basis-full"><InlineError message={linkError} /></div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex min-h-[44px] min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border border-[#26264A] bg-ink-700 px-3.5 text-muted sm:max-w-[320px]">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search vault"
            placeholder="Search vault..."
            maxLength={200}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#E8E8F5] outline-none placeholder:text-muted"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`min-h-[44px] rounded-full border px-4 text-[13px] font-medium ${
                filter === f ? 'border-brand bg-brand text-white' : 'border-line-strong bg-ink-700 text-[#D0D0EA] hover:border-brand'
              }`}
            >
              {f === 'all' ? 'All' : metaFor(f).label}
            </button>
          ))}
        </div>
      </div>

      {notice && <p role="status" className="mb-3 text-[13px] text-[#5FD7A5]">{notice}</p>}
      <div className="mb-3"><InlineError message={actionError} /></div>

      {loading ? (
        <LoadingState label="Loading your memories..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : items.length === 0 ? (
        <EmptyState>
          {debouncedQuery.trim() || filter !== 'all'
            ? 'No memories match your search.'
            : 'Nothing here yet. Use "New memory" or paste a link to add your first one.'}
        </EmptyState>
      ) : (
        <>
          <div className="overflow-hidden rounded-[14px] border border-[#1F1F42] bg-ink-850">
            {items.map((m) => {
              const meta = metaFor(m.category.toLowerCase())
              return (
                <div key={m.id} className="flex items-center gap-4 border-b border-line-soft px-[18px] py-3 last:border-b-0">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-white ${meta.bg}`}>
                    <Icon name={meta.icon} />
                  </div>
                  <Link to={`/vault/${m.id}`} className="min-w-0 flex-1 hover:text-white">
                    <div className="truncate font-medium">{m.title}</div>
                    <div className="text-xs text-dim">{meta.label} · Updated {timeAgo(m.updated_at)}</div>
                  </Link>
                  <span className="hidden max-w-[200px] truncate text-[13px] text-[#A0A0C0] sm:block">
                    {m.tags.join(', ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    disabled={busyId === m.id}
                    aria-label={`Delete ${m.title}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-dim hover:bg-[#1B1B42] hover:text-white disabled:opacity-50"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              )
            })}
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
