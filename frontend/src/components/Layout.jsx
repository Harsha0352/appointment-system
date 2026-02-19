import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
    const location = useLocation()

    const links = [
        { path: '/', label: 'Dashboard', icon: '🏠' },
        { path: '/members', label: 'Members', icon: '👥' },
        { path: '/appointments', label: 'Appointments', icon: '📅' },
        { path: '/debug', label: 'Debug', icon: '🔧' }
    ]

    const getPageTitle = () => {
        const active = links.find(l => l.path === location.pathname)
        return active ? active.label : 'Dashboard'
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <span>APPT SYSTEM</span>
                </div>

                <nav className="nav-links">
                    {links.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            <span style={{ marginRight: '12px' }}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <h1 className="page-title">{getPageTitle()}</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {/* Mock user profile for now */}
                        <div className="badge neutral">Admin User</div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    )
}
