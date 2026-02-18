import React, { useState } from 'react'

function useFetchRaw(path) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  async function fetchIt() {
    setError(null)
    setStatus('fetching')
    try {
      const res = await fetch(path)
      setStatus(`${res.status} ${res.statusText}`)
      const text = await res.text()
      setData(text)
    } catch (e) {
      setError(String(e))
      setStatus('error')
    }
  }

  return { data, status, error, fetchIt }
}

export default function Debug() {
  const users = useFetchRaw((import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000') + '/users')
  const appointments = useFetchRaw((import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000') + '/appointments')

  return (
    <div>
      <h1>Debug API</h1>
      <p>Click Refresh to fetch raw responses from the backend.</p>

      <div className="panel">
        <div className="panel-title">/users — Status: {users.status}</div>
        <div style={{marginTop:8}}>
          <button onClick={users.fetchIt}>Refresh Users</button>
        </div>
        <pre style={{whiteSpace:'pre-wrap',marginTop:12}}>{users.error ? `Error: ${users.error}` : users.data}</pre>
      </div>

      <div className="panel" style={{marginTop:12}}>
        <div className="panel-title">/appointments — Status: {appointments.status}</div>
        <div style={{marginTop:8}}>
          <button onClick={appointments.fetchIt}>Refresh Appointments</button>
        </div>
        <pre style={{whiteSpace:'pre-wrap',marginTop:12}}>{appointments.error ? `Error: ${appointments.error}` : appointments.data}</pre>
      </div>
    </div>
  )
}
