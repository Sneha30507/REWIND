import type {
  Activity, ActivityEntry, ConnectedApp, NavItem, Project, QuickAction, Stat, VaultFile,
} from './types'

export const navItems: NavItem[] = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'My Projects', icon: 'folder', path: '/projects' },
  { label: 'AI Assistant', icon: 'sparkle', path: '/assistant' },
  { label: 'Knowledge Vault', icon: 'database', path: '/vault' },
  { label: 'Activity History', icon: 'clock', path: '/activity' },
  { label: 'Settings', icon: 'settings', path: '/settings' },
]

export const suggestions: string[] = [
  'Summarize my last project',
  'Find my code snippets',
  'What did I work on yesterday?',
]

export const quickActions: QuickAction[] = [
  {
    title: 'Search Code', description: 'Find any code snippet, function or file.', icon: 'code',
    to: '/assistant', query: 'Find my code snippets',
    cardClass: 'from-[#1F1B52] to-[#121232]', iconClass: 'bg-[#3A2F9A]',
  },
  {
    title: 'Summarize', description: 'Get a quick summary of your past work.', icon: 'doc',
    to: '/assistant', query: 'Summarize my last project',
    cardClass: 'from-[#10294A] to-[#0E1830]', iconClass: 'bg-[#1F6FC9]',
  },
  {
    title: 'Ask AI', description: 'Turn your past context into new ideas.', icon: 'sparkle',
    to: '/assistant',
    cardClass: 'from-[#2A1B52] to-[#16122E]', iconClass: 'bg-[#6A3FD0]',
  },
  {
    title: 'Upload & Remember', description: 'Add files, docs, or links to your knowledge vault.', icon: 'folder',
    to: '/vault',
    cardClass: 'from-[#0F3A38] to-[#0D2020]', iconClass: 'bg-[#139B6A]',
  },
]

export const projectColors = ['bg-[#4A52D6]', 'bg-[#5B47D8]', 'bg-[#8A4FD6]', 'bg-[#2F7FD0]', 'bg-[#139B6A]', 'bg-[#C0408F]']

export const projects: Project[] = [
  { id: 1, name: 'Weather Forecast Application', initial: 'W', colorClass: projectColors[0], tags: ['HTML', 'CSS', 'JS'], edited: '2 hours ago', description: 'Live weather dashboard with a 7-day forecast and city search.', progress: 80 },
  { id: 2, name: 'Online Voting System', initial: 'O', colorClass: projectColors[1], tags: ['React', 'JS', 'CSS'], edited: '1 day ago', description: 'Secure voting flow with an admin results panel.', progress: 65 },
  { id: 3, name: 'Personal Portfolio Website', initial: 'P', colorClass: projectColors[2], tags: ['HTML', 'CSS', 'JS'], edited: '2 days ago', description: 'Responsive portfolio with projects and a contact form.', progress: 90 },
  { id: 4, name: 'Final Year Project - AI Assistant', initial: 'F', colorClass: projectColors[3], tags: ['Python', 'FastAPI', 'React'], edited: '3 days ago', description: 'Chat assistant with document memory and search.', progress: 45 },
  { id: 5, name: 'Task Manager App', initial: 'T', colorClass: projectColors[4], tags: ['React', 'TypeScript'], edited: '5 days ago', description: 'Kanban-style task board with drag and drop.', progress: 55 },
  { id: 6, name: 'Expense Tracker', initial: 'E', colorClass: projectColors[5], tags: ['JS', 'CSS'], edited: '1 week ago', description: 'Track daily spending with monthly charts.', progress: 100 },
  { id: 7, name: 'Chat Application', initial: 'C', colorClass: projectColors[0], tags: ['Node', 'React'], edited: '2 weeks ago', description: 'Real-time chat rooms with typing indicators.', progress: 30 },
]

