import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useReadContract, useWalletClient, useSignMessage } from 'wagmi'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiClock, FiExternalLink, FiLoader, FiMessageSquare, FiUsers, FiEyeOff, FiBarChart2, FiChevronDown, FiChevronUp, FiShare2 } from 'react-icons/fi'
import Timer from '../components/Timer'
import { voteWithSignature, voteDirect, isRelayerConfigured } from '../services/relayer'
import { generateVoteAnalysis, isAIConfigured } from '../services/ai'
import contractConfig from '../contractConfig.json'
import TenderVotingABI from '../TenderVotingABI.json'
import { formatAddress, formatDate } from '../utils'

export default function Campaign() {
    const { id } = useParams()
    const { address, isConnected } = useAccount()
    const { data: walletClient, isLoading: walletLoading } = useWalletClient()
    const { signMessageAsync } = useSignMessage()
    const [voting, setVoting] = useState(false)
    const [comment, setComment] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [selectedOption, setSelectedOption] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [loadingAnalysis, setLoadingAnalysis] = useState(false)
    const [expandedOption, setExpandedOption] = useState(null)

    const { data: tender, refetch } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getTenderDetails',
        args: [BigInt(id)],
    })

    const { data: canVote, refetch: refetchCanVote } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'canVote',
        args: [BigInt(id), address],
    })

    const { data: options } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getOptions',
        args: [BigInt(id)],
    })

    const { data: optionVotes, refetch: refetchVotes } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getOptionVotesForCreator',
        args: [BigInt(id), address || '0x0000000000000000000000000000000000000000'],
    })

    const { data: commentsData, refetch: refetchComments } = useReadContract({
        address: contractConfig?.address,
        abi: TenderVotingABI,
        functionName: 'getComments',
        args: [BigInt(id)],
    })

    // Load AI analysis when voting ends
    useEffect(() => {
        if (tender && options && optionVotes && commentsData && isAIConfigured()) {
            const [, , , , , deadline, , , closed] = tender
            const isExpired = Number(deadline) * 1000 < Date.now()

            if ((closed || isExpired) && !analysis && !loadingAnalysis) {
                setLoadingAnalysis(true)
                const [, messages] = commentsData
                const commentTexts = messages?.filter(m => m && !m.startsWith('[ANON]')).map(m => m.replace('[ANON]', '')) || []

                generateVoteAnalysis(
                    tender[2], // title
                    options,
                    optionVotes.map(v => Number(v)),
                    commentTexts
                ).then(result => {
                    setAnalysis(result)
                    setLoadingAnalysis(false)
                })
            }
        }
    }, [tender, options, optionVotes, commentsData])

    if (!isConnected) {
        return (
            <div className="container fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
                <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Connect Wallet</h2>
            </div>
        )
    }

    if (!tender) {
        return (
            <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        )
    }

    const [, org, title, desc, category, startTime, deadline, restricted, hideResults, optionCount, closed] = tender
    const [voters, messages, optionIndexes, timestamps] = commentsData || [[], [], [], []]

    const imageMatch = desc.match(/\[IMAGE:(.*?)\]/)
    const imageHash = imageMatch ? imageMatch[1] : null
    const displayDesc = desc.replace(/\[IMAGE:.*?\]/g, '').replace(/\[IPFS:.*?\]/g, '').trim()

    const now = Date.now()
    const startsAt = Number(startTime) * 1000
    const endsAt = Number(deadline) * 1000
    const notStarted = now < startsAt
    const isExpired = now >= endsAt
    const isCreator = address?.toLowerCase() === org?.toLowerCase()
    const totalVotes = optionVotes ? optionVotes.reduce((a, b) => a + b, 0n) : 0n
    const resultsHidden = hideResults && !isExpired && !closed && !isCreator

    // Group voters by their option choice
    const votersByOption = {}
    if (voters && optionIndexes) {
        voters.forEach((voter, i) => {
            const optIdx = Number(optionIndexes[i])
            if (!votersByOption[optIdx]) votersByOption[optIdx] = []
            votersByOption[optIdx].push({
                address: voter,
                message: messages[i] || '',
                timestamp: timestamps[i],
                isAnon: messages[i]?.startsWith('[ANON]')
            })
        })
    }

    const handleVote = async () => {
        if (selectedOption === null) return toast.error('Select an option')
        if (isExpired) return toast.error('Voting ended')

        setVoting(true)
        try {
            const finalComment = anonymous && comment ? `[ANON]${comment}` : comment

            if (isRelayerConfigured()) {
                // Gasless voting - user just signs, relayer pays gas
                toast.loading('Sign to vote (FREE)...')
                await voteWithSignature(id, selectedOption, finalComment, address, signMessageAsync)
            } else {
                // Direct voting - user pays gas
                if (!walletClient) {
                    toast.dismiss()
                    toast.error('Wallet not ready, please wait and try again')
                    setVoting(false)
                    return
                }
                toast.loading('Confirm transaction to vote...')
                await voteDirect(id, selectedOption, finalComment, walletClient)
            }

            toast.dismiss()
            toast.success('✓ Vote recorded!')
            setComment('')
            setSelectedOption(null)
            refetch()
            refetchCanVote()
            refetchVotes()
            refetchComments()
        } catch (e) {
            toast.dismiss()
            toast.error('Vote failed: ' + (e.shortMessage || e.message))
        }
        setVoting(false)
    }

    const formatTime = (ts) => formatDate(ts)

    const copyShareLink = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => toast.error('Failed to copy'))
    }

    const colors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']

    return (
        <div className="container fade-in" style={{ padding: '60px 24px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <Link to="/browse" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#a855f7', textDecoration: 'none' }}>
                    <FiArrowLeft /> Back to Campaigns
                </Link>
                <button onClick={copyShareLink} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
                    <FiShare2 /> Share
                </button>
            </div>

            {imageHash && (
                <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden' }}>
                    <img src={`https://gateway.pinata.cloud/ipfs/${imageHash}`} alt="Campaign" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                </div>
            )}

            {/* Header */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontSize: '12px' }}>{category}</span>
                            {restricted && <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '12px' }}>Restricted</span>}
                            {hideResults && <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontSize: '12px' }}>🙈 Hidden Results</span>}
                            <span style={{
                                padding: '6px 12px', borderRadius: '100px', fontSize: '12px',
                                background: closed ? 'rgba(148, 163, 184, 0.15)' : isExpired ? 'rgba(239, 68, 68, 0.15)' : notStarted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: closed ? 'rgba(148, 163, 184, 0.8)' : isExpired ? '#ef4444' : notStarted ? '#3b82f6' : '#10b981'
                            }}>
                                {closed ? 'Closed' : isExpired ? '⏰ Expired' : notStarted ? '🕐 Scheduled' : '● Active'}
                            </span>
                            {isCreator && <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '12px' }}>👤 Your Campaign</span>}
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{title}</h1>
                        <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>Campaign #{id}</p>
                    </div>
                    {!closed && !isExpired && (
                        <div className="timer" style={{ padding: '12px 20px' }}>
                            {notStarted ? (
                                <><FiClock /> Starts: {new Date(startsAt).toLocaleString()}</>
                            ) : (
                                <><FiClock /> <Timer deadline={deadline} /></>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                    <p style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{displayDesc}</p>
                </div>

                {/* Results with Bar Chart */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiBarChart2 /> Results {resultsHidden ? '(Hidden until voting ends)' : `(${totalVotes.toString()} votes)`}
                </h3>

                {resultsHidden ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🙈</div>
                        <h4 style={{ marginBottom: '8px' }}>Results Hidden</h4>
                        <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>
                            The creator has chosen to hide results until voting ends.<br />
                            Check back after: {new Date(Number(deadline) * 1000).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {options?.map((opt, i) => {
                            const votes = optionVotes ? Number(optionVotes[i]) : 0
                            const pct = totalVotes > 0 ? (votes * 100) / Number(totalVotes) : 0
                            const color = colors[i % colors.length]
                            const votersForOption = votersByOption[i] || []
                            const isExpanded = expandedOption === i

                            return (
                                <div key={i}>
                                    <div
                                        onClick={() => isCreator && votersForOption.length > 0 && setExpandedOption(isExpanded ? null : i)}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: isCreator && votersForOption.length > 0 ? 'pointer' : 'default',
                                            border: isExpanded ? `1px solid ${color}` : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {opt}
                                                {isCreator && votersForOption.length > 0 && (
                                                    isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                                                )}
                                            </span>
                                            <span style={{ color }}>{votes} ({pct.toFixed(1)}%)</span>
                                        </div>
                                        <div className="progress" style={{ height: '10px' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '100px', transition: 'width 0.3s' }}></div>
                                        </div>
                                    </div>

                                    {/* Expanded voter list */}
                                    {isCreator && isExpanded && votersForOption.length > 0 && (
                                        <div style={{ marginTop: '8px', marginLeft: '16px', padding: '16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', borderLeft: `3px solid ${color}` }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color }}>
                                                <FiUsers style={{ marginRight: '6px' }} /> Voters ({votersForOption.length})
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {votersForOption.map((v, j) => (
                                                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', fontSize: '13px' }}>
                                                        <span style={{ fontFamily: 'monospace', color: 'rgba(148, 163, 184, 0.8)' }}>
                                                            {v.isAnon ? '🕶️ Anonymous' : formatAddress(v.address)}
                                                        </span>
                                                        <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>{formatTime(v.timestamp)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* AI Analysis */}
                {(closed || isExpired) && (
                    <div style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🤖 AI Analysis
                        </h4>
                        {loadingAnalysis ? (
                            <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}><FiLoader className="spin" /> Analyzing results...</p>
                        ) : analysis ? (
                            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{analysis}</p>
                        ) : (
                            <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>Analysis not available</p>
                        )}
                    </div>
                )}
            </div>

            {/* Voting */}
            {canVote && !closed && !isExpired && (
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Cast Your Vote</h3>
                        {isRelayerConfigured() && <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '12px', fontWeight: '600' }}>FREE</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {options?.map((opt, i) => (
                            <button key={i} type="button" onClick={() => setSelectedOption(i)} style={{
                                padding: '16px 20px', borderRadius: '12px', textAlign: 'left', fontWeight: '500',
                                background: selectedOption === i ? `linear-gradient(135deg, ${colors[i]}, ${colors[(i + 1) % colors.length]})` : 'rgba(15, 23, 42, 0.5)',
                                border: selectedOption === i ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                                color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(148, 163, 184, 0.8)' }}>
                            <FiMessageSquare style={{ marginRight: '6px' }} />Comment (optional)
                        </label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts..." rows="3" />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        <div>
                            <span style={{ fontWeight: '500' }}><FiEyeOff style={{ marginRight: '6px' }} />Vote Anonymously</span>
                            <p style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.5)', margin: 0 }}>Your wallet won't be visible</p>
                        </div>
                    </label>

                    <button onClick={handleVote} disabled={voting || selectedOption === null} className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px' }}>
                        {voting ? <><FiLoader className="spin" /> Voting...</> : '✓ Submit Vote'}
                    </button>
                </div>
            )}

            {isExpired && !closed && canVote && (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#ef4444', marginBottom: '24px' }}>
                    ⏰ Voting period has ended
                </div>
            )}

            {!canVote && !closed && !isExpired && (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'rgba(148, 163, 184, 0.6)', marginBottom: '24px' }}>
                    {restricted ? '🔒 Not whitelisted' : '✓ You already voted'}
                </div>
            )}

            {/* Comments */}
            {voters && voters.length > 0 && (
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                        <FiMessageSquare style={{ marginRight: '8px' }} />Comments ({messages.filter(m => m).length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {voters.map((voter, i) => {
                            if (!messages[i]) return null
                            const isAnon = messages[i]?.startsWith('[ANON]')
                            const showVoter = isCreator && !isAnon
                            const optLabel = options?.[Number(optionIndexes[i])] || 'Unknown'
                            const color = colors[Number(optionIndexes[i]) % colors.length]

                            return (
                                <div key={i} style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', borderLeft: `3px solid ${color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                        <span style={{ color: 'rgba(148, 163, 184, 0.6)', fontFamily: 'monospace' }}>
                                            {isAnon ? '🕶️ Anonymous' : showVoter ? formatAddress(voter) : '👤 Voter'}
                                        </span>
                                        <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>{formatTime(timestamps[i])}</span>
                                    </div>
                                    <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>{messages[i].replace('[ANON]', '')}</p>
                                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '100px', background: `${color}20`, color }}>
                                        {optLabel}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <a href={`https://amoy.etherscan.io/address/${org}`} target="_blank" rel="noreferrer" style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    View Creator <FiExternalLink />
                </a>
            </div>
        </div>
    )
}
