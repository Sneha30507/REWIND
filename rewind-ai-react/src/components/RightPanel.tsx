import { Link } from 'react-router-dom'
import { activities, stats } from '../data'
import Icon from './Icon'

export default function RightPanel() {
  return (
    <aside className="flex flex-col gap-5 border-t border-line bg-[#0B0B1B] p-5 lg:border-l lg:border-t-0">
      <div className="rounded-[14px] border border-line-card bg-ink-800 p-5">
        <h2 className="mb-[18px] text-[17px] font-semibold">Workspace Overview</h2>
        <div className="grid grid-cols-2 gap-5">
          {stats.map((s) => (
            <div key={s.label}>
              <b className="block text-[22px]">{s.value}</b>
              <span className="text-xs text-[#A0A0C0]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-line-card bg-ink-800 p-5">
        <h2 className="mb-[18px] flex items-center justify-between text-[17px] font-semibold">
          Recent Activity
          <Link to="/activity" className="text-xs font-medium text-brand-link hover:underline">
            View all
          </Link>
        </h2>
        {activities.map((a) => (
          <div key={a.title} className="flex items-center gap-3.5 py-[9px]">
            <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#1B1B42] text-brand-link">
              <Icon name={a.icon} />
            </div>
            <div>
              <b className="block text-sm font-medium">{a.title}</b>
              <span className="text-xs text-dim">{a.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-[230px] flex-col justify-between rounded-[14px] bg-gradient-to-b from-[#4B2F9E] to-[#1A1240] p-6">
        <div>
          <h3 className="mb-2 text-[22px] font-semibold leading-tight">
            Small steps,
            <br />
            big dreams.
          </h3>
          <p className="text-[13px] text-[#CFC5F5]">Rewind helps you build them.</p>
        </div>
        <div className="font-bold text-white">Rewind AI</div>
      </div>
    </aside>
  )
}
