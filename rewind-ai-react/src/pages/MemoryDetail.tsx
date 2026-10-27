import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { ErrorState, InlineError, LoadingState } from '../components/States'
import { memoriesApi } from '../endpoints'
import { errorMessage, formatDateTime, parseTags, titleCase } from '../format'
import type { MemoryRecord } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

const categoryChoices = ['doc', 'code', 'link', 'image', 'general']

export default function MemoryDetail() {
  const { id } = useParams()
  const memoryId = Number(id)
  const navigate = useNavigate()

  const [memory, setMemory] = useState<MemoryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [tagsInput, setTagsInput] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!Number.isInteger(memoryId) || memoryId < 1) {
      setError('This memory does not exist.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    memoriesApi
      .get(memoryId)
      .then((m) => {
        if (!cancelled) setMemory(m)
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
  }, [memoryId, reloadKey])

  const startEdit = useCallback(() => {
    if (!memory) return
    setTitle(memory.title)
    setCategory(memory.category.toLowerCase())
    setTagsInput(memory.tags.join(', '))
    setContent(memory.content)
    setFormError(null)
    setEditing(true)
  }, [memory])

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!memory) return
    if (!title.trim()) {
      setFormError('Please enter a title.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      // The backend's PUT replaces the whole memory, so send every field.
      const updated = await memoriesApi.update(memory.id, {
        title: title.trim(),
        content,
        category: category.trim() || 'general',
        tags: parseTags(tagsInput),
      })
      setMemory(updated)
      setEditing(false)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!memory || !window.confirm(`Delete "${memory.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setFormError(null)
    try {
      await memoriesApi.remove(memory.id)
      navigate('/vault', { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
      setDeleting(false)
    }
  }

  const back = (
    <Link to="/vault" className="mb-4 inline-flex min-h-[44px] items-center text-[13px] text-brand-link hover:underline">
      Back to Knowledge Vault
    </Link>
  )

  if (loading) return <div className="px-7 py-8">{back}<LoadingState label="Loading memory..." /></div>
  if (error || !memory) {
    return (
      <div className="px-7 py-8">
        {back}
        <ErrorState message={error ?? 'Memory not found.'} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    )
  }

  return (
    <div className="max-w-[860px] px-7 py-8">
      {back}
      <PageHeader
        title={memory.title}
        subtitle={`${titleCase(memory.category)} · Created ${formatDateTime(memory.created_at)} · Updated ${formatDateTime(memory.updated_at)}`}
        action={
          !editing && (
            <div className="flex gap-3">
              <button type="button" className={ghostBtn} onClick={startEdit}>Edit</button>
              <button type="button" className={`${ghostBtn} disabled:opacity-60`} onClick={remove} disabled={deleting}>
                <Icon name="trash" /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )
        }
      />

      {editing ? (
        <form onSubmit={save} className={`${panelCls} flex flex-col gap-4 p-6`}>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Title
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
              Type
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {!categoryChoices.includes(category) && <option value={category}>{titleCase(category)}</option>}
                {categoryChoices.map((c) => (
                  <option key={c} value={c}>{titleCase(c)}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[200px] flex-[2] flex-col gap-1.5 text-[13px] text-muted">
              Tags (comma separated)
              <input className={inputCls} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Content
            <textarea className={`${inputCls} min-h-[200px] py-3`} value={content} onChange={(e) => setContent(e.target.value)} maxLength={50000} />
          </label>
          <InlineError message={formError} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={`${primaryBtn} disabled:opacity-60`} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className={ghostBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <section className={`${panelCls} p-6`}>
          {memory.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {memory.tags.map((t) => (
                <span key={t} className="rounded-full bg-[#1B1B3E] px-2.5 py-[3px] text-[11px] font-medium text-[#B9B9D8]">{t}</span>
              ))}
            </div>
          )}
          {memory.content ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[#D0D0EA]">{memory.content}</p>
          ) : (
            <p className="text-muted">This memory has no content.</p>
          )}
          <div className="mt-4"><InlineError message={formError} /></div>
        </section>
      )}
    </div>
  )
}
