import { useEffect, useMemo, useState } from 'react'
import { auditScan, closeWorkSession, fetchContainer, fetchDeviations, fetchRecentHistory } from '../api'

function secondsToClock(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export default function DashboardPage() {
  const [step, setStep] = useState(1)
  const [employeeId, setEmployeeId] = useState('')
  const [workCenter, setWorkCenter] = useState('')
  const [truckCode, setTruckCode] = useState('')
  const [countInput, setCountInput] = useState('')
  const [container, setContainer] = useState(null)
  const [deviations, setDeviations] = useState([])
  const [recentHistory, setRecentHistory] = useState([])
  const [auditSlot, setAuditSlot] = useState('')
  const [auditPart, setAuditPart] = useState('')
  const [error, setError] = useState('')
  const [timerStart, setTimerStart] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (timerStart) {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000)
        setElapsedSeconds(elapsed)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerStart])

  async function refreshOpsData() {
    const [deviationData, historyData] = await Promise.all([fetchDeviations(), fetchRecentHistory()])
    setDeviations(deviationData)
    setRecentHistory(historyData)
  }

  useEffect(() => {
    refreshOpsData().catch(() => {})
  }, [])

  const occupiedCount = useMemo(() => {
    if (!container?.slots) return 0
    return container.slots.filter((slot) => slot.part_number).length
  }, [container])

  async function handleTruckLookup(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await fetchContainer(truckCode.trim().toUpperCase())
      setContainer(data)
      setStep(4)
    } catch (err) {
      setError(err.message)
    }
  }

  function beginWork() {
    setTimerStart(Date.now())
    setElapsedSeconds(0)
    setStep(6)
  }

  async function closeTruck() {
    if (!container) return

    setError('')
    try {
      await closeWorkSession(container.container_code, {
        work_center: workCenter,
        product_count: occupiedCount,
        elapsed_seconds: elapsedSeconds,
        completed_by: employeeId || 'operator',
      })
      await refreshOpsData()
    } catch (err) {
      setError(err.message)
      return
    }

    setTimerStart(null)
    setElapsedSeconds(0)
    setTruckCode('')
    setCountInput('')
    setContainer(null)
    setAuditSlot('')
    setAuditPart('')
    setStep(3)
  }

  function evaluateCount(e) {
    e.preventDefault()
    const scannedCount = Number.parseInt(countInput, 10)
    if (Number.isNaN(scannedCount)) {
      setError('Please enter a valid number of products.')
      return
    }

    setError('')
    if (scannedCount === occupiedCount) {
      setStep(5)
    } else {
      setStep(7)
    }
  }

  async function handleAuditScan(e) {
    e.preventDefault()
    if (!container) return

    const slotNumber = Number.parseInt(auditSlot, 10)
    if (Number.isNaN(slotNumber)) {
      setError('Please enter a valid slot number for the audit scan.')
      return
    }

    setError('')
    try {
      await auditScan(container.container_code, slotNumber, auditPart.trim(), employeeId || 'operator')
      const latest = await fetchContainer(container.container_code)
      setContainer(latest)
      await refreshOpsData()
      setAuditPart('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <h1 style={{ marginTop: 0 }}>Operator Dashboard</h1>

      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); if (employeeId.trim()) setStep(2) }}>
          <h2>Step 1: Scan/Enter Employee ID</h2>
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID" />
          <button type="submit" style={{ marginLeft: 10 }}>Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (workCenter.trim()) setStep(3) }}>
          <h2>Step 2: Enter Work Center</h2>
          <input value={workCenter} onChange={(e) => setWorkCenter(e.target.value)} placeholder="Work Center" />
          <button type="submit" style={{ marginLeft: 10 }}>Continue</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleTruckLookup}>
          <h2>Step 3: Scan Into Truck</h2>
          <input value={truckCode} onChange={(e) => setTruckCode(e.target.value)} placeholder="Truck code (NT001/BT001)" />
          <button type="submit" style={{ marginLeft: 10 }}>Load Truck</button>
        </form>
      )}

      {step === 4 && container && (
        <form onSubmit={evaluateCount}>
          <h2>Step 4: Enter Number of Products On Truck</h2>
          <input value={countInput} onChange={(e) => setCountInput(e.target.value)} placeholder="Count" />
          <button type="submit" style={{ marginLeft: 10 }}>Validate Count</button>
        </form>
      )}

      {step === 5 && container && (
        <div>
          <h2>Step 5: Count Matches — Begin Work</h2>
          <p>Employee <strong>{employeeId}</strong> at <strong>{workCenter}</strong> is ready on truck <strong>{container.container_code}</strong>.</p>
          <button onClick={beginWork}>Begin Work & Start Timer</button>
        </div>
      )}

      {step === 6 && container && (
        <div>
          <h2>Active Work Session</h2>
          <div>Truck: <strong>{container.container_code}</strong></div>
          <div>Timer: <strong>{secondsToClock(elapsedSeconds)}</strong></div>
          <button style={{ marginTop: 10 }} onClick={closeTruck}>Close Truck</button>
        </div>
      )}

      {step === 7 && container && (
        <div>
          <h2>Step 5: Count Mismatch — Audit Truck</h2>
          <p>Expected from scan: <strong>{countInput}</strong>, system assigned: <strong>{occupiedCount}</strong>.</p>
          <form onSubmit={handleAuditScan}>
            <input
              value={auditSlot}
              onChange={(e) => setAuditSlot(e.target.value)}
              placeholder="Slot number"
              style={{ marginRight: 8 }}
            />
            <input
              value={auditPart}
              onChange={(e) => setAuditPart(e.target.value)}
              placeholder="Scanned product (leave blank for missing)"
              style={{ marginRight: 8, width: 260 }}
            />
            <button type="submit">Apply Audit Scan</button>
          </form>
          <div style={{ marginTop: 10 }}>
            <button onClick={beginWork}>Begin Work After Audit</button>
          </div>
        </div>
      )}

      <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <h2 style={{ marginTop: 0 }}>Deviations</h2>
        {deviations.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No deviations logged.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {deviations.slice(0, 20).map((item) => (
              <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                <strong>Code {item.code}</strong> — {item.truck_code} slot {item.slot_number || '-'} part {item.part_number || '-'}
                <div style={{ color: '#4b5563' }}>{item.details}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <h2 style={{ marginTop: 0 }}>Recent History</h2>
        {recentHistory.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No recent history yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recentHistory.slice(0, 20).map((entry, index) => (
              <div key={`${entry.action}-${entry.truck_code}-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                {entry.type === 'work_completed' ? (
                  <>
                    <strong>{entry.truck_code}</strong> work completed at <strong>{entry.work_center}</strong>
                    <div style={{ color: '#4b5563' }}>
                      Products: {entry.product_count} • Elapsed: {secondsToClock(entry.elapsed_seconds)}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>{entry.truck_code}-{entry.slot_number}</strong> {entry.action}: {entry.old_part_number || 'Empty'} → {entry.new_part_number || 'Empty'}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
