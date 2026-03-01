import { useState, useEffect } from 'react'

export default function Timer({ deadline }) {
    const [time, setTime] = useState(getTime(deadline))

    useEffect(() => {
        const interval = setInterval(() => setTime(getTime(deadline)), 1000)
        return () => clearInterval(interval)
    }, [deadline])

    const expiryDate = new Date(Number(deadline) * 1000).toLocaleString()
    const title = `Expires: ${expiryDate}`

    if (time.expired) return <span style={{ color: '#ef4444' }} title={title}>Expired</span>

    if (time.days > 0) return <span title={title}>{time.days}d {time.hours}h</span>
    if (time.hours > 0) return <span title={title}>{time.hours}h {time.minutes}m</span>
    return <span style={{ color: '#f59e0b' }} title={title}>{time.minutes}m {time.seconds}s</span>
}

function getTime(deadline) {
    const now = Math.floor(Date.now() / 1000)
    const left = Number(deadline) - now

    if (left <= 0) return { expired: true }

    return {
        days: Math.floor(left / 86400),
        hours: Math.floor((left % 86400) / 3600),
        minutes: Math.floor((left % 3600) / 60),
        seconds: left % 60,
        expired: false
    }
}
