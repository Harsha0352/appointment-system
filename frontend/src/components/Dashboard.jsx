import React, { useEffect, useState } from 'react'
import { fetchUsers, fetchAppointments } from '../api'

export default function Dashboard() {
  const [users, setUsers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const u = await fetchUsers()
        if (!mounted) return
        setUsers(u || [])

        const a = await fetchAppointments()
        if (!mounted) return
        setAppointments(a || [])
      } catch (e) {
        console.error(e)
        if (mounted) setError(e.message || String(e))
      } finally {
        mounted && setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  const totalUsers = users.length
  const totalAppointments = appointments.length
  const booked = appointments.filter((x) => x.status === 'Booked').length
  const cancelled = appointments.filter((x) => x.status === 'Cancelled').length

  return (
    <div>
      <h1>Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="panel" style={{borderLeft:'4px solid #d9534f',padding:'12px'}}>
          <strong>Error loading data:</strong>
          <div className="muted">{error}</div>
          <div className="muted">Check backend is running and `VITE_API_BASE` is correct.</div>
        </div>
      ) : (
        <div className="cards">
          <div className="card">
            <div className="card-title">Total Members</div>
            <div className="card-value">{totalUsers}</div>
          </div>
          <div className="card">
            <div className="card-title">Total Appointments</div>
            <div className="card-value">{totalAppointments}</div>
          </div>
          <div className="card">
            <div className="card-title">Booked</div>
            <div className="card-value green">{booked}</div>
          </div>
          <div className="card">
            <div className="card-title">Cancelled</div>
            <div className="card-value red">{cancelled}</div>
          </div>
        </div>
      )}

      <section className="panel">
        <h2>Appointment Status Breakdown</h2>
        {appointments.length === 0 ? <p>No appointments yet</p> : <p>See appointments page for details.</p>}
      </section>
    </div>
  )
}
