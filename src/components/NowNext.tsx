import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'
import { endMinutes, nowPlaying, parseAgenda, toMinutes, upNext, type AgendaEntry } from '../lib/agenda'
import { FLAP_FIELD_DELAY_MS, flapRowDelayMs } from '../lib/flap'
import { formatCountdown, fromMinutes } from '../lib/time'
import { SplitFlap } from './SplitFlap'

interface NowNextProps {
  entries: AgendaEntry[]
  /** seconds since midnight, Europe/Prague */
  clock: number
  fresh: ReadonlyMap<string, number>
}

export function NowNext({ entries, clock, fresh }: NowNextProps) {
  const nowMinutes = Math.floor(clock / 60)
  const live = nowPlaying(entries, nowMinutes)
  const next = upNext(entries, nowMinutes)
  const nextStart = next[0] ? toMinutes(next[0].time) : null
  const minutesToNext = nextStart === null ? null : Math.ceil((nextStart * 60 - clock) / 60)

  return (
    <section aria-label="Teď a dál" className="grid gap-px border border-line bg-line md:grid-cols-[3fr_2fr]">
      <div className="bg-paper p-4 text-ink sm:p-5">
        <PanelHeading title="Teď">
          {live.length > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-signal">
              <span aria-hidden className="pulse-dot inline-block h-2 w-2 bg-signal" />
              {liveRoomsLabel(live.length)}
            </span>
          )}
        </PanelHeading>
        {live.length === 0 ? (
          <p className="font-label text-sm text-ink-muted">{idleMessage(entries.length, minutesToNext)}</p>
        ) : (
          <TalkList divider="divide-ink/15">
            {live.map((talk) => {
              const start = toMinutes(talk.time)
              const end = endMinutes(talk, entries)
              const progress = Math.min(1, Math.max(0, (clock / 60 - start) / (end - start)))
              return (
                <TalkItem
                  key={talk.id}
                  talk={talk}
                  flapOrder={fresh.get(talk.id)}
                  muted="text-ink-muted"
                  titleSize="sm:text-lg"
                  meta={
                    <span className="tabular-nums text-ink-muted">
                      {talk.time}–{fromMinutes(end)}
                    </span>
                  }
                  footer={
                    <div aria-hidden className="mt-2 h-px bg-ink/15">
                      <div
                        className="h-px bg-signal transition-[width] duration-1000"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  }
                />
              )
            })}
          </TalkList>
        )}
      </div>

      <div className="bg-ink p-4 sm:p-5">
        <PanelHeading title="Dál">
          {next[0] && minutesToNext !== null && (
            <span className="font-mono text-sm uppercase tabular-nums tracking-wider">
              {next[0].time} · <span className="font-bold">{formatCountdown(minutesToNext)}</span>
            </span>
          )}
        </PanelHeading>
        {next.length === 0 ? (
          <p className="font-label text-sm text-dim-text">
            {entries.length > 0 ? 'Žádný další zachycený bod programu.' : 'Tabule se plní s každou zprávou.'}
          </p>
        ) : (
          <TalkList divider="divide-line">
            {next.map((talk) => (
              <TalkItem
                key={talk.id}
                talk={talk}
                flapOrder={fresh.get(talk.id)}
                muted="text-dim-text"
                titleSize="sm:text-base"
              />
            ))}
          </TalkList>
        )}
      </div>
    </section>
  )
}

function liveRoomsLabel(count: number): string {
  if (count === 1) return '1 sál živě'
  return count < 5 ? `${count} sály živě` : `${count} sálů živě`
}

function idleMessage(entryCount: number, minutesToNext: number | null): string {
  if (minutesToNext !== null) return `Teď nic neběží. Další blok začíná ${formatCountdown(minutesToNext)}.`
  if (entryCount > 0) return 'Program pro dnešek skončil.'
  return 'Čekám na první zachycenou zprávu…'
}

function PanelHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-5xl leading-[0.85] tracking-wide sm:text-6xl">{title}</h2>
      {children}
    </div>
  )
}

function TalkList({ divider, children }: { divider: string; children: ReactNode }) {
  return (
    <ul className={`divide-y ${divider}`}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </ul>
  )
}

interface TalkItemProps {
  talk: AgendaEntry
  flapOrder: number | undefined
  /** colour class for secondary text, differs between the paper and ink panels */
  muted: string
  titleSize: string
  /** right-aligned next to the room */
  meta?: ReactNode
  /** below the speakers */
  footer?: ReactNode
}

function TalkItem({ talk, flapOrder, muted, titleSize, meta, footer }: TalkItemProps) {
  const flapping = flapOrder !== undefined
  const cipher = useMemo(() => (flapping ? parseAgenda(talk.ciphertext) : null), [flapping, talk.ciphertext])
  const delay = flapRowDelayMs(flapOrder ?? 0)

  return (
    <motion.li
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="group overflow-hidden"
    >
      <div className="py-3 group-first:pt-0 group-last:pb-0">
        <div className="flex items-baseline justify-between gap-3 font-mono text-xs uppercase tracking-wider">
          <SplitFlap
            className="font-bold"
            text={talk.room}
            from={cipher?.room}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.room}
          />
          {meta}
        </div>
        <p className={`mt-1 font-mono text-base font-bold leading-snug ${titleSize}`}>
          <SplitFlap
            text={talk.title}
            from={cipher?.title}
            active={flapping}
            delayMs={delay + FLAP_FIELD_DELAY_MS.text}
          />
        </p>
        {talk.speakers.length > 0 && (
          <p className={`mt-0.5 font-label text-sm ${muted}`}>
            <SplitFlap
              text={talk.speakers.join(', ')}
              from={cipher?.speakers.join(', ')}
              active={flapping}
              delayMs={delay + FLAP_FIELD_DELAY_MS.text}
            />
          </p>
        )}
        {footer}
      </div>
    </motion.li>
  )
}
