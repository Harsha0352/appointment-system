import React, { useEffect, useState } from 'react'
import { fetchAppointments, fetchUsers } from '../api'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const a = await fetchAppointments()
        if (!mounted) return
        setAppointments(a || [])

        const u = await fetchUsers()
        if (!mounted) return
        setUsers(u || [])
      } catch (e) {
        console.error(e)
        if (mounted) setError(e.message || String(e))
      } finally {
        mounted && setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  function userFor(user_id) {
    const u = users.find((x) => x.id === user_id)
    return u ? u.name : `Member ${user_id}`
  }

  return (
    <div>
      <h1>Appointments</h1>
      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="muted">Error loading appointments: {error}</div>
        ) : appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <ul className="list">
            {appointments.map((a) => (
              <li key={a.id} className="list-item">
                <div>
                  <div className="item-title">{userFor(a.user_id)} — {a.purpose}</div>
                  <div className="muted">{a.appointment_date} · {a.appointment_time} · <strong>{a.status}</strong></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
