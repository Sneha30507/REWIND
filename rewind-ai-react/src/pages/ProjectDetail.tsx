import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { ErrorState, InlineError, LoadingState } from '../components/States'
import { projectsApi } from '../endpoints'
import {
  errorMessage, formatDateTime, parseTags, projectColor, projectInitial, projectStatuses, statusLabel,
} from '../format'
import type { ProjectRecord, ProjectStatus } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

export default function ProjectDetail() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [progress, setProgress] = useState(0)
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!Number.isInteger(projectId) || projectId < 1) {
      setError('This project does not exist.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    projectsApi
      .get(projectId)
      .then((p) => {
        if (!cancelled) setProject(p)
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
  }, [projectId, reloadKey])

  const startEdit = useCallback(() => {
    if (!project) return
    setTitle(project.title)
    setDescription(project.description)
    setStatus(project.status)
    setProgress(project.progress)
    setTagsInput(project.tags.join(', '))
    setFormError(null)
    setEditing(true)
  }, [project])

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!project) return
    if (!title.trim()) {
      setFormError('Please enter a project name.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      // The backend's PUT replaces the whole project, so send every field.
      const updated = await projectsApi.update(project.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        progress,
        tags: parseTags(tagsInput),
      })
      setProject(updated)
      setEditing(false)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!project || !window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setFormError(null)
    try {
      await projectsApi.remove(project.id)
      navigate('/projects', { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
      setDeleting(false)
    }
  }

  const back = (
    <Link to="/projects" className="mb-4 inline-flex min-h-[44px] items-center text-[13px] text-brand-link hover:underline">
      Back to My Projects
    </Link>
  )

  if (loading) return <div className="px-7 py-8">{back}<LoadingState label="Loading project..." /></div>
  if (error || !project) {
    return (
      <div className="px-7 py-8">
        {back}
        <ErrorState message={error ?? 'Project not found.'} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    )
  }

  return (
    <div className="max-w-[860px] px-7 py-8">
      {back}
      <PageHeader
        title={project.title}
        subtitle={`${statusLabel(project.status)} · Created ${formatDateTime(project.created_at)} · Updated ${formatDateTime(project.updated_at)}`}
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
            Project name
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Description
            <textarea className={`${inputCls} min-h-[120px] py-3`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-[13px] text-muted">
              Status
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {projectStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[200px] flex-[2] flex-col gap-1.5 text-[13px] text-muted">
              Tags (comma separated)
              <input className={inputCls} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Progress: {progress}%
            <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="accent-[#6D4DF2]" />
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
        <section className={`${panelCls} flex flex-col gap-5 p-6`}>
          <div className="flex items-center gap-3.5">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-white ${projectColor(project.id)}`}>{projectInitial(project.title)}</div>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <span key={t} className="rounded-full bg-[#1B1B3E] px-2.5 py-[3px] text-[11px] font-medium text-[#B9B9D8]">{t}</span>
              ))}
            </div>
          </div>
          {project.description ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[#D0D0EA]">{project.description}</p>
          ) : (
            <p className="text-muted">This project has no description.</p>
          )}
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1B1B3E]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
          <InlineError message={formError} />
        </section>
      )}
    </div>
  )
}
