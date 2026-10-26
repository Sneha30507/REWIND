import type { IconName } from '../types'

const paths: Record<IconName, string> = {
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  folder: 'M3 6h6l2 2h10v11H3z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  database: 'M4 6c0-3 16-3 16 0v12c0 3-16 3-16 0zM4 12c0 3 16 3 16 0',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  doc: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
  cloud: 'M7 18h10a4 4 0 000-8 6 6 0 00-11-1 4.5 4.5 0 001 9z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4',
  send: 'M4 12l16-8-6 16-3-7z',
  check: 'M5 12l5 5 9-10',
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 4-6 8-6s8 2 8 6',
  bell: 'M6 16v-5a6 6 0 0112 0v5l2 2H4zM10 21h4',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
}

interface IconProps {
  name: IconName
  className?: string
}

export default function Icon({ name, className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 fill-none stroke-current ${className}`}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
