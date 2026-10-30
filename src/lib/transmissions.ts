import { enigma, isValidStart } from './enigma'
import { entryId, parseAgenda, type AgendaEntry } from './agenda'

export const TRANSMISSIONS_URL = 'https://devfest-vibe-lounge.web.app/api/transmissions'

export interface Transmission {
  number: number
  start: string
  ciphertext: string
  sentAt: string
}

export function isTransmission(value: unknown): value is Transmission {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.number === 'number' &&
    typeof t.start === 'string' &&
    typeof t.ciphertext === 'string' &&
    typeof t.sentAt === 'string'
  )
}

/** Decrypt a transmission with its own start position and parse it into an agenda entry. */
export function decodeTransmission(t: Transmission): AgendaEntry | null {
  if (!isValidStart(t.start)) return null
  const talk = parseAgenda(enigma(t.ciphertext, t.start).output)
  if (!talk) return null
  return {
    ...talk,
    id: entryId(talk),
    number: t.number,
    start: t.start,
    ciphertext: t.ciphertext,
    sentAt: t.sentAt,
  }
}

export async function fetchTransmissions(signal?: AbortSignal): Promise<Transmission[]> {
  const res = await fetch(TRANSMISSIONS_URL, { cache: 'no-store', signal })
  if (!res.ok) throw new Error(`Transmissions request failed: HTTP ${res.status}`)
  const data: unknown = await res.json()
  const list = (data as { transmissions?: unknown }).transmissions
  return Array.isArray(list) ? list.filter(isTransmission) : []
}
