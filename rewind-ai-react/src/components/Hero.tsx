import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { suggestions } from '../data'
import Icon from './Icon'

export default function Hero() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate('/assistant', { state: { query: query.trim() } })
  }

  return (
    <section className="bg-[radial-gradient(60%_90%_at_85%_20%,#3A1F94_0%,#0A0A18_70%)] px-7 pb-9 pt-11">
      <div className="text-[13px] font-semibold tracking-[0.08em] text-[#8B6BFF]">YOUR AI POWERED MEMORY</div>
      <h1 className="mb-3.5 mt-3 text-[30px] font-extrabold leading-[1.15] tracking-tight sm:text-[40px]">
        Rewind your work.
        <br />
        Move forward <span className="text-brand-accent">smarter.</span>
      </h1>
      <p className="mb-6 max-w-[460px] text-base leading-relaxed text-[#B4B4D2]">
        Rewind AI helps you revisit, search, and build on your past work, across apps, files, and conversations.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-[60px] max-w-[620px] items-center gap-3 rounded-[14px] border border-[#3A3A78] bg-[#14143A] py-0 pl-[18px] pr-2.5 text-muted"
      >
        <Icon name="sparkle" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Rewind anything..."
          aria-label="Ask Rewind anything"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[#E8E8F5] outline-none placeholder:text-muted"
        />
        <button type="submit" aria-label="Send" className="grid h-11 w-11 place-items-center rounded-full bg-[#7E5BFF] text-white hover:bg-brand-hover">
          <Icon name="arrow" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => navigate('/assistant', { state: { query: s } })}
            className="min-h-[44px] rounded-full border border-line-strong bg-ink-700 px-4 text-[13px] font-medium text-[#D0D0EA] hover:border-brand"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  )
}
