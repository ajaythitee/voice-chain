import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { FiArrowRight, FiClock } from 'react-icons/fi'
import Timer from '../components/Timer'
import contractConfig from '../contractConfig.json'
import TenderVotingABI from '../TenderVotingABI.json'

const ICONS = { General: '📢', Policy: '📋', Community: '👥', Environment: '🌱', Infrastructure: '🏗️', Education: '📚', Healthcare: '🏥', Technology: '💻', Other: '📌' }

export default function Home() {
    const { isConnected, address } = useAccount()

    const { data: ids } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getActiveTenders',
    })

    return (
        <div className="fade-in">
            {/* Hero */}
            <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Background decoration */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent)',
                    filter: 'blur(80px)', zIndex: 0
                }}></div>

                <div className="container" style={{ maxWidth: '1000px', position: 'relative', zIndex: 1 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#a855f7', fontSize: '14px', fontWeight: '600', marginBottom: '32px'
                    }}>
                        📢 Public Opinion Platform • Powered by Polygon
                    </span>

                    <h1 style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: '800', lineHeight: '1.1', marginBottom: '28px' }}>
                        <span className="gradient">Gather Public Voice</span><br />
                        <span style={{ color: 'rgba(148, 163, 184, 0.9)' }}>On Blockchain</span>
                    </h1>

                    <p style={{ fontSize: '20px', color: 'rgba(148, 163, 184, 0.7)', maxWidth: '650px', margin: '0 auto 40px', lineHeight: '1.7' }}>
                        Create campaigns, gather community opinions, and make transparent decisions.
                        <strong style={{ color: '#10b981' }}> 100% free voting</strong> with AI-powered proposals.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
                        {isConnected ? (
                            <>
                                <Link to="/create" className="btn btn-primary" style={{ padding: '18px 36px', fontSize: '17px', fontWeight: '600' }}>
                                    Launch Campaign <FiArrowRight />
                                </Link>
                                <Link to="/browse" className="btn btn-secondary" style={{ padding: '18px 36px', fontSize: '17px' }}>
                                    Browse Campaigns
                                </Link>
                            </>
                        ) : (
                            <p style={{ color: 'rgba(148, 163, 184, 0.5)', fontSize: '16px' }}>👆 Connect wallet to start</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
                        {[
                            { value: '100%', label: 'Free Voting' },
                            { value: '🔒', label: 'On-Chain' },
                            { value: '🤖', label: 'AI Powered' }
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>{s.value}</div>
                                <div style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Campaigns */}
            {isConnected && ids && ids.length > 0 && (
                <section style={{ padding: '60px 24px', background: 'rgba(15, 23, 42, 0.3)' }}>
                    <div className="container">
                        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
                            Featured <span className="gradient">Campaigns</span>
                        </h2>
                        <p style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.6)', marginBottom: '40px' }}>
                            Active, upcoming, and completed campaigns
                        </p>
                        <FeaturedCampaignsGrid ids={ids} userAddress={address} />
                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <Link to="/browse" className="btn btn-secondary" style={{ padding: '14px 32px' }}>
                                View All Campaigns <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Grid */}
            <section style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.5)' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
                        Why <span className="gradient">VoiceChain</span>?
                    </h2>
                    <p style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.6)', marginBottom: '48px', maxWidth: '500px', margin: '0 auto 48px' }}>
                        Everything you need for transparent community voting
                    </p>

                    <div className="grid grid-3">
                        {[
                            { icon: '🆓', title: 'Gasless Voting', desc: 'Voters pay nothing - we cover all blockchain fees', tag: 'Core' },
                            { icon: '🗳️', title: 'Custom Options', desc: 'Create any voting choices, not just Yes/No', tag: 'New' },
                            { icon: '📅', title: 'Scheduled Start', desc: 'Set when voting begins and ends', tag: 'New' },
                            { icon: '🙈', title: 'Hide Results', desc: 'Keep results secret until voting ends', tag: 'New' },
                            { icon: '🕶️', title: 'Anonymous Voting', desc: 'Voters can hide their wallet address', tag: 'Privacy' },
                            { icon: '🤖', title: 'AI Assistant', desc: 'Gemini suggests titles, descriptions & options', tag: 'AI' },
                            { icon: '📊', title: 'Voter Analytics', desc: 'Creators see who voted for each option', tag: 'Analytics' },
                            { icon: '🧠', title: 'AI Analysis', desc: 'Get AI summary when voting ends', tag: 'AI' },
                            { icon: '🔗', title: 'Fully On-Chain', desc: 'All data stored on Polygon blockchain', tag: 'Secure' },
                        ].map((f, i) => (
                            <div key={i} className="card" style={{ padding: '28px', textAlign: 'center', position: 'relative' }}>
                                {f.tag === 'New' && (
                                    <span style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '11px', fontWeight: '600' }}>NEW</span>
                                )}
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{f.icon}</div>
                                <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px' }}>{f.title}</h3>
                                <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px', lineHeight: '1.5' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: '80px 24px' }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
                        How It Works
                    </h2>
                    <p style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.6)', marginBottom: '48px' }}>
                        Launch your first campaign in minutes
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        {[
                            { step: '1', icon: '✍️', title: 'Create', desc: 'Set title, options, and schedule' },
                            { step: '2', icon: '📤', title: 'Share', desc: 'Share link with your community' },
                            { step: '3', icon: '🗳️', title: 'Collect', desc: 'People vote for free' },
                            { step: '4', icon: '📈', title: 'Analyze', desc: 'See results and AI insights' },
                        ].map((s, i) => (
                            <div key={i} className="card" style={{ padding: '28px', textAlign: 'center' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 16px',
                                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '28px'
                                }}>
                                    {s.icon}
                                </div>
                                <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600', marginBottom: '8px' }}>STEP {s.step}</div>
                                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{s.title}</h4>
                                <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card" style={{
                        padding: '48px 32px',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))',
                        border: '1px solid rgba(168, 85, 247, 0.2)'
                    }}>
                        <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
                            Ready to gather voices?
                        </h3>
                        <p style={{ color: 'rgba(148, 163, 184, 0.7)', marginBottom: '28px' }}>
                            Create your first free campaign in under 2 minutes
                        </p>
                        {isConnected ? (
                            <Link to="/create" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '16px' }}>
                                Launch Your Campaign <FiArrowRight />
                            </Link>
                        ) : (
                            <p style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Connect wallet to get started</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

function FeaturedCampaignsGrid({ ids, userAddress }) {
    // Collect all campaigns by category, then pick smartly
    const [campaigns, setCampaigns] = useState({ active: [], coming: [], ended: [] })
    const [loaded, setLoaded] = useState(0)
    const [selectedIds, setSelectedIds] = useState([])

    const handleCampaignData = (id, status) => {
        setCampaigns(prev => {
            // Avoid duplicates
            if (prev[status].some(c => c.toString() === id.toString())) return prev
            return { ...prev, [status]: [...prev[status], id] }
        })
        setLoaded(prev => prev + 1)
    }

    // Smart selection logic:
    // - If 0 campaigns: show nothing
    // - If 1 campaign: show 1
    // - If 2 campaigns: show 2
    // - If 3 campaigns: show 3
    // - If more than 3:
    //   - If no coming: 2 active + 1 ended (or 1 active + 2 ended if only 1 active, or 3 ended if no active)
    //   - If has coming: 1 active + 1 coming + 1 ended (or fill with what's available)
    useEffect(() => {
        if (loaded >= ids.length && selectedIds.length === 0) {
            const getRandomItem = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null
            const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
            const result = []
            const { active, coming, ended } = campaigns
            const total = active.length + coming.length + ended.length

            // If 3 or fewer total, show all
            if (total <= 3) {
                result.push(...shuffle(active))
                result.push(...shuffle(coming))
                result.push(...shuffle(ended))
            } else {
                // More than 3 campaigns - smart selection
                if (coming.length > 0) {
                    // Has upcoming: show 1 active + 1 coming + 1 ended
                    if (active.length > 0) result.push(getRandomItem(active))
                    result.push(getRandomItem(coming))
                    if (ended.length > 0) result.push(getRandomItem(ended))
                    // Fill remaining slots
                    while (result.length < 3) {
                        if (active.length > result.filter(r => active.includes(r)).length) {
                            const unused = active.filter(a => !result.includes(a))
                            if (unused.length > 0) result.push(getRandomItem(unused))
                            else break
                        } else if (ended.length > result.filter(r => ended.includes(r)).length) {
                            const unused = ended.filter(e => !result.includes(e))
                            if (unused.length > 0) result.push(getRandomItem(unused))
                            else break
                        } else break
                    }
                } else {
                    // No upcoming campaigns
                    if (active.length >= 2) {
                        // 2 active + 1 ended
                        const shuffledActive = shuffle(active)
                        result.push(shuffledActive[0])
                        result.push(shuffledActive[1])
                        if (ended.length > 0) result.push(getRandomItem(ended))
                    } else if (active.length === 1) {
                        // 1 active + 2 ended
                        result.push(active[0])
                        const shuffledEnded = shuffle(ended)
                        result.push(...shuffledEnded.slice(0, 2))
                    } else {
                        // No active: show 3 ended
                        const shuffledEnded = shuffle(ended)
                        result.push(...shuffledEnded.slice(0, 3))
                    }
                }
            }

            setSelectedIds(result.filter(Boolean))
        }
    }, [loaded, ids.length, campaigns, selectedIds.length])

    // Don't show anything if no campaigns
    if (ids.length === 0) return null

    return (
        <>
            {/* Hidden loaders to categorize */}
            <div style={{ display: 'none' }}>
                {ids.map(id => (
                    <CampaignCategorizer key={id.toString()} id={id} onData={handleCampaignData} />
                ))}
            </div>
            {/* Display categorized campaigns */}
            <div className="grid grid-3">
                {selectedIds.length > 0 ? (
                    selectedIds.map(id => (
                        <FeaturedCampaignCard key={id.toString()} id={id} userAddress={userAddress} />
                    ))
                ) : loaded >= ids.length && loaded === 0 ? null : loaded >= ids.length ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(148, 163, 184, 0.6)' }}>
                        No campaigns found
                    </div>
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                )}
            </div>
        </>
    )
}

