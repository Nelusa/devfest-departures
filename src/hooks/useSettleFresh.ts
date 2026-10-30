import { useEffect, useRef } from 'react'
import type { AgendaEntry } from '../lib/agenda'
import { flapRowEndMs } from '../lib/flap'

const SETTLE_MARGIN_MS = 150

/**
 * Clears the "fresh" flag once an entry's split-flap has had time to finish.
 * Timers start only while the board is visible, so a reveal decoded behind the
 * boot screen still plays in full, and filtered-out rows settle too.
 */
export function useSettleFresh(
  fresh: ReadonlyMap<string, number>,
  entries: AgendaEntry[],
  visible: boolean,
  settle: (id: string) => void,
) {
  const scheduled = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    if (!visible) return
    const byId = new Map(entries.map((e) => [e.id, e]))
    for (const [id, order] of fresh) {
      if (scheduled.current.has(id)) continue
      const entry = byId.get(id)
      const longest = entry ? Math.max(entry.title.length, entry.speakers.join(', ').length) : 0
      const timer = setTimeout(
        () => {
          scheduled.current.delete(id)
          settle(id)
        },
        flapRowEndMs(order, longest) + SETTLE_MARGIN_MS,
      )
      scheduled.current.set(id, timer)
    }
  }, [fresh, entries, visible, settle])

  useEffect(() => {
    const timers = scheduled.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])
}
