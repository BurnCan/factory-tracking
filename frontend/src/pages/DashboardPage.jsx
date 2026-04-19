import { useEffect, useState } from 'react'
import { fetchDashboard } from '../api'
import StatCard from '../components/StatCard'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div style={{ color: '#b91c1c' }}>Dashboard error: {error}</div>
  }

  if (!data) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <StatCard label="Neck Trucks" value={data.total_neck_trucks} />
        <StatCard label="Body Trucks" value={data.total_body_trucks} />
        <StatCard label="Occupied Slots" value={data.occupied_slots} />
        <StatCard label="Empty Slots" value={data.empty_slots} />
      </div>
    </div>
  )
}