function CampaignCategorizer({ id, onData }) {
    const { data: tender } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getTenderDetails',
        args: [id],
    })

    useEffect(() => {
        if (tender) {
            const [, , , , , startTime, deadline, , , , closed] = tender
            const now = Date.now()
            const startsAt = Number(startTime) * 1000
            const endsAt = Number(deadline) * 1000
            const notStarted = now < startsAt
            const isExpired = now >= endsAt

            let status = 'active'
            if (closed || isExpired) status = 'ended'
            else if (notStarted) status = 'coming'

            onData(id, status)
        }
    }, [tender, id, onData])

    return null
}

function FeaturedCampaignCard({ id, userAddress }) {
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
        args: [id, userAddress || '0x0000000000000000000000000000000000000000'],
    })

    if (!tender) return null

    const [, org, title, desc, cat, startTime, deadline, restricted, hideResults, , closed] = tender
    const now = Date.now()
    const startsAt = Number(startTime) * 1000
    const endsAt = Number(deadline) * 1000
    const notStarted = now < startsAt
    const isExpired = now >= endsAt
    const isCreator = userAddress?.toLowerCase() === org?.toLowerCase()
    const resultsHidden = hideResults && !isExpired && !closed && !isCreator
    const totalVotes = optionVotes ? optionVotes.reduce((a, b) => a + b, 0n) : 0n

    const imageMatch = desc.match(/\[IMAGE:(.*?)\]/)
    const imageHash = imageMatch ? imageMatch[1] : null

    return (
        <Link to={`/campaign/${id}`} className="card" style={{ padding: 0, display: 'block', textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}>
            {imageHash ? (
                <div style={{ height: '120px', background: `url(https://gateway.pinata.cloud/ipfs/${imageHash}) center/cover` }}></div>
            ) : (
                <div style={{ height: '70px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '28px' }}>{ICONS[cat] || '📌'}</span>
                </div>
            )}

            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)' }}>{cat}</span>
                    <span style={{
                        padding: '3px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: '600',
                        background: closed ? 'rgba(148, 163, 184, 0.15)' : isExpired ? 'rgba(239, 68, 68, 0.15)' : notStarted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: closed ? 'rgba(148, 163, 184, 0.6)' : isExpired ? '#ef4444' : notStarted ? '#3b82f6' : '#10b981'
                    }}>
                        {closed ? 'Closed' : isExpired ? 'Ended' : notStarted ? 'Coming' : 'Active'}
                    </span>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.3' }}>{title}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'rgba(148, 163, 184, 0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiClock size={12} /> {isExpired ? 'Ended' : notStarted ? `Starts ${new Date(startsAt).toLocaleDateString()}` : <Timer deadline={deadline} />}
                    </div>
                    <span>{resultsHidden ? '🙈' : `${totalVotes.toString()} votes`}</span>
                </div>
            </div>
        </Link>
    )
}
