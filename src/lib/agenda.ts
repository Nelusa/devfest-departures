// Agenda parsing and schedule logic — pure, framework-free.

export interface Talk {
  time: string // "HH:MM"
  room: string
  title: string
  speakers: string[]
}

export interface AgendaEntry extends Talk {
  /** stable dedupe key: time + room */
  id: string
  number: number
  start: string
  ciphertext: string
  sentAt: string
}

/** Parse "HH:MM SÁL: TITUL / JMÉNO, JMÉNO". Titles may contain ":" and rooms may contain spaces. */
export function parseAgenda(plaintext: string): Talk | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s+(.+)$/.exec(plaintext)
  if (!m) return null
  const [, hh, mm, rest] = m as unknown as [string, string, string, string]
  const colon = rest.indexOf(':')
  if (colon <= 0) return null
  const room = rest.slice(0, colon).trim()
  const body = rest.slice(colon + 1).trim()
  const slash = body.lastIndexOf(' / ')
  const title = (slash >= 0 ? body.slice(0, slash) : body).trim()
  const speakers =
    slash >= 0
      ? body
          .slice(slash + 3)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  if (!room || !title) return null
  return { time: `${hh.padStart(2, '0')}:${mm}`, room, title, speakers }
}

export const entryId = (t: Pick<Talk, 'time' | 'room'>) => `${t.time}|${t.room}`

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export const MAX_TALK_MINUTES = 45

export function sortAgenda<T extends Talk>(entries: T[]): T[] {
  return [...entries].sort((a, b) => toMinutes(a.time) - toMinutes(b.time) || a.room.localeCompare(b.room))
}

/** End minute of a talk: start of the next talk in the same room, capped at 45 min. */
export function endMinutes(talk: Talk, all: Talk[]): number {
  const start = toMinutes(talk.time)
  const nextInRoom = all
    .filter((t) => t.room === talk.room && toMinutes(t.time) > start)
    .reduce((min, t) => Math.min(min, toMinutes(t.time)), Infinity)
  return Math.min(nextInRoom, start + MAX_TALK_MINUTES)
}

export type TalkStatus = 'past' | 'live' | 'upcoming'

export function statusOf(talk: Talk, all: Talk[], nowMin: number): TalkStatus {
  const start = toMinutes(talk.time)
  if (start > nowMin) return 'upcoming'
  return nowMin < endMinutes(talk, all) ? 'live' : 'past'
}

/** "Teď": per room, the latest talk with start ≤ now that is still running. */
export function nowPlaying<T extends Talk>(all: T[], nowMin: number): T[] {
  return sortAgenda(all.filter((t) => statusOf(t, all, nowMin) === 'live'))
}

/** "Dál": the nearest future start time (all talks starting then). */
export function upNext<T extends Talk>(all: T[], nowMin: number): T[] {
  const future = all.filter((t) => toMinutes(t.time) > nowMin)
  if (!future.length) return []
  const first = Math.min(...future.map((t) => toMinutes(t.time)))
  return sortAgenda(future.filter((t) => toMinutes(t.time) === first))
}

/** Merge new entries into the store, deduped by time + room (newer transmission wins). */
export function mergeAgenda(existing: AgendaEntry[], incoming: AgendaEntry[]): AgendaEntry[] {
  const map = new Map(existing.map((e) => [e.id, e]))
  for (const e of incoming) {
    const prev = map.get(e.id)
    if (!prev || prev.number < e.number) map.set(e.id, e)
  }
  return sortAgenda([...map.values()])
}
