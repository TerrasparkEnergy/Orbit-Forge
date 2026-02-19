import { useState, useEffect } from 'react'

export default function UTCClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const utcString = time.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  return (
    <div className="font-mono text-sm text-accent-cyan tracking-wide">
      {utcString}
    </div>
  )
}
