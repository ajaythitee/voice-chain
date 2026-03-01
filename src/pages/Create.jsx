import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import { FiStar, FiUpload, FiCheck, FiLoader, FiFile, FiX, FiCalendar, FiPlus, FiZap } from 'react-icons/fi'
import { improveTitle, improveDescription, parseAddressesFromFile, suggestOptions, isAIConfigured } from '../services/ai'
import { uploadFile, uploadJSON, isPinataConfigured } from '../services/ipfs'
import { createTenderGasless, isRelayerConfigured } from '../services/relayer'

const CATEGORIES = ['General', 'Policy', 'Community', 'Environment', 'Infrastructure', 'Education', 'Healthcare', 'Technology', 'Other']

export default function Create() {
    const { address, isConnected } = useAccount()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const imageInputRef = useRef(null)

    const [form, setForm] = useState({
        title: '',
        desc: '',
        category: 'General',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        restricted: false,
        hideResults: false
    })
    const [options, setOptions] = useState([])
    const [newOption, setNewOption] = useState('')
    const [whitelist, setWhitelist] = useState([])
    const [whitelistText, setWhitelistText] = useState('')
    const [image, setImage] = useState(null)
    const [preview, setPreview] = useState(null)
    const [improvingTitle, setImprovingTitle] = useState(false)
    const [improvingDesc, setImprovingDesc] = useState(false)
    const [suggestingOptions, setSuggestingOptions] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const getTimestamps = () => {
        const now = Math.floor(Date.now() / 1000)
        let startTs = 0 // 0 means start immediately

        if (form.startDate && form.startTime) {
            const startDt = new Date(`${form.startDate}T${form.startTime}`)
            startTs = Math.floor(startDt.getTime() / 1000)
        }

        if (!form.endDate || !form.endTime) return { startTs: 0, endTs: 0 }

        const endDt = new Date(`${form.endDate}T${form.endTime}`)
        const endTs = Math.floor(endDt.getTime() / 1000)

        return { startTs, endTs, now }
    }

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImage(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const handleImproveTitle = async () => {
        if (!form.title) return toast.error('Enter a title first')
        setImprovingTitle(true)
        try {
            const improved = await improveTitle(form.title, form.category)
            setForm({ ...form, title: improved })
            toast.success('✨ Title improved!')
        } catch (e) {
            toast.error('Failed to improve title')
        }
        setImprovingTitle(false)
    }

    const handleImproveDesc = async () => {
        if (!form.desc) return toast.error('Enter a description first')
        setImprovingDesc(true)
        try {
            const improved = await improveDescription(form.title || 'Campaign', form.category, form.desc)
            setForm({ ...form, desc: improved })
            toast.success('✨ Description improved!')
        } catch (e) {
            toast.error('Failed to improve description')
        }
        setImprovingDesc(false)
    }

    const handleSuggestOptions = async () => {
        if (!form.title) return toast.error('Enter a title first')
        setSuggestingOptions(true)
        try {
            const suggested = await suggestOptions(form.title, form.desc, form.category)
            setOptions(suggested)
            toast.success('✨ Options suggested!')
        } catch (e) {
            toast.error('Failed to suggest options')
        }
        setSuggestingOptions(false)
    }

    const addOption = () => {
        if (newOption.trim() && options.length < 10) {
            setOptions([...options, newOption.trim()])
            setNewOption('')
        }
    }

    const removeOption = (idx) => {
        setOptions(options.filter((_, i) => i !== idx))
    }

    const handleFileImport = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setParsing(true)
        try {
            const text = await file.text()
            const addresses = await parseAddressesFromFile(text, file.name)
            if (addresses.length === 0) {
                toast.error('No valid addresses found')
            } else {
                setWhitelist(prev => [...new Set([...prev, ...addresses])])
                toast.success(`📋 Found ${addresses.length} addresses!`)
            }
        } catch (e) {
            toast.error('Failed to parse file')
        }
        setParsing(false)
        e.target.value = ''
    }

    const handleAddManual = () => {
        const newAddrs = whitelistText.split('\n').map(a => a.trim()).filter(a => /^0x[a-fA-F0-9]{40}$/.test(a))
        if (newAddrs.length > 0) {
            setWhitelist(prev => [...new Set([...prev, ...newAddrs])])
            setWhitelistText('')
            toast.success(`Added ${newAddrs.length} addresses`)
        } else {
            toast.error('No valid addresses')
        }
    }

    const removeAddress = (addr) => setWhitelist(prev => prev.filter(a => a !== addr))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.title || !form.desc) return toast.error('Fill title and description')
        if (!form.endDate || !form.endTime) return toast.error('Select end date and time')
        if (options.length < 2) return toast.error('Add at least 2 voting options')
        if (form.restricted && whitelist.length === 0) return toast.error('Add addresses for restricted voting')

        const { startTs, endTs, now } = getTimestamps()
        if (endTs <= now) return toast.error('End date must be in the future')
        if (startTs > 0 && startTs < now) return toast.error('Start date cannot be in the past')
        if (startTs > 0 && endTs <= startTs) return toast.error('End date must be after start date')

        setSubmitting(true)
        try {
            let ipfsHash = ''
            let imageHash = ''

            if (isPinataConfigured()) {
                if (image) {
                    toast.loading('Uploading image...')
                    const uploaded = await uploadFile(image)
                    imageHash = uploaded.hash
                    toast.dismiss()
                }
                toast.loading('Saving to IPFS...')
                const result = await uploadJSON({ ...form, options, whitelist, creator: address, image: imageHash })
                ipfsHash = result.hash
                toast.dismiss()
            }

            const desc = imageHash ? `${form.desc}\n\n[IMAGE:${imageHash}][IPFS:${ipfsHash}]` : (ipfsHash ? `${form.desc}\n\n[IPFS:${ipfsHash}]` : form.desc)

            toast.loading('Creating campaign (FREE)...')
            await createTenderGasless(form.title, desc, form.category, options, startTs, endTs, form.restricted, form.hideResults, whitelist)
            toast.dismiss()

            toast.success('🎉 Campaign created!')
            navigate('/dashboard')
        } catch (e) {
            toast.dismiss()
            toast.error('Failed: ' + e.message)
        }
        setSubmitting(false)
    }

    if (!isConnected) {
        return (
            <div className="container fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
                <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Connect Wallet</h2>
                <p style={{ color: 'rgba(148, 163, 184, 0.6)' }}>Connect to launch campaigns</p>
            </div>
        )
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="container fade-in" style={{ padding: '60px 24px', maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: '700' }}>
                    <span className="gradient">Launch Campaign</span>
                </h1>
                <span style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>
                    ✨ FREE
                </span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>📢 Campaign Details</h3>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(148, 163, 184, 0.8)' }}>Title *</label>
                            {isAIConfigured() && (
                                <button type="button" onClick={handleImproveTitle} disabled={improvingTitle || !form.title} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                                    background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', fontSize: '12px', fontWeight: '600',
                                    cursor: improvingTitle || !form.title ? 'not-allowed' : 'pointer', opacity: improvingTitle || !form.title ? 0.5 : 1
                                }}>
                                    {improvingTitle ? <FiLoader className="spin" /> : <FiStar />} Improve
                                </button>
                            )}
                        </div>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What should the community decide on?" required />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(148, 163, 184, 0.8)' }}>Category *</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'rgba(148, 163, 184, 0.8)' }}>Description *</label>
                            {isAIConfigured() && (
                                <button type="button" onClick={handleImproveDesc} disabled={improvingDesc || !form.desc} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                                    background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', fontSize: '12px', fontWeight: '600',
                                    cursor: improvingDesc || !form.desc ? 'not-allowed' : 'pointer', opacity: improvingDesc || !form.desc ? 0.5 : 1
                                }}>
                                    {improvingDesc ? <FiLoader className="spin" /> : <FiStar />} Improve
                                </button>
                            )}
                        </div>
                        <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Describe what you want the community to vote on..." rows="5" required />
                    </div>
                </div>

                {/* Voting Options */}
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>🗳️ Voting Options</h3>
                        {isAIConfigured() && (
                            <button type="button" onClick={handleSuggestOptions} disabled={suggestingOptions || !form.title} style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', fontSize: '13px', fontWeight: '600',
                                cursor: suggestingOptions || !form.title ? 'not-allowed' : 'pointer', opacity: suggestingOptions || !form.title ? 0.5 : 1
                            }}>
                                {suggestingOptions ? <FiLoader className="spin" /> : <FiZap />} AI Suggest
                            </button>
                        )}
                    </div>
                    <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px', marginBottom: '16px' }}>Create the options people will vote on</p>

                    {options.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px' }}>
                                    <span>{opt}</span>
                                    <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiX /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Type an option (e.g. 'Build the park')" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())} />
                        <button type="button" onClick={addOption} disabled={!newOption.trim() || options.length >= 10} className="btn btn-secondary" style={{ padding: '12px 20px' }}>
                            <FiPlus /> Add
                        </button>
                    </div>

                    {options.length < 2 && (
                        <p style={{ marginTop: '12px', fontSize: '13px', color: '#f59e0b' }}>⚠️ Add at least 2 options</p>
                    )}
                </div>

                {/* Timeline */}
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}><FiCalendar style={{ marginRight: '8px' }} />Voting Period</h3>

                    <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px', marginBottom: '20px' }}>
                        📅 Set when voting starts and ends. Leave start empty to begin immediately.
                    </p>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>🟢 Start (Optional)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>Start Date</label>
                                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} min={today} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>Start Time</label>
                                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>🔴 End (Required)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>End Date *</label>
                                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} min={today} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>End Time *</label>
                                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    {form.endDate && form.endTime && (
                        <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', fontSize: '14px' }}>
                            {form.startDate && form.startTime ? (
                                <div>Starts: <span style={{ color: '#10b981', fontWeight: '600' }}>{new Date(`${form.startDate}T${form.startTime}`).toLocaleString()}</span></div>
                            ) : (
                                <div>Starts: <span style={{ color: '#10b981', fontWeight: '600' }}>Immediately after creation</span></div>
                            )}
                            <div>Ends: <span style={{ color: '#ef4444', fontWeight: '600' }}>{new Date(`${form.endDate}T${form.endTime}`).toLocaleString()}</span></div>
                        </div>
                    )}
                </div>

                {/* Image */}
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>🖼️ Cover Image (Optional)</h3>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                    <div onClick={() => imageInputRef.current?.click()} style={{ padding: '40px', border: '2px dashed rgba(148, 163, 184, 0.2)', borderRadius: '14px', textAlign: 'center', cursor: 'pointer' }}>
                        {preview ? <img src={preview} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px' }} /> : (
                            <><FiUpload style={{ fontSize: '32px', marginBottom: '12px', color: 'rgba(148, 163, 184, 0.5)' }} /><p style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Click to upload</p></>
                        )}
                    </div>
                </div>

                {/* Settings */}
                <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>⚙️ Campaign Settings</h3>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '20px' }}>
                        <input type="checkbox" checked={form.hideResults} onChange={e => setForm({ ...form, hideResults: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                        <div>
                            <div style={{ fontWeight: '500' }}>🙈 Hide Results Until End</div>
                            <div style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>Results only visible after voting closes</div>
                        </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: form.restricted ? '24px' : 0 }}>
                        <input type="checkbox" checked={form.restricted} onChange={e => setForm({ ...form, restricted: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                        <div>
                            <div style={{ fontWeight: '500' }}>🔒 Restricted Voting</div>
                            <div style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.6)' }}>Only specific addresses can vote</div>
                        </div>
                    </label>
                    {form.restricted && (
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,.txt,.xlsx,.xls,.json" style={{ display: 'none' }} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={parsing} className="btn btn-secondary" style={{ width: '100%', padding: '16px', marginBottom: '16px' }}>
                                {parsing ? <><FiLoader className="spin" /> Parsing...</> : <><FiFile /> Import File (AI Parses)</>}
                            </button>
                            <textarea value={whitelistText} onChange={e => setWhitelistText(e.target.value)} placeholder="Or paste addresses..." rows="3" style={{ marginBottom: '8px' }} />
                            <button type="button" onClick={handleAddManual} className="btn btn-secondary" style={{ marginBottom: '16px' }}>Add</button>
                            {whitelist.length > 0 && (
                                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', padding: '10px' }}>
                                    {whitelist.map((addr, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '12px', fontFamily: 'monospace' }}>
                                            <span>{addr.slice(0, 8)}...{addr.slice(-6)}</span>
                                            <button type="button" onClick={() => removeAddress(addr)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiX /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={submitting || !isRelayerConfigured() || options.length < 2} className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px' }}>
                    {submitting ? <><FiLoader /> Creating...</> : <><FiCheck /> Launch Campaign</>}
                </button>

                {!isRelayerConfigured() && (
                    <p style={{ textAlign: 'center', marginTop: '12px', color: '#f59e0b', fontSize: '14px' }}>⚠️ Add VITE_RELAYER_PRIVATE_KEY to .env</p>
                )}
            </form>
        </div>
    )
}
