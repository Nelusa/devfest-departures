import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import { BootScreen } from './components/BootScreen'
import { Header } from './components/Header'
import { Listening } from './components/Listening'
import { ManualDecode } from './components/ManualDecode'
import { NowNext } from './components/NowNext'
import { RoomFilter } from './components/RoomFilter'
import { CRITICAL_FONTS } from './fonts'
import { useClock } from './hooks/useClock'
import { useFontsReady } from './hooks/useFontsReady'
import { useNow } from './hooks/useNow'
import { useSettleFresh } from './hooks/useSettleFresh'
import { useTransmissions } from './hooks/useTransmissions'
import type { AgendaEntry } from './lib/agenda'

/** Below this many rows the board looks empty, so we explain that it is still listening. */
const SPARSE_ROWS = 5
const TRANSMISSION_INTERVAL_MS = 60_000

export default function App() {
  const now = useNow()
  const clock = useClock(now)
  const fontsReady = useFontsReady(CRITICAL_FONTS)
  const { entries, intercepted, status, lastSentAt, fresh, settle, pinManual, retry } = useTransmissions()
  const [room, setRoom] = useState<string | null>(null)

  // With a cached agenda we can render straight away; otherwise wait for the
  // first poll so the page appears once instead of growing under the reader.
  const ready = fontsReady && (entries.length > 0 || status !== 'connecting')
  useSettleFresh(fresh, entries, ready, settle)

  const rooms = useMemo(() => [...new Set(entries.map((e) => e.room))].sort(), [entries])
  const visible = useMemo(() => (room ? entries.filter((e) => e.room === room) : entries), [entries, room])
  const announcement = useFreshAnnouncement(entries, fresh)

  const secondsToNext =
    lastSentAt && status === 'live'
      ? Math.max(0, Math.ceil((Date.parse(lastSentAt) + TRANSMISSION_INTERVAL_MS - now) / 1000))
      : null

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <AnimatePresence>{!ready && <BootScreen key="boot" />}</AnimatePresence>

      <Header clock={clock} intercepted={intercepted} status={status} />

      {status === 'lost' && (
        <div role="alert" className="border-b border-signal">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 font-mono text-xs uppercase tracking-wider">
            <span className="font-bold text-signal">● Signal lost</span>
            <span className="font-label normal-case tracking-normal text-dim-text">
              Zobrazuji uložený program. Zprávy lze dešifrovat ručně níže.
            </span>
            <button
              type="button"
              onClick={() => void retry()}
              className="ml-auto min-h-[36px] border border-line px-3 hover:border-paper"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      )}

      {ready && (
        <main className="mx-auto grid max-w-6xl gap-5 px-4 py-4 sm:py-6">
          <NowNext entries={visible} clock={clock} fresh={fresh} />

          <div className="grid gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-3xl leading-none tracking-wide">Odjezdy · Program</h2>
              <span className="font-label text-xs uppercase tracking-widest text-dim-text sm:hidden">
                Intercepted <span className="font-mono text-paper">{intercepted}</span>
              </span>
            </div>
            {rooms.length > 1 && <RoomFilter rooms={rooms} value={room} onChange={setRoom} />}
            <div>
              <Board entries={visible} all={entries} nowMinutes={Math.floor(clock / 60)} fresh={fresh} />
              {visible.length < SPARSE_ROWS && <Listening secondsToNext={secondsToNext} />}
            </div>
          </div>

          <ManualDecode onPin={pinManual} defaultOpen={status === 'lost' && entries.length === 0} />

          <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 font-label text-xs text-dim-text">
            <span>Zdroj: devfest-vibe-lounge.web.app · Enigma I · rotory I-II-III · UKW-B</span>
            <span>Časy v Europe/Prague</span>
          </footer>
        </main>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

/** Screen-reader text for the most recently decoded entry. */
function useFreshAnnouncement(entries: AgendaEntry[], fresh: ReadonlyMap<string, number>): string {
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    const latest = entries.filter((e) => fresh.has(e.id)).sort((a, b) => b.number - a.number)[0]
    if (latest) setAnnouncement(`Dešifrováno: ${latest.time}, ${latest.room}, ${latest.title}`)
  }, [entries, fresh])
  return announcement
}
