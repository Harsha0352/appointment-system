import React, { useEffect, useState } from 'react'
import { fetchUsers } from '../api'

export default function Members() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [longLoading, setLongLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLongLoading(true), 3000)
    let mounted = true

      ; (async () => {
        try {
          const u = await fetchUsers()
          if (mounted) setUsers(u || [])
        } catch (e) {
          console.error(e)
          if (mounted) setError(e.message || String(e))
        } finally {
          if (mounted) setLoading(false)
          clearTimeout(timer)
        }
      })()

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <div className="table-title">User List</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="text-muted" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading members...</div>
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
                <th>Avatar</th>
                <th>Name</th>
                <th>Member ID</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ width: '60px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                    }}>
                      {(u.name || 'U')[0]}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="text-muted">MEM{String(u.id).padStart(3, '0')}</td>
                  <td>{u.date_of_birth}</td>
                  <td>
                    <button className="badge neutral" style={{ border: 'none', cursor: 'pointer' }}>View Profile</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>No members found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
