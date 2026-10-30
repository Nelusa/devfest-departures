import { describe, expect, it } from 'vitest'
import {
  entryId,
  mergeAgenda,
  nowPlaying,
  parseAgenda,
  statusOf,
  toMinutes,
  upNext,
  type AgendaEntry,
  type Talk,
} from './agenda'

describe('parseAgenda', () => {
  it('parses the reference plaintext', () => {
    expect(parseAgenda('12:50 MOONSHINE: AI PRINTER GO BRRR / DOMINIK ŠIMONÍK, DENIS VALÁŠEK')).toEqual({
      time: '12:50',
      room: 'MOONSHINE',
      title: 'AI PRINTER GO BRRR',
      speakers: ['DOMINIK ŠIMONÍK', 'DENIS VALÁŠEK'],
    })
  })

  it('keeps colons inside the title and spaces inside the room', () => {
    expect(parseAgenda('09:50 MAIN HALL: PART 1: THE START / JAN NOVÁK')).toMatchObject({
      room: 'MAIN HALL',
      title: 'PART 1: THE START',
      speakers: ['JAN NOVÁK'],
    })
  })

  it('rejects garbage', () => {
    expect(parseAgenda('XQZT PLM')).toBeNull()
  })
})

describe('schedule', () => {
  const t = (time: string, room: string): Talk => ({ time, room, title: time, speakers: [] })
  const a1 = t('09:00', 'A')
  const a2 = t('09:30', 'A')
  const b1 = t('09:00', 'B')
  const b2 = t('10:00', 'B')
  const all = [a1, a2, b1, b2]

  it('a talk runs until the next one in its room', () => {
    expect(statusOf(a1, all, toMinutes('09:29'))).toBe('live')
    expect(statusOf(a1, all, toMinutes('09:30'))).toBe('past')
  })

  it('caps a talk at 45 minutes', () => {
    expect(statusOf(b1, all, toMinutes('09:44'))).toBe('live')
    expect(statusOf(b1, all, toMinutes('09:45'))).toBe('past')
    expect(statusOf(a2, all, toMinutes('10:15'))).toBe('past')
  })

  it('picks now and next', () => {
    const now = toMinutes('09:40')
    expect(nowPlaying(all, now).map((x) => x.time + x.room)).toEqual(['09:00B', '09:30A'])
    expect(upNext(all, now).map((x) => x.time + x.room)).toEqual(['10:00B'])
  })
})

describe('mergeAgenda', () => {
  const entry = (time: string, room: string, number: number, title = 'T'): AgendaEntry => ({
    time,
    room,
    title,
    speakers: [],
    id: entryId({ time, room }),
    number,
    start: 'AAA',
    ciphertext: '',
    sentAt: '',
  })

  it('dedupes by time + room, newer transmission wins, sorted by time', () => {
    const merged = mergeAgenda(
      [entry('10:00', 'A', 1, 'old')],
      [entry('10:00', 'A', 2, 'new'), entry('09:00', 'B', 3)],
    )
    expect(merged.map((e) => `${e.time} ${e.room} ${e.title}`)).toEqual(['09:00 B T', '10:00 A new'])
  })
})
