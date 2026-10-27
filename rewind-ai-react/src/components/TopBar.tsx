import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import Icon from './Icon'

export default function TopBar() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { displayName, logout } = useAuth()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate('/assistant', { state: { query: q.trim() } })
    setQ('')
  }

  return (
    <header className="flex items-center gap-5 border-b border-line px-7 py-4">
      <form
        onSubmit={onSubmit}
        className="flex min-h-[48px] flex-1 items-center gap-3 rounded-xl border border-[#26264A] bg-ink-700 px-4 text-muted"
      >
        <Icon name="search" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search or ask anything"
          placeholder="Search your files, chats, code, or ask anything..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#E8E8F5] outline-none placeholder:text-muted"
        />
        <span className="hidden rounded-md border border-[#33335C] px-2 py-[3px] text-xs text-muted sm:inline">
          Ctrl + K
        </span>
      </form>

      <Link to="/settings" className="flex items-center gap-2.5 font-medium hover:text-white">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#8B6BFF] to-[#E56BC3] font-bold text-white">
          {displayName[0] ?? '?'}
        </div>
        <span className="hidden sm:inline">{displayName}</span>
      </Link>
      <button
        type="button"
        onClick={logout}
        className="min-h-[44px] rounded-lg px-3 text-[13px] font-medium text-muted hover:text-white"
      >
        Log out
      </button>
    </header>
  )
}
