import { useEffect, useState } from 'react'

/** Resolves when the given faces are loaded, or after `timeoutMs`, whichever comes first. */
export function useFontsReady(faces: string[], timeoutMs = 2500): boolean {
  const [ready, setReady] = useState(() => typeof document === 'undefined' || !('fonts' in document))
  useEffect(() => {
    if (ready) return
    let cancelled = false
    const done = () => {
      if (!cancelled) setReady(true)
    }
    const timer = setTimeout(done, timeoutMs)
    Promise.all(faces.map((face) => document.fonts.load(face)))
      .catch(() => undefined)
      .finally(done)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [faces, ready, timeoutMs])
  return ready
}
