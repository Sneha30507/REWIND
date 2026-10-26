import { Link } from 'react-router-dom'
import { quickActions } from '../data'
import Icon from './Icon'
import SectionHeader from './SectionHeader'

export default function QuickActions() {
  return (
    <section className="px-7 pt-[26px]">
      <SectionHeader title="Quick Actions" to="/assistant" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {quickActions.map((a) => (
          <Link
            key={a.title}
            to={a.to}
            state={a.query ? { query: a.query } : undefined}
            className={`flex min-h-[148px] flex-col items-start gap-1.5 rounded-[14px] border border-[#2A2A55] bg-gradient-to-br p-[18px] text-left transition-transform hover:-translate-y-0.5 ${a.cardClass}`}
          >
            <div className={`grid h-10 w-10 place-items-center rounded-[10px] text-white ${a.iconClass}`}>
              <Icon name={a.icon} />
            </div>
            <h3 className="mt-3 text-base font-semibold">{a.title}</h3>
            <p className="text-[13px] leading-normal text-muted">{a.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
