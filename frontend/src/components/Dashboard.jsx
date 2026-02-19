import React, { useEffect, useState } from 'react'
import { fetchUsers, fetchAppointments } from '../api'

export default function Dashboard() {
  const [users, setUsers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const [u, a] = await Promise.all([fetchUsers(), fetchAppointments()])
          if (!mounted) return
          setUsers(u || [])
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

  // Helper to get user name
  const getUserName = (id) => {
    const u = users.find(user => user.id === id)
    return u ? u.name : 'Unknown'
  }

  if (loading) return <div className="text-muted">Loading dashboard...</div>
  if (error) return <div className="badge danger">Error: {error}</div>

  return (
    <div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Users</span>
            <span style={{ background: '#e6f0ff', padding: '8px', borderRadius: '8px', color: '#0F52BA' }}>👥</span>
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="text-muted text-sm mt-4">Registered Members</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Booked</span>
            <span style={{ background: '#d1fae5', padding: '8px', borderRadius: '8px', color: '#10b981' }}>✅</span>
          </div>
          <div className="stat-value">{booked}</div>
          <div className="text-muted text-sm mt-4">Confirmed Appointments</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Appointments</span>
            <span style={{ background: '#f3f4f6', padding: '8px', borderRadius: '8px', color: '#6b7280' }}>📅</span>
          </div>
          <div className="stat-value">{totalAppointments}</div>
          <div className="text-muted text-sm mt-4">All Time</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Cancelled</span>
            <span style={{ background: '#fee2e2', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>⚠️</span>
          </div>
          <div className="stat-value">{cancelled}</div>
          <div className="text-muted text-sm mt-4">Needs Rescheduling</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">Recent Bookings</div>
          <button className="badge neutral" style={{ border: 'none', cursor: 'pointer' }}>View All →</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Member</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {appointments.slice(0, 5).map(apt => (
              <tr key={apt.id}>
                <td style={{ color: 'var(--primary)', fontWeight: 600 }}>APT{String(apt.id).padStart(3, '0')}</td>
                <td>{apt.purpose}</td>
                <td>
                  <span className={`badge ${apt.status === 'Booked' ? 'success' : 'danger'}`}>
                    {apt.status === 'Booked' ? 'Booked' : 'Cancelled'}
                  </span>
                </td>
                <td>{getUserName(apt.user_id)}</td>
                <td className="text-muted">{apt.appointment_date}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
