/** One typed function per backend endpoint. Pages call these, never fetch() directly. */
import { apiRequest } from './api'
import type {
  AuthUser, CategoryList, DeleteResult, MemoryInput, MemoryRecord, Page,
  ProjectInput, ProjectRecord, ProjectStatus, TokenResponse,
} from './types'

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const authApi = {
  register: (email: string, password: string) =>
    apiRequest<AuthUser>('/api/auth/register', { method: 'POST', body: { email, password }, auth: false }),
  login: (email: string, password: string) =>
    apiRequest<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => apiRequest<AuthUser>('/api/auth/me'),
}

export interface MemoryQuery {
  q?: string
  category?: string
  limit?: number
  offset?: number
}

export const memoriesApi = {
  /** Uses /search when there is search text, otherwise the plain list. */
  list: ({ q, category, limit = 20, offset = 0 }: MemoryQuery = {}) => {
    const text = q?.trim()
    return apiRequest<Page<MemoryRecord>>(
      `/api/memories${text ? '/search' : ''}${qs({ q: text, category, limit, offset })}`,
    )
  },
  categories: () => apiRequest<CategoryList>('/api/memories/categories'),
  get: (id: number) => apiRequest<MemoryRecord>(`/api/memories/${id}`),
  create: (body: MemoryInput) => apiRequest<MemoryRecord>('/api/memories', { method: 'POST', body }),
  update: (id: number, body: MemoryInput) =>
    apiRequest<MemoryRecord>(`/api/memories/${id}`, { method: 'PUT', body }),
  remove: (id: number) => apiRequest<DeleteResult>(`/api/memories/${id}`, { method: 'DELETE' }),
}

export interface ProjectQuery {
  q?: string
  status?: ProjectStatus
  limit?: number
  offset?: number
}

export const projectsApi = {
  list: ({ q, status, limit = 20, offset = 0 }: ProjectQuery = {}) =>
    apiRequest<Page<ProjectRecord>>(`/api/projects${qs({ q: q?.trim(), status, limit, offset })}`),
  get: (id: number) => apiRequest<ProjectRecord>(`/api/projects/${id}`),
  create: (body: ProjectInput) => apiRequest<ProjectRecord>('/api/projects', { method: 'POST', body }),
  update: (id: number, body: ProjectInput) =>
    apiRequest<ProjectRecord>(`/api/projects/${id}`, { method: 'PUT', body }),
  remove: (id: number) => apiRequest<DeleteResult>(`/api/projects/${id}`, { method: 'DELETE' }),
}
