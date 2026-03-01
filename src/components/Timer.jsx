import { useState, useEffect } from 'react'

export default function Timer({ deadline }) {
    const [time, setTime] = useState(getTime(deadline))

    useEffect(() => {
        const interval = setInterval(() => setTime(getTime(deadline)), 1000)
        return () => clearInterval(interval)
    }, [deadline])

    if (time.expired) return <span style={{ color: '#ef4444' }}>Expired</span>

    if (time.days > 0) return <span>{time.days}d {time.hours}h</span>
    if (time.hours > 0) return <span>{time.hours}h {time.minutes}m</span>
    return <span style={{ color: '#f59e0b' }}>{time.minutes}m {time.seconds}s</span>
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
