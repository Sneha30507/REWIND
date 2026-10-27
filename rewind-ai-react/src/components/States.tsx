import type { ReactNode } from 'react'
import { ghostBtn, panelCls } from '../ui'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" className={`${panelCls} p-10 text-center text-muted`}>
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-[14px] border border-[#5A2A3A] bg-[#1A0F1C] p-8 text-center">
      <p className="mb-4 text-[#F2B8C6]">{message}</p>
      {onRetry && (
        <button type="button" className={ghostBtn} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={`${panelCls} p-10 text-center text-muted`}>{children}</div>
}

/** Small inline error (form submit failures, failed deletes). */
export function InlineError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="text-[13px] text-[#F2B8C6]">
      {message}
    </p>
  )
}
