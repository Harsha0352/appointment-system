import React, { useEffect, useState } from 'react'
import { fetchUsers } from '../api'

export default function Members() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchUsers()
      .then((u) => { if (mounted) setUsers(u || []) })
      .catch((e) => { console.error(e); if (mounted) setError(e.message || String(e)) })
      .finally(() => mounted && setLoading(false))
    return () => (mounted = false)
  }, [])

  return (
    <div>
      <h1>Members</h1>
      <div className="panel">
        <div className="panel-title">Members ({users.length})</div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="muted">Error loading members: {error}</div>
        ) : users.length === 0 ? (
          <p>No members found.</p>
        ) : (
          <ul className="list">
            {users.map((u) => (
              <li key={u.id} className="list-item">
                <div className="avatar">{(u.name || 'U')[0]}</div>
                <div>
                  <div className="item-title">{u.name}</div>
                  <div className="muted">Member ID: MEM{String(u.id).padStart(3, '0')} · DOB: {u.date_of_birth}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
