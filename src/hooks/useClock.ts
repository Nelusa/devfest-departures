import { useState } from 'react'
import { pragueSeconds } from '../lib/time'

/** Optional `?time=HH:MM` override for demos; the clock then runs on from that time. */
function readOverride(): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(location.search).get('time') ?? '')
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 : null
}

/** Seconds since midnight, Europe/Prague (or the demo override). */
export function useClock(now: number): number {
  const [offset] = useState(() => {
    const override = readOverride()
    return override === null ? 0 : override - pragueSeconds(new Date())
  })
  return pragueSeconds(new Date(now)) + offset
}
