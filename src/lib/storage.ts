import type { AgendaEntry } from './agenda'

const KEY = 'devfest-departures:v1'

export interface Store {
  entries: AgendaEntry[]
  /** transmission numbers we've intercepted */
  seen: number[]
}

const empty = (): Store => ({ entries: [], seen: [] })

function isAgendaEntry(value: unknown): value is AgendaEntry {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.time === 'string' &&
    typeof e.room === 'string' &&
    typeof e.title === 'string' &&
    typeof e.ciphertext === 'string' &&
    typeof e.number === 'number' &&
    Array.isArray(e.speakers)
  )
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw) as { entries?: unknown; seen?: unknown }
    if (!Array.isArray(data.entries) || !Array.isArray(data.seen)) return empty()
    return {
      entries: data.entries.filter(isAgendaEntry),
      seen: data.seen.filter((n): n is number => typeof n === 'number'),
    }
  } catch {
    return empty()
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...store, seen: store.seen.slice(-500) }))
  } catch {
    /* storage full or blocked — the board still works in memory */
  }
}
