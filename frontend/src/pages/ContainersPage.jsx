import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createContainer, fetchContainers } from '../api'

function normalizeCode(value) {
  return value.trim().toUpperCase()
}

export default function ContainersPage() {
  const [containers, setContainers] = useState([])
  const [filter, setFilter] = useState('all')
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadContainers() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchContainers()
      setContainers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContainers()
  }, [])

  const filteredContainers = useMemo(() => {
    if (filter === 'all') return containers
    return containers.filter((container) => container.container_type === filter)
  }, [containers, filter])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createContainer(normalizeCode(newCode))
      setNewCode('')
      await loadContainers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Containers</h1>

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="NT001 or BT001"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              minWidth: '180px'
            }}
          />
          <button
            type="submit"
            style={{
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            Create Container
          </button>
        </form>
      </div>

      <div style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label htmlFor="type-filter">Type:</label>
        <select
          id="type-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        >
          <option value="all">All</option>
          <option value="neck">Neck</option>
          <option value="body">Body</option>
        </select>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}

      {loading ? (
        <div>Loading containers...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Slots</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredContainers.map((container) => (
                <tr key={container.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{container.container_code}</td>
                  <td style={tdStyle}>{container.container_type}</td>
                  <td style={tdStyle}>{container.slot_count}</td>
                  <td style={tdStyle}>{container.status}</td>
                  <td style={tdStyle}>
                    <Link to={`/containers/${container.container_code}`} style={{ color: '#2563eb' }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredContainers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '18px', color: '#6b7280' }}>
                    No containers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: '14px'
}

const tdStyle = {
  padding: '14px 16px'
}
