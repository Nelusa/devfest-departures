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
    Number.isSafeInteger(t.number) &&
    typeof t.start === 'string' &&
    isValidStart(t.start) &&
    typeof t.ciphertext === 'string' &&
    typeof t.sentAt === 'string' &&
    Number.isFinite(Date.parse(t.sentAt))
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
  const controller = new AbortController()
  const abort = () => {
    controller.abort()
  }
  if (signal?.aborted) abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 10_000)
  try {
    const res = await fetch(TRANSMISSIONS_URL, { cache: 'no-store', signal: controller.signal })
    if (!res.ok) throw new Error(`Transmissions request failed: HTTP ${res.status}`)
    const data: unknown = await res.json()
    if (
      typeof data !== 'object' ||
      data === null ||
      !('transmissions' in data) ||
      !Array.isArray(data.transmissions)
    ) {
      throw new Error('Invalid transmissions response')
    }
    return data.transmissions.filter(isTransmission)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
