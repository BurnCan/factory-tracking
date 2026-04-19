const API_BASE = 'http://127.0.0.1:8003/api'

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed')
  }
  return data
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard/summary`)
  return handleResponse(res)
}

export async function fetchDeviations() {
  const res = await fetch(`${API_BASE}/dashboard/deviations`)
  return handleResponse(res)
}

export async function fetchRecentHistory() {
  const res = await fetch(`${API_BASE}/dashboard/recent-history`)
  return handleResponse(res)
}

export async function fetchContainers() {
  const res = await fetch(`${API_BASE}/containers`)
  return handleResponse(res)
}

export async function fetchContainer(code) {
  const res = await fetch(`${API_BASE}/containers/${code}`)
  return handleResponse(res)
}

export async function fetchHistory(code) {
  const res = await fetch(`${API_BASE}/containers/${code}/history`)
  return handleResponse(res)
}

export async function createContainer(containerCode, status = 'active') {
  const res = await fetch(`${API_BASE}/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ container_code: containerCode, status })
  })
  return handleResponse(res)
}

export async function updateSlot(code, slotNumber, partNumber, changedBy = 'operator') {
  const res = await fetch(`${API_BASE}/containers/${code}/slots/${slotNumber}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_number: partNumber, changed_by: changedBy })
  })
  return handleResponse(res)
}

export async function clearSlot(code, slotNumber, changedBy = 'operator') {
  const res = await fetch(
    `${API_BASE}/containers/${code}/slots/${slotNumber}?changed_by=${encodeURIComponent(changedBy)}`,
    { method: 'DELETE' }
  )
  return handleResponse(res)
}

export async function auditScan(code, slotNumber, partNumber, changedBy = 'operator') {
  const res = await fetch(`${API_BASE}/containers/${code}/audit-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot_number: slotNumber, part_number: partNumber || null, changed_by: changedBy })
  })
  return handleResponse(res)
}
