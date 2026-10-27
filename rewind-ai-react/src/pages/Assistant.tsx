import { FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import Icon from '../components/Icon'
import { projects, suggestions } from '../data'
import { inputCls } from '../ui'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
}

/**
 * DEMO ONLY: replace this with a call to your own AI / search backend.
 */
function craftReply(question: string): string {
  const t = question.toLowerCase()
  const p = projects[0]
  if (t.includes('summar')) {
    return `Your most recent project is "${p.name}" (${p.tags.join(', ')}), last edited ${p.edited}. ${p.description} It is about ${p.progress}% complete.`
  }
  if (t.includes('snippet') || t.includes('code')) {
    return 'I found 3 snippets in your Knowledge Vault: a fetch helper in weather.js, a custom hook in hooks.ts, and a vote counter in voting.tsx. Want me to open one?'
  }
  if (t.includes('yesterday')) {
    return 'Yesterday you edited "Online Voting System" and summarized your project notes with the AI Assistant.'
  }
  if (t.includes('deploy')) {
    return 'From your Deployment Checklist: run the production build, set environment variables, then upload the dist folder to your host.'
  }
  return 'This is a demo reply. Connect a real AI backend in craftReply() inside src/pages/Assistant.tsx to answer from your own memory.'
}

export default function Assistant() {
  const location = useLocation()
  const { displayName } = useAuth()
  const initialQuery = (location.state as { query?: string } | null)?.query
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: `Hi ${displayName}! Ask me about your projects, files or anything you worked on before.` },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const nextId = useRef(1)
  const started = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const send = (text: string) => {
    const q = text.trim()
    if (!q) return
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: q }])
    setTyping(true)
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', text: craftReply(q) }])
      setTyping(false)
    }, 800)
  }

  useEffect(() => {
    if (initialQuery && !started.current) {
      started.current = true
      send(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, typing])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    send(input)
    setInput('')
  }

  return (
    <div className="flex min-h-[560px] flex-1 flex-col lg:min-h-0">
      <div className="border-b border-line px-7 py-4">
        <h1 className="text-xl font-bold">AI Assistant</h1>
        <p className="text-[13px] text-dim">Demo mode: replies are simulated.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6" aria-live="polite">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${
                m.role === 'user'
                  ? 'self-end rounded-br-md bg-brand text-white'
                  : 'self-start rounded-bl-md border border-line-card bg-ink-800'
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="flex w-fit gap-1.5 self-start rounded-2xl rounded-bl-md border border-line-card bg-ink-800 px-4 py-4" aria-label="Assistant is typing">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-2 w-2 animate-pulse rounded-full bg-brand-link" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-line px-7 py-4">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="min-h-[44px] rounded-full border border-line-strong bg-ink-700 px-4 text-[13px] font-medium text-[#D0D0EA] hover:border-brand"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message"
              placeholder="Ask Rewind anything..."
              className={`${inputCls} flex-1`}
            />
            <button type="submit" aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#7E5BFF] text-white hover:bg-brand-hover">
              <Icon name="send" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
