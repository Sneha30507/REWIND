import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Toggle from '../components/Toggle'
import { connectedApps } from '../data'
import { ghostBtn, inputCls, panelCls, primaryBtn } from '../ui'

interface Prefs {
  autoRemember: boolean
  weeklySummary: boolean
  emailAlerts: boolean
  privateMode: boolean
}

const prefRows: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'autoRemember', label: 'Auto-remember files', desc: 'Automatically add files you open to your vault.' },
  { key: 'weeklySummary', label: 'Weekly summary', desc: 'Get a recap of what you worked on every week.' },
  { key: 'emailAlerts', label: 'Email notifications', desc: 'Receive important updates by email.' },
  { key: 'privateMode', label: 'Private mode', desc: 'Pause memory while you work on sensitive things.' },
]

export default function Settings() {
  const [profile, setProfile] = useState({ name: 'Sneha', email: 'sneha@example.com' })
  const [prefs, setPrefs] = useState<Prefs>({ autoRemember: true, weeklySummary: true, emailAlerts: false, privateMode: false })
  const [apps, setApps] = useState(connectedApps)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [cleared, setCleared] = useState(false)

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const toggleApp = (name: string, connected: boolean) =>
    setApps(apps.map((a) => (a.name === name ? { ...a, connected } : a)))

  const clearMemory = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setConfirmClear(false)
    setCleared(true)
  }

  return (
    <div className="max-w-[860px] px-7 py-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, memory and connected apps"
        action={
          <div className="flex items-center gap-3">
            <span role="status" className="text-sm text-[#5FD7A5]">{saved ? 'Saved' : ''}</span>
            <button type="button" className={primaryBtn} onClick={save}>Save changes</button>
          </div>
        }
      />

      <section className={`${panelCls} mb-5 p-6`}>
        <h2 className="mb-4 text-[17px] font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#8B6BFF] to-[#E56BC3] text-xl font-bold text-white">
            {profile.name.trim()[0]?.toUpperCase() ?? 'S'}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] text-muted">
              Name
              <input className={inputCls} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] text-muted">
              Email
              <input type="email" className={inputCls} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </label>
          </div>
        </div>
      </section>

      <section className={`${panelCls} mb-5 p-6`}>
        <h2 className="mb-2 text-[17px] font-semibold">Preferences</h2>
        {prefRows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 border-b border-line-soft py-3.5 last:border-b-0">
            <div>
              <div className="font-medium">{r.label}</div>
              <div className="text-[13px] text-muted">{r.desc}</div>
            </div>
            <Toggle label={r.label} checked={prefs[r.key]} onChange={(v) => setPrefs({ ...prefs, [r.key]: v })} />
          </div>
        ))}
      </section>

      <section className={`${panelCls} mb-5 p-6`}>
        <h2 className="mb-2 text-[17px] font-semibold">Connected apps</h2>
        {apps.map((a) => (
          <div key={a.name} className="flex items-center justify-between gap-4 border-b border-line-soft py-3.5 last:border-b-0">
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-[13px] text-muted">{a.description}</div>
            </div>
            <button type="button" onClick={() => toggleApp(a.name, !a.connected)} className={a.connected ? ghostBtn : primaryBtn}>
              {a.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-[14px] border border-[#5A2A3A] bg-[#1A0F1C] p-6">
        <h2 className="mb-1 text-[17px] font-semibold">Danger zone</h2>
        <p className="mb-4 text-[13px] text-muted">Clearing memory removes everything Rewind has remembered. This cannot be undone.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={clearMemory}
            className="min-h-[44px] rounded-lg bg-[#C23B5B] px-4 text-sm font-semibold text-white hover:bg-[#D44A6A]"
          >
            {confirmClear ? 'Click again to confirm' : 'Clear all memory'}
          </button>
          {confirmClear && (
            <button type="button" className={ghostBtn} onClick={() => setConfirmClear(false)}>Cancel</button>
          )}
          {cleared && <span role="status" className="text-sm text-muted">Memory cleared (demo only).</span>}
        </div>
      </section>
    </div>
  )
}
