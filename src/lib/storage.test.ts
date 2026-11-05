import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadStore } from './storage'

const entry = {
  id: 'old-id',
  time: '09:00',
  room: 'HALL',
  title: 'Talk',
  speakers: ['Speaker'],
  number: 1,
  start: 'AAA',
  ciphertext: '',
  sentAt: '',
}

afterEach(() => vi.unstubAllGlobals())

describe('cached agenda', () => {
  it('keeps valid legacy entries, normalizes ids and drops records that would break rendering', () => {
    const entries = [
      entry,
      { ...entry, number: 2, title: 'Updated' },
      { ...entry, speakers: [{}] },
      { ...entry, time: '25:00' },
      { ...entry, start: null },
    ]
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ entries, seen: [1, '2', null] }) })
    expect(loadStore()).toEqual({
      entries: [{ ...entry, id: '09:00|HALL', number: 2, title: 'Updated' }],
      seen: [1],
    })
  })

  it('recovers from corrupt or blocked storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{' })
    expect(loadStore()).toEqual({ entries: [], seen: [] })
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadStore()).toEqual({ entries: [], seen: [] })
  })
})
