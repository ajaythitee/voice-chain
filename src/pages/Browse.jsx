import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { FiSearch, FiClock, FiX } from 'react-icons/fi'
import Timer from '../components/Timer'
import contractConfig from '../contractConfig.json'
import TenderVotingABI from '../TenderVotingABI.json'

const CATEGORIES = ['All', 'General', 'Policy', 'Community', 'Environment', 'Infrastructure', 'Education', 'Healthcare', 'Technology', 'Other']
const ICONS = { General: '📢', Policy: '📋', Community: '👥', Environment: '🌱', Infrastructure: '🏗️', Education: '📚', Healthcare: '🏥', Technology: '💻', Other: '📌' }

export default function Browse() {
    const { isConnected } = useAccount()
    const [category, setCategory] = useState('All')
    const [search, setSearch] = useState('')

    const { data: ids, isLoading } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getActiveTenders',
    })

    if (!isConnected) {
        return (
            <div className="container fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
                <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Connect Wallet</h2>
                <p style={{ color: 'rgba(148, 163, 184, 0.6)' }}>Connect to browse campaigns</p>
            </div>
        )
    }

    return (
        <div className="container fade-in" style={{ padding: '60px 24px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '32px' }}>
                <span className="gradient">Active Campaigns</span>
            </h1>

            <div className="card" style={{ padding: '20px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148, 163, 184, 0.5)', pointerEvents: 'none' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && setSearch('')}
                        placeholder="Search campaigns..."
                        style={{ paddingLeft: '44px', paddingRight: search ? '44px' : '20px' }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(148, 163, 184, 0.2)', border: 'none', borderRadius: '8px',
                                color: 'rgba(148, 163, 184, 0.8)', padding: '6px', cursor: 'pointer'
                            }}
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)} style={{
                            padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '500', cursor: 'pointer',
                            background: category === c ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'rgba(148, 163, 184, 0.1)',
                            color: category === c ? '#fff' : 'rgba(148, 163, 184, 0.8)'
                        }}>{c}</button>
                    ))}
                    {(search || category !== 'All') && (
                        <button onClick={() => { setSearch(''); setCategory('All') }} style={{
                            padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.3)',
                            background: 'transparent', color: 'rgba(148, 163, 184, 0.8)', fontSize: '13px', cursor: 'pointer'
                        }}><FiX size={14} /> Clear filters</button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p style={{ color: 'rgba(148, 163, 184, 0.6)' }}>Loading...</p>
                </div>
            ) : ids && ids.length > 0 ? (
                <div className="grid grid-3">
                    {ids.map(id => <CampaignCard key={id.toString()} id={id} category={category} search={search} />)}
                </div>
            ) : (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Active Campaigns</h3>
                    <p style={{ color: 'rgba(148, 163, 184, 0.6)', marginBottom: '20px' }}>Be the first to launch one</p>
                    <Link to="/create" className="btn btn-primary">Launch Campaign</Link>
                </div>
            )}
        </div>
    )
}

function CampaignCard({ id, category, search }) {
    const { address } = useAccount()
    const { data: tender } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getTenderDetails',
        args: [id],
    })

    const { data: optionVotes } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getOptionVotesForCreator',
        args: [id, address || '0x0000000000000000000000000000000000000000'],
    })

    if (!tender) return null

    const [, org, title, desc, cat, startTime, deadline, restricted, hideResults, , closed] = tender
    const now = Date.now()
    const startsAt = Number(startTime) * 1000
    const endsAt = Number(deadline) * 1000
    const notStarted = now < startsAt
    const isExpired = now >= endsAt
    const isCreator = address?.toLowerCase() === org?.toLowerCase()
    const resultsHidden = hideResults && !isExpired && !closed && !isCreator
    const totalVotes = optionVotes ? optionVotes.reduce((a, b) => a + b, 0n) : 0n

    // Extract image
    const imageMatch = desc.match(/\[IMAGE:(.*?)\]/)
    const imageHash = imageMatch ? imageMatch[1] : null

    if (category !== 'All' && cat !== category) return null
    if (search && !title.toLowerCase().includes(search.toLowerCase())) return null

    return (
        <Link to={`/campaign/${id}`} className="card" style={{ padding: 0, display: 'block', textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}>
            {/* Image */}
            {imageHash ? (
                <div style={{ height: '140px', background: `url(https://gateway.pinata.cloud/ipfs/${imageHash}) center/cover` }}></div>
            ) : (
                <div style={{ height: '80px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '32px' }}>{ICONS[cat] || '📌'}</span>
                </div>
            )}

            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>{cat}</span>
                    <span style={{
                        padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600',
                        background: closed ? 'rgba(148, 163, 184, 0.15)' : isExpired ? 'rgba(239, 68, 68, 0.15)' : notStarted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: closed ? 'rgba(148, 163, 184, 0.6)' : isExpired ? '#ef4444' : notStarted ? '#3b82f6' : '#10b981'
                    }}>
                        {closed ? 'Closed' : isExpired ? 'Expired' : notStarted ? '🕐 Scheduled' : '● Active'}
                    </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.3' }}>{title}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock /> {isExpired ? 'Ended' : notStarted ? `Starts ${new Date(startsAt).toLocaleDateString()}` : <Timer deadline={deadline} />}
                    </div>
                    <span style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>{resultsHidden ? '🙈 Hidden' : `${totalVotes.toString()} votes`}</span>
                </div>
            </div>
        </Link>
    )
}
