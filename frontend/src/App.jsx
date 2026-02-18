import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Members from './components/Members'
import Appointments from './components/Appointments'
import Debug from './components/Debug'
import Chatbot from './components/Chatbot'

export default function App() {
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">arise</div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/members">Members</Link>
          <Link to="/appointments">Appointments</Link>
          <Link to="/debug">Debug</Link>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/debug" element={<Debug />} />
        </Routes>
        <Chatbot />
      </main>
    </div>
  )
}
