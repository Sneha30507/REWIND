import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, getToken, setToken, setUnauthorizedHandler } from './api'
import { authApi } from './endpoints'
import { titleCase } from './format'
import type { AuthUser } from './types'

type Status = 'loading' | 'authenticated' | 'anonymous' | 'error'

interface AuthContextValue {
  status: Status
  user: AuthUser | null
  /** Friendly name shown in the UI (the backend only stores an email). */
  displayName: string
  /** Set when the backend could not be reached while restoring the session. */
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(getToken() ? 'loading' : 'anonymous')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    setError(null)
    setStatus('anonymous')
  }, [])

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) {
      setStatus('anonymous')
      return
    }
    let cancelled = false
    setStatus('loading')
    authApi
      .me()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setError(null)
        setStatus('authenticated')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearSession() // token expired or invalid
        } else {
          // Backend down etc.: keep the token so a retry can restore the session.
          setError(err instanceof Error ? err.message : 'Could not reach the server.')
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [attempt, clearSession])

  // Any later 401 (e.g. the token expires while the app is open) logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const token = await authApi.login(email, password)
    setToken(token.access_token)
    try {
      const me = await authApi.me()
      setUser(me)
      setError(null)
      setStatus('authenticated')
    } catch (err) {
      setToken(null)
      throw err
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password)
      await login(email, password)
    },
    [login],
  )

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      displayName: user ? titleCase(user.email.split('@')[0]) : '',
      error,
      login,
      register,
      logout: clearSession,
      retry,
    }),
    [status, user, error, login, register, clearSession, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
