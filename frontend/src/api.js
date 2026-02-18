const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

async function request(path, opts) {
  const url = `${API_BASE}${path}`
  try {
    const res = await fetch(url, opts)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || res.statusText)
    }
    return res.json()
  } catch (err) {
    console.error('API request failed:', url, err)
    throw err
  }
}

export function fetchUsers() {
  return request('/users')
}

export function fetchAppointments() {
  return request('/appointments')
}

export function fetchLogs() {
  return request('/logs')
}

export async function sendChat(message, model = 'gpt-3.5-turbo') {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model }),
  })
}
