import { entryId, mergeAgenda, type AgendaEntry } from './agenda'
import { isValidStart } from './enigma'

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
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(e.time) &&
    typeof e.room === 'string' &&
    e.room.trim() !== '' &&
    typeof e.title === 'string' &&
    e.title.trim() !== '' &&
    typeof e.ciphertext === 'string' &&
    Number.isSafeInteger(e.number) &&
    typeof e.start === 'string' &&
    isValidStart(e.start) &&
    typeof e.sentAt === 'string' &&
    Array.isArray(e.speakers) &&
    e.speakers.every((speaker) => typeof speaker === 'string')
  )
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw) as { entries?: unknown; seen?: unknown }
    if (!Array.isArray(data.entries) || !Array.isArray(data.seen)) return empty()
    return {
      entries: mergeAgenda(
        [],
        data.entries.filter(isAgendaEntry).map((entry) => ({ ...entry, id: entryId(entry) })),
      ),
      seen: data.seen.filter((n): n is number => typeof n === 'number' && Number.isSafeInteger(n)),
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
