import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Activity from './pages/Activity'
import Assistant from './pages/Assistant'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Projects from './pages/Projects'
import Settings from './pages/Settings'
import Vault from './pages/Vault'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="vault" element={<Vault />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
