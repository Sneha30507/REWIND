import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Activity from './pages/Activity'
import Assistant from './pages/Assistant'
import Auth from './pages/Auth'
import Home from './pages/Home'
import MemoryDetail from './pages/MemoryDetail'
import NotFound from './pages/NotFound'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'
import Settings from './pages/Settings'
import Vault from './pages/Vault'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Auth mode="login" />} />
      <Route path="register" element={<Auth mode="register" />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="vault" element={<Vault />} />
          <Route path="vault/:id" element={<MemoryDetail />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
