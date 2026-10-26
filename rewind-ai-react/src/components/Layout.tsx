import { Outlet, useLocation } from 'react-router-dom'
import RightPanel from './RightPanel'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isChat = pathname === '/assistant'

  return (
    <div
      className={`grid min-h-screen grid-cols-1 ${
        isHome ? 'lg:grid-cols-[240px_minmax(0,1fr)_340px]' : 'lg:grid-cols-[240px_minmax(0,1fr)]'
      }`}
    >
      <Sidebar />
      <main className={`flex min-w-0 flex-col ${isChat ? 'lg:h-screen' : ''}`}>
        <TopBar />
        <Outlet />
      </main>
      {isHome && <RightPanel />}
    </div>
  )
}
