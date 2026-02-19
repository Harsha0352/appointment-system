import React, { useEffect, useState } from 'react'
import { fetchAppointments, fetchUsers } from '../api'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [longLoading, setLongLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLongLoading(true), 3000)

    let mounted = true
      ; (async () => {
        try {
          console.log('Fetching appointments and users...')
          // Parallel fetching optimization
          const [a, u] = await Promise.all([fetchAppointments(), fetchUsers()])

          console.log('Appointments fetched:', a)
          console.log('Users fetched:', u)

          if (!mounted) return
          setAppointments(a || [])
          setUsers(u || [])
        } catch (e) {
          console.error('Error fetching data:', e)
          if (mounted) setError(e.message || String(e))
        } finally {
          mounted && setLoading(false)
          clearTimeout(timer)
        }
      })()
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  function userFor(user_id) {
    const u = users.find((x) => x.id === user_id)
    return u ? u.name : `Member ${user_id}`
  }

  // TARTA Table Logic
  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <div className="table-title">All Appointments</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="text-muted" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading appointments...</div>
            {longLoading && (
              <div style={{ color: '#eab308', maxWidth: '400px', margin: '0 auto' }}>
                The server is waking up from sleep mode (Free Tier). This may take up to 30-60 seconds. Please wait...
              </div>
            )}
          </div>
        ) : error ? (
          <div style={{ padding: '24px', color: 'red' }}>Error: {error}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Purpose</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>APT{String(a.id).padStart(3, '0')}</td>
                  <td>
                    <div className="font-bold">{userFor(a.user_id)}</div>
                    <div className="text-muted text-sm">ID: {a.user_id}</div>
                  </td>
                  <td>{a.purpose}</td>
                  <td>
                    <div className="font-bold">{a.appointment_date}</div>
                    <div className="text-muted text-sm">{a.appointment_time}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.status === 'Booked' ? 'success' : 'danger'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>No appointments found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
