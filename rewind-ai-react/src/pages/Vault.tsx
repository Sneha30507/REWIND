import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { vaultFiles } from '../data'
import type { IconName, VaultFile, VaultType } from '../types'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

type Filter = 'all' | VaultType

const typeMeta: Record<VaultType, { label: string; icon: IconName; bg: string }> = {
  doc: { label: 'Documents', icon: 'doc', bg: 'bg-[#1F6FC9]' },
  code: { label: 'Code', icon: 'code', bg: 'bg-[#3A2F9A]' },
  link: { label: 'Links', icon: 'link', bg: 'bg-[#139B6A]' },
  image: { label: 'Images', icon: 'image', bg: 'bg-[#C0408F]' },
}

const codeExt = ['ts', 'tsx', 'js', 'jsx', 'py', 'html', 'css', 'json', 'java', 'c', 'cpp']
const imageExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

function typeFromName(name: string): VaultType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (imageExt.includes(ext)) return 'image'
  if (codeExt.includes(ext)) return 'code'
  return 'doc'
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Vault() {
  const [files, setFiles] = useState<VaultFile[]>(vaultFiles)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [url, setUrl] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const visible = files.filter(
    (f) => (filter === 'all' || f.type === filter) && f.name.toLowerCase().includes(query.toLowerCase()),
  )
  const count = (t: VaultType) => files.filter((f) => f.type === t).length

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    const added: VaultFile[] = picked.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: typeFromName(f.name),
      size: formatSize(f.size),
      added: 'just now',
    }))
    setFiles((prev) => [...added, ...prev])
    e.target.value = ''
  }

  const addLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const u = url.trim()
    if (!u) return
    setFiles((prev) => [{ id: Date.now(), name: u, type: 'link', size: '-', added: 'just now' }, ...prev])
    setUrl('')
  }

  const remove = (id: number) => setFiles(files.filter((f) => f.id !== id))

  return (
    <div className="px-7 py-8">
      <PageHeader
        title="Knowledge Vault"
        subtitle="Files, docs and links Rewind remembers for you"
        action={
          <>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={onUpload} aria-label="Upload files" />
            <button type="button" className={primaryBtn} onClick={() => fileInput.current?.click()}>
              <Icon name="upload" /> Upload files
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(Object.keys(typeMeta) as VaultType[]).map((t) => (
          <div key={t} className={`${panelCls} flex items-center gap-3.5 p-4`}>
            <div className={`grid h-10 w-10 place-items-center rounded-[10px] text-white ${typeMeta[t].bg}`}>
              <Icon name={typeMeta[t].icon} />
            </div>
            <div>
              <b className="block text-[22px] leading-none">{count(t)}</b>
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
        <button type="submit" className={ghostBtn}><Icon name="link" /> Add link</button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex min-h-[44px] min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border border-[#26264A] bg-ink-700 px-3.5 text-muted sm:max-w-[320px]">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search vault"
            placeholder="Search vault..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#E8E8F5] outline-none placeholder:text-muted"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'doc', 'code', 'link', 'image'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`min-h-[44px] rounded-full border px-4 text-[13px] font-medium ${
                filter === f ? 'border-brand bg-brand text-white' : 'border-line-strong bg-ink-700 text-[#D0D0EA] hover:border-brand'
              }`}
            >
              {f === 'all' ? 'All' : typeMeta[f].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#1F1F42] bg-ink-850">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-muted">Nothing here yet.</div>
        ) : (
          visible.map((f) => (
            <div key={f.id} className="flex items-center gap-4 border-b border-line-soft px-[18px] py-3 last:border-b-0">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-white ${typeMeta[f.type].bg}`}>
                <Icon name={typeMeta[f.type].icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{f.name}</div>
                <div className="text-xs text-dim">{typeMeta[f.type].label} · Added {f.added}</div>
              </div>
              <span className="hidden text-[13px] text-[#A0A0C0] sm:block">{f.size}</span>
              <button
                type="button"
                onClick={() => remove(f.id)}
                aria-label={`Remove ${f.name}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-dim hover:bg-[#1B1B42] hover:text-white"
              >
                <Icon name="trash" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
