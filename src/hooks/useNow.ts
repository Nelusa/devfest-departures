import { useEffect, useState } from 'react'

/** Wall-clock milliseconds, re-rendering once per second on the second boundary. */
export function useNow(): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(Date.now())
      timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => {
      clearTimeout(timer)
    }
  }, [])
  return now
}
