import { NavLink } from 'react-router-dom'
import { navItems } from '../data'
import Icon from './Icon'

export default function Sidebar() {
  return (
    <aside className="flex flex-row flex-wrap items-center gap-1.5 border-b border-line bg-ink-900 p-5 lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="mr-4 flex items-center gap-2.5 text-[22px] font-bold text-white lg:mb-[22px] lg:mr-0">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[34px] w-[34px] fill-none stroke-[#8B6BFF]"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5l-7 7 7 7M20 5l-7 7 7 7" />
        </svg>
        Rewind AI
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center gap-3 rounded-[10px] px-3.5 text-[15px] transition-colors ${
              isActive ? 'bg-brand-dark text-white' : 'text-muted hover:bg-[#15152E] hover:text-white'
            }`
          }
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}

      <div className="mt-auto hidden rounded-[14px] border border-[#26264A] bg-gradient-to-br from-[#17163A] to-[#0E0E24] p-5 lg:block">
        <Icon name="sparkle" className="h-[26px] w-[26px] text-brand-accent" />
        <h3 className="mb-2 mt-2.5 text-[19px] font-semibold leading-tight">
          Your ideas.
          <br />
          Never lost again.
        </h3>
        <p className="mb-[18px] leading-normal text-muted">
          Rewind AI remembers so you can focus on what matters.
        </p>
        <button
          type="button"
          className="min-h-[44px] w-full rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Upgrade to Pro
        </button>
      </div>
    </aside>
  )
}
