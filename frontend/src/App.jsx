import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Members from './components/Members'
import Appointments from './components/Appointments'
import Debug from './components/Debug'
import Chatbot from './components/Chatbot'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/debug" element={<Debug />} />
      </Routes>
      <Chatbot />
    </Layout>
  )
}
