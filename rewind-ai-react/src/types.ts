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
