import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { InlineError } from '../components/States'
import { errorMessage } from '../format'
import { inputCls, panelCls, primaryBtn } from '../ui'

/** Login and registration share one form; `mode` picks the wording and the API call. */
export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { status, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  if (status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (isRegister) await register(email.trim(), password)
      else await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(60%_90%_at_85%_20%,#3A1F94_0%,#0A0A18_70%)] px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-[26px] font-bold text-white">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-[34px] w-[34px] fill-none stroke-[#8B6BFF]"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5l-7 7 7 7M20 5l-7 7 7 7" />
          </svg>
          Rewind AI
        </div>

        <form onSubmit={onSubmit} className={`${panelCls} flex flex-col gap-4 p-7`} noValidate>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-muted">
              {isRegister ? 'Start building your memory.' : 'Log in to see your projects and memories.'}
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Email
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Password
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            />
          </label>

          <InlineError message={error} />

          <button type="submit" className={`${primaryBtn} disabled:opacity-60`} disabled={busy}>
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="text-center text-[13px] text-muted">
            {isRegister ? 'Already have an account? ' : 'New to Rewind AI? '}
            <Link
              to={isRegister ? '/login' : '/register'}
              state={location.state}
              className="font-medium text-brand-link hover:underline"
            >
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
