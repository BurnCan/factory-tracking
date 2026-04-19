import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clearSlot, fetchContainer, fetchHistory, updateSlot } from '../api'
import SlotGrid from '../components/SlotGrid'

export default function ContainerDetailPage() {
  const { code } = useParams()
  const [container, setContainer] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setError('')
    try {
      const [containerData, historyData] = await Promise.all([
        fetchContainer(code),
        fetchHistory(code)
      ])
      setContainer(containerData)
      setHistory(historyData)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [code])

  async function handleSelectSlot(slot) {
    const currentValue = slot.part_number || ''
    const nextValue = window.prompt(
      `Enter part number for slot ${slot.slot_number}. Leave blank to clear it.`,
      currentValue
    )

    if (nextValue === null) return

    setSaving(true)
    setError('')
    try {
      if (nextValue.trim() === '') {
        await clearSlot(code, slot.slot_number, 'matt')
      } else {
        await updateSlot(code, slot.slot_number, nextValue.trim(), 'matt')
      }
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return <div style={{ color: '#b91c1c' }}>Container error: {error}</div>
  }

  if (!container) {
    return <div>Loading container...</div>
  }

  const occupiedCount = container.slots.filter((slot) => slot.part_number).length

  return (
    <div>
      <Link to="/containers" style={{ color: '#2563eb' }}>← Back to containers</Link>

      <div
        style={{
          marginTop: '16px',
          background: 'white',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '10px' }}>{container.container_code}</h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: '#4b5563' }}>
          <div>Type: <strong>{container.container_type}</strong></div>
          <div>Total Slots: <strong>{container.slot_count}</strong></div>
          <div>Occupied: <strong>{occupiedCount}</strong></div>
          <div>Status: <strong>{container.status}</strong></div>
        </div>
        {saving && <div style={{ marginTop: '12px', color: '#2563eb' }}>Saving slot change...</div>}
      </div>

      <section style={{ marginTop: '20px' }}>
        <h2>Slots</h2>
        <SlotGrid slots={container.slots} onSelectSlot={handleSelectSlot} />
      </section>

      <section
        style={{
          marginTop: '24px',
          background: 'white',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}
      >
        <h2 style={{ marginTop: 0 }}>Recent History</h2>
        {history.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No slot changes yet.</div>
  ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {history.slice(0, 20).map((item, index) => (
              <div
                key={`${item.slot_number}-${item.changed_at}-${index}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Slot {item.slot_number} — {item.action}
                </div>
                <div style={{ color: '#4b5563', marginTop: '4px' }}>
                  {item.old_part_number || 'Empty'} → {item.new_part_number || 'Empty'}
                </div>
                <div style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
                  Changed by {item.changed_by} at {new Date(item.changed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
