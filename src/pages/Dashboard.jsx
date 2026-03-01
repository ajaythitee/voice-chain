import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { FiGrid, FiClock, FiArrowRight } from 'react-icons/fi'
import Timer from '../components/Timer'
import contractConfig from '../contractConfig.json'
import TenderVotingABI from '../TenderVotingABI.json'

export default function Dashboard() {
    const { address, isConnected } = useAccount()

    const { data: myTenders } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getOrganizationTenders',
        args: [address],
    })

    const { data: votingHistory } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getVoterHistory',
        args: [address],
    })

    if (!isConnected) {
        return (
            <div className="container fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
                <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Connect Wallet</h2>
                <p style={{ color: 'rgba(148, 163, 184, 0.6)' }}>Connect to view dashboard</p>
            </div>
        )
    }

    return (
        <div className="container fade-in" style={{ padding: '60px 24px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '32px' }}>
                <span className="gradient">Dashboard</span>
            </h1>

            {/* My Campaigns */}
            <section style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600' }}>📢 My Campaigns</h2>
                    <Link to="/create" className="btn btn-primary" style={{ padding: '10px 20px' }}>+ Create</Link>
                </div>

                {myTenders && myTenders.length > 0 ? (
                    <div className="grid grid-3">
                        {myTenders.map(id => <CampaignCard key={id.toString()} id={id} userAddress={address} />)}
                    </div>
                ) : (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(148, 163, 184, 0.6)', marginBottom: '16px' }}>No campaigns yet</p>
                        <Link to="/create" className="btn btn-secondary">Launch your first campaign</Link>
                    </div>
                )}
            </section>

            {/* Voting History */}
            <section>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>🗳️ Voting History</h2>

                {votingHistory && votingHistory.length > 0 ? (
                    <div className="grid grid-3">
                        {votingHistory.map(id => <HistoryCard key={id.toString()} id={id} />)}
                    </div>
                ) : (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(148, 163, 184, 0.6)', marginBottom: '16px' }}>No votes yet</p>
                        <Link to="/browse" className="btn btn-secondary">Browse campaigns</Link>
                    </div>
                )}
            </section>
        </div>
    )
}

function CampaignCard({ id, userAddress }) {
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

    const [, , title, , category, startTime, deadline, , , , closed] = tender
    const now = Date.now()
    const startsAt = Number(startTime) * 1000
    const endsAt = Number(deadline) * 1000
    const notStarted = now < startsAt
    const isExpired = now >= endsAt
    const totalVotes = optionVotes ? optionVotes.reduce((a, b) => a + b, 0n) : 0n

    return (
        <Link to={`/campaign/${id}`} className="card" style={{ padding: '24px', display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontSize: '12px' }}>{category}</span>
                <span style={{
                    padding: '6px 12px', borderRadius: '100px', fontSize: '12px',
                    background: closed ? 'rgba(148, 163, 184, 0.15)' : isExpired ? 'rgba(239, 68, 68, 0.15)' : notStarted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: closed ? 'rgba(148, 163, 184, 0.8)' : isExpired ? '#ef4444' : notStarted ? '#3b82f6' : '#10b981'
                }}>
                    {closed ? 'Closed' : isExpired ? 'Expired' : notStarted ? '🕐 Scheduled' : '● Active'}
                </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{title}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>{totalVotes.toString()} votes</span>
                <span style={{ color: '#a855f7', fontSize: '14px' }}>View <FiArrowRight /></span>
            </div>
        </Link>
    )
}

function HistoryCard({ id }) {
    const { data: tender } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getTenderDetails',
        args: [id],
    })

    if (!tender) return null

    const [, , title, , category, startTime, deadline, , , , closed] = tender
    const now = Date.now()
    const endsAt = Number(deadline) * 1000
    const isExpired = now >= endsAt

    return (
        <Link to={`/campaign/${id}`} className="card" style={{ padding: '24px', display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>{category}</span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Voted</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(148, 163, 184, 0.5)', fontSize: '13px' }}>
                <FiClock /> {closed || isExpired ? 'Ended' : <Timer deadline={deadline} />}
            </div>
        </Link>
    )
}
