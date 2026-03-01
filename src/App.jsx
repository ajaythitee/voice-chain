import { Link, Navigate, BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { formatAddress } from './utils'
import { FiHome, FiGrid, FiPlusCircle, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

import Home from './pages/Home'
import Create from './pages/Create'
import Browse from './pages/Browse'
import Campaign from './pages/Tender'
import Dashboard from './pages/Dashboard'

const POLYGON_AMOY_CHAIN_ID = 80002

function Navigation() {
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    const isActive = (path) => location.pathname === path

    const navLinks = [
        { path: '/', icon: <FiHome />, label: 'Home' },
        { path: '/browse', icon: <FiGrid />, label: 'Campaigns' },
        { path: '/create', icon: <FiPlusCircle />, label: 'Create' },
        { path: '/dashboard', icon: <FiUser />, label: 'Dashboard' },
    ]

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <span style={{ fontSize: '28px' }}>📢</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>VoiceChain</span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-nav">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: isActive(link.path) ? '#fff' : 'rgba(148, 163, 184, 0.8)',
                                background: isActive(link.path) ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent'
                            }}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                </nav>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                    {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="header-actions">
                    {isConnected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#a855f7',
                                fontSize: '13px',
                                fontFamily: 'monospace'
                            }}>
                                {formatAddress(address)}
                            </span>
                            <button onClick={() => disconnect()} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                                <FiLogOut /> Disconnect
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => connect({ connector: connectors[0] })} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile menu overlay */}
            <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)}>
                <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileOpen(false)}
                            className={isActive(link.path) ? 'active' : ''}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}

function NetworkBanner() {
    const { isConnected } = useAccount()
    const chainId = useChainId()
    const wrongNetwork = isConnected && chainId !== POLYGON_AMOY_CHAIN_ID

    if (!wrongNetwork) return null

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#fca5a5'
        }}>
            ⚠️ Wrong network. Please switch to <strong>Polygon Amoy</strong> in your wallet.
        </div>
    )
}

function Footer() {
    return (
        <footer style={{
            padding: '32px 24px',
            textAlign: 'center',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            marginTop: '60px'
        }}>
            <p style={{ color: 'rgba(148, 163, 184, 0.5)', fontSize: '14px', marginBottom: '12px' }}>
                © 2026 VoiceChain • Built on Polygon Amoy
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                <a href="https://amoy.etherscan.io" target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: '14px' }}>Explorer</a>
                <a href="https://faucet.polygon.technology" target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: '14px' }}>Faucet</a>
                <a href="https://github.com/anikeaty08/PolyVote" target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: '14px' }}>GitHub</a>
            </div>
        </footer>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px' } }} />
                <NetworkBanner />
                <Navigation />
                <main style={{ flex: 1, paddingTop: '80px' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/create" element={<Create />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/campaign/:id" element={<Campaign />} />
                        <Route path="/tender/:id" element={<Campaign />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    )
}