export const vaultFiles: VaultFile[] = [
  { id: 1, name: 'Project Notes.md', type: 'doc', size: '12 KB', added: '1 day ago' },
  { id: 2, name: 'weather.js', type: 'code', size: '4 KB', added: '2 hours ago' },
  { id: 3, name: 'React Documentation', type: 'link', size: '-', added: '2 days ago' },
  { id: 4, name: 'voting.tsx', type: 'code', size: '6 KB', added: '2 days ago' },
  { id: 5, name: 'Wireframe.png', type: 'image', size: '860 KB', added: '3 days ago' },
  { id: 6, name: 'Deployment Checklist.docx', type: 'doc', size: '48 KB', added: '4 days ago' },
  { id: 7, name: 'FastAPI Tutorial', type: 'link', size: '-', added: '5 days ago' },
  { id: 8, name: 'hooks.ts', type: 'code', size: '3 KB', added: '1 week ago' },
]

export const connectedApps: ConnectedApp[] = [
  { name: 'VS Code', description: 'Remember files and snippets you edit', connected: true },
  { name: 'Chrome', description: 'Remember pages and searches', connected: true },
  { name: 'Discord', description: 'Remember chats and shared links', connected: true },
  { name: 'GitHub', description: 'Sync repositories and commits', connected: true },
  { name: 'Notion', description: 'Import notes and docs', connected: true },
  { name: 'Slack', description: 'Remember workspace conversations', connected: false },
]

export const stats: Stat[] = [
  { value: projects.length, label: 'Projects' },
  { value: vaultFiles.length, label: 'Files Remembered' },
  { value: connectedApps.filter((a) => a.connected).length, label: 'Apps Connected' },
  { value: 24, label: 'Days Active' },
]

/** Short list shown on the Home right panel */
export const activities: Activity[] = [
  { title: 'Opened Weather Forecast App', time: '2 hours ago', icon: 'cloud' },
  { title: 'Searched for React components', time: '4 hours ago', icon: 'code' },
  { title: 'Summarized project notes', time: '1 day ago', icon: 'doc' },
  { title: 'Added new file to Knowledge Vault', time: '2 days ago', icon: 'database' },
  { title: 'Asked AI about deployment', time: '2 days ago', icon: 'sparkle' },
]

/** Full log shown on the Activity History page */
export const activityLog: ActivityEntry[] = [
  { id: 1, title: 'Opened Weather Forecast App', detail: 'Project', time: '2 hours ago', icon: 'cloud', kind: 'project', group: 'Today' },
  { id: 2, title: 'Edited weather.js', detail: 'Weather Forecast Application', time: '2 hours ago', icon: 'code', kind: 'project', group: 'Today' },
  { id: 3, title: 'Searched for React components', detail: 'Code search', time: '4 hours ago', icon: 'search', kind: 'search', group: 'Today' },
  { id: 4, title: 'Summarized project notes', detail: 'AI Assistant', time: '1 day ago', icon: 'doc', kind: 'ai', group: 'Yesterday' },
  { id: 5, title: 'Edited Online Voting System', detail: 'Project', time: '1 day ago', icon: 'folder', kind: 'project', group: 'Yesterday' },
  { id: 6, title: 'Added Wireframe.png', detail: 'Knowledge Vault', time: '2 days ago', icon: 'image', kind: 'vault', group: 'Earlier' },
  { id: 7, title: 'Asked AI about deployment', detail: 'AI Assistant', time: '2 days ago', icon: 'sparkle', kind: 'ai', group: 'Earlier' },
  { id: 8, title: 'Added new file to Knowledge Vault', detail: 'Deployment Checklist.docx', time: '2 days ago', icon: 'database', kind: 'vault', group: 'Earlier' },
  { id: 9, title: 'Searched for FastAPI auth', detail: 'Web search', time: '3 days ago', icon: 'search', kind: 'search', group: 'Earlier' },
  { id: 10, title: 'Updated Final Year Project', detail: 'Project', time: '3 days ago', icon: 'folder', kind: 'project', group: 'Earlier' },
]
