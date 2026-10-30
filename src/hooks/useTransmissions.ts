import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeAgenda, type AgendaEntry } from '../lib/agenda'
import { loadStore, saveStore, type Store } from '../lib/storage'
import { decodeTransmission, fetchTransmissions } from '../lib/transmissions'

const POLL_MS = 60_000

export type SignalStatus = 'connecting' | 'live' | 'lost'

/**
 * Polls the transmissions feed, decrypts every message and accumulates the
 * agenda in localStorage. `fresh` maps just-decoded entry ids to their arrival
 * order so the board can play the split-flap reveal in broadcast order.
 */
export function useTransmissions() {
  const [store, setStore] = useState<Store>(loadStore)
  const [status, setStatus] = useState<SignalStatus>('connecting')
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)
  const [fresh, setFresh] = useState<ReadonlyMap<string, number>>(new Map())
  const storeRef = useRef(store)

  const ingest = useCallback((incoming: AgendaEntry[], numbers: number[]) => {
    const prev = storeRef.current
    const known = new Map(prev.entries.map((e) => [e.id, e.number]))
    const arrived = incoming
      .filter((e) => (known.get(e.id) ?? -Infinity) < e.number)
      .sort((a, b) => a.number - b.number)

    const next: Store = {
      entries: mergeAgenda(prev.entries, incoming),
      seen: [...new Set([...prev.seen, ...numbers])].sort((a, b) => a - b),
    }
    storeRef.current = next
    setStore(next)
    saveStore(next)

    if (arrived.length > 0) {
      setFresh((current) => {
        const updated = new Map(current)
        arrived.forEach((e, order) => updated.set(e.id, order))
        return updated
      })
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const transmissions = await fetchTransmissions()
      const decoded = transmissions.map(decodeTransmission).filter((e) => e !== null)
      ingest(
        decoded,
        transmissions.map((t) => t.number),
      )
      setLastSentAt(transmissions[0]?.sentAt ?? null)
      setStatus('live')
    } catch {
      setStatus('lost')
    }
  }, [ingest])

  useEffect(() => {
    void poll()
    const interval = setInterval(() => void poll(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void poll()
    }
    const onOnline = () => void poll()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [poll])

  const settle = useCallback((id: string) => {
    setFresh((current) => {
      if (!current.has(id)) return current
      const updated = new Map(current)
      updated.delete(id)
      return updated
    })
  }, [])

  /** Manual mode: decode a pasted transmission and pin it to the board. */
  const pinManual = useCallback(
    (ciphertext: string, start: string): AgendaEntry | null => {
      const entry = decodeTransmission({
        number: Date.now(),
        start: start.toUpperCase(),
        ciphertext,
        sentAt: new Date().toISOString(),
      })
      if (entry) ingest([entry], [])
      return entry
    },
    [ingest],
  )

  return {
    entries: store.entries,
    intercepted: store.seen.length,
    status,
    lastSentAt,
    fresh,
    settle,
    pinManual,
    retry: poll,
  }
}
