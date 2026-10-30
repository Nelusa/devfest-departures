import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { parseAgenda, statusOf, type AgendaEntry, type TalkStatus } from '../lib/agenda'
import { FLAP_FIELD_DELAY_MS, flapRowDelayMs } from '../lib/flap'
import { LiveBadge } from './LiveBadge'
import { SplitFlap } from './SplitFlap'
const COLUMNS = 'md:grid-cols-[4.5rem_8.5rem_minmax(0,1fr)_15rem]'

interface BoardProps {
  entries: AgendaEntry[]
  /** Full agenda: a talk's length depends on the room's next talk, even when filtered out. */
  all: AgendaEntry[]
  nowMinutes: number
  fresh: ReadonlyMap<string, number>
}

export function Board({ entries, all, nowMinutes, fresh }: BoardProps) {
  return (
    <section aria-label="Program" className="border border-line">
      <div
        aria-hidden
        className={`hidden border-b border-line px-4 py-2 font-label text-[11px] uppercase tracking-widest text-dim-text md:grid md:gap-x-4 ${COLUMNS}`}
      >
        <span>Čas</span>
        <span>Sál</span>
        <span>Přednáška</span>
        <span>Speakeři</span>
      </div>
      <ol>
        {/* initial={false}: rows already on screen at mount don't animate, later arrivals slide open */}
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <BoardRow
              key={entry.id}
              entry={entry}
              status={statusOf(entry, all, nowMinutes)}
              flapOrder={fresh.get(entry.id)}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}

interface BoardRowProps {
  entry: AgendaEntry
  status: TalkStatus
  /** Set while the row is freshly decoded; its position in the arrival batch. */
  flapOrder: number | undefined
}

function BoardRow({ entry, status, flapOrder }: BoardRowProps) {
  const flapping = flapOrder !== undefined
  const cipher = useMemo(
    () => (flapping ? parseAgenda(entry.ciphertext) : null),
    [flapping, entry.ciphertext],
  )
  const delay = flapRowDelayMs(flapOrder ?? 0)
  const speakers = entry.speakers.join(', ')

  return (
    <motion.li
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="overflow-hidden border-b border-line last:border-b-0"
    >
      <div
        className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 py-3 transition-[opacity,background-color] duration-500 md:items-baseline md:gap-x-4 md:px-4 ${COLUMNS} ${
          status === 'past' ? 'opacity-45' : ''
        } ${flapping ? 'bg-paper/[0.04]' : ''}`}
      >
        <div className="row-span-3 font-mono text-lg font-bold tabular-nums md:row-span-1 md:text-base">
          <SplitFlap
            text={entry.time}
            from={cipher?.time}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.time}
          />
          {status === 'live' && <LiveBadge className="mt-1 md:hidden" />}
        </div>
        <div className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-wider md:text-sm">
          <SplitFlap
            text={entry.room}
            from={cipher?.room}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.room}
          />
          {status === 'live' && <LiveBadge className="hidden md:flex" />}
        </div>
        <div className="font-mono text-sm font-bold leading-snug md:text-[15px]">
          <SplitFlap
            text={entry.title}
            from={cipher?.title}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.text}
          />
        </div>
        <div className="font-label text-sm leading-snug text-dim-text md:font-mono md:text-xs md:uppercase">
          <SplitFlap
            text={speakers}
            from={cipher?.speakers.join(', ')}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.text}
          />
        </div>
      </div>
    </motion.li>
  )
}
