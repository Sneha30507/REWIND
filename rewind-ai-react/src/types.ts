export type IconName =
  | 'home' | 'folder' | 'sparkle' | 'database' | 'clock' | 'settings'
  | 'search' | 'arrow' | 'code' | 'doc' | 'cloud' | 'plus' | 'trash'
  | 'upload' | 'link' | 'image' | 'send' | 'check' | 'user' | 'bell' | 'shield'

export interface NavItem {
  label: string
  icon: IconName
  path: string
}

export interface QuickAction {
  title: string
  description: string
  icon: IconName
  to: string
  /** optional question sent to the AI Assistant page */
  query?: string
  cardClass: string
  iconClass: string
}

export interface Project {
  id: number
  name: string
  initial: string
  colorClass: string
  tags: string[]
  edited: string
  description: string
  progress: number
}

export interface Activity {
  title: string
  time: string
  icon: IconName
}

export type ActivityKind = 'project' | 'ai' | 'vault' | 'search'
export type ActivityGroup = 'Today' | 'Yesterday' | 'Earlier'

export interface ActivityEntry {
  id: number
  title: string
  detail: string
  time: string
  icon: IconName
  kind: ActivityKind
  group: ActivityGroup
}

export type VaultType = 'doc' | 'code' | 'link' | 'image'

export interface VaultFile {
  id: number
  name: string
  type: VaultType
  size: string
  added: string
}

export interface Stat {
  value: number
  label: string
}

export interface ConnectedApp {
  name: string
  description: string
  connected: boolean
}

/* ---------- Backend (FastAPI) records ---------- */

export interface AuthUser {
  id: number
  email: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface DeleteResult {
  deleted: boolean
  id: number
}

export interface MemoryInput {
  title: string
  content: string
  category: string
  tags: string[]
}

export interface MemoryRecord extends MemoryInput {
  id: number
  created_at: string
  updated_at: string
}

export interface CategoryCount {
  category: string
  count: number
}

export interface CategoryList {
  items: CategoryCount[]
  total: number
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed'

export interface ProjectInput {
  title: string
  description: string
  status: ProjectStatus
  progress: number
  tags: string[]
}

export interface ProjectRecord extends ProjectInput {
  id: number
  created_at: string
  updated_at: string
}
