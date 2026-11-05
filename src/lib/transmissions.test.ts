import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTransmissions } from './transmissions'

const transmission = { number: 1, start: 'AAA', ciphertext: 'ABC', sentAt: '2026-10-30T10:00:00Z' }

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('transmissions feed', () => {
  it('keeps usable messages and rejects malformed response envelopes', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          transmissions: [
            transmission,
            { ...transmission, start: 'X' },
            { ...transmission, sentAt: 'invalid' },
          ],
        }),
    })
    vi.stubGlobal('fetch', fetch)
    expect(await fetchTransmissions()).toEqual([transmission])
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ error: 'unavailable' }) })
    await expect(fetchTransmissions()).rejects.toThrow('Invalid transmissions response')
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ transmissions: [] }) })
    expect(await fetchTransmissions()).toEqual([])
  })

  it('aborts a stalled request after ten seconds', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener(
              'abort',
              () => {
                reject(new Error('aborted'))
              },
              { once: true },
            )
          }),
      ),
    )
    const rejection = expect(fetchTransmissions()).rejects.toThrow('aborted')
    await vi.advanceTimersByTimeAsync(10_000)
    await rejection
    expect(vi.getTimerCount()).toBe(0)
  })

  it('forwards cancellation and removes its timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener(
              'abort',
              () => {
                reject(new Error('aborted'))
              },
              { once: true },
            )
          }),
      ),
    )
    const controller = new AbortController()
    const rejection = expect(fetchTransmissions(controller.signal)).rejects.toThrow('aborted')
    controller.abort()
    await rejection
    expect(vi.getTimerCount()).toBe(0)
  })
})
