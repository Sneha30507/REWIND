/**
 * Tiny helper for talking to the Rewind AI backend (FastAPI).
 *
 * NOT used by any page yet. The dashboard still shows its mock data from
 * data.ts until we connect it in a later step. See backend/README.md for usage.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Backend address. Set VITE_API_BASE_URL in .env to change it. */
export const API_BASE_URL = (rawBaseUrl && rawBaseUrl.trim() ? rawBaseUrl.trim() : 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JWT from POST /api/auth/login */
  token?: string
  /** Will be sent as JSON */
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? `Request failed (${response.status})`)
  }
  return data as T
}
