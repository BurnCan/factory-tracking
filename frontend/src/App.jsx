import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ContainersPage from './pages/ContainersPage'
import ContainerDetailPage from './pages/ContainerDetailPage'

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 24px',
  background: '#111827',
  color: 'white'
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px'
}

export default function App() {
  return (
    <BrowserRouter>
      <nav style={navStyle}>
        <strong>Factory Tracking</strong>
        <Link to="/">Dashboard</Link>
        <Link to="/containers">Containers</Link>
      </nav>

      <main style={containerStyle}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/containers/:code" element={<ContainerDetailPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
