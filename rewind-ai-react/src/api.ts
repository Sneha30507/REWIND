/**
 * Small API client for the Rewind AI backend (FastAPI).
 *
 * - The backend address comes from VITE_API_BASE_URL (see .env.example).
 * - The login token is kept in localStorage and attached automatically.
 * - Backend errors ({ error: { code, message, details } }) become ApiError.
 * - If the backend is unreachable, ApiError has status 0 and a readable message.
 * - A 401 on a request that carried a token (expired / invalid token) calls the
 *   handler registered with setUnauthorizedHandler so the app can log out.
 *
 * Security note: localStorage is readable by any script on the page (XSS).
 * That is acceptable for local development; use short token lifetimes and see
 * the README before deploying.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Backend address. Set VITE_API_BASE_URL in .env to change it. */
export const API_BASE_URL = (rawBaseUrl && rawBaseUrl.trim() ? rawBaseUrl.trim() : 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

const TOKEN_KEY = 'rewind.token'

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode): the user simply has to log in again */
  }
}

let unauthorizedHandler: (() => void) | null = null

/** Called when the backend rejects the stored token. Pass null to unregister. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export interface ApiErrorDetail {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: ApiErrorDetail[]

  constructor(status: number, message: string, code?: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Will be sent as JSON */
  body?: unknown
  /** Set to false for login/register so no stored token is attached. Default true. */
  auth?: boolean
}

function describeError(status: number, data: unknown): ApiError {
  const err = (data as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null)?.error
  let message = err?.message ?? `Request failed (${status})`
  if (err?.details?.length) {
    message = err.details
      .map((d) => {
        const field = d.field.split('.').pop()
        return field && field !== 'body' ? `${field}: ${d.message}` : d.message
      })
      .join('; ')
  }
  return new ApiError(status, message, err?.code, err?.details)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, auth = true, ...rest } = options
  const token = auth ? getToken() : null

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${API_BASE_URL}. Make sure the backend is running.`)
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token && unauthorizedHandler) unauthorizedHandler()
    throw describeError(response.status, data)
  }
  return data as T
}
