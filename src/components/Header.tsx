import type { SignalStatus } from '../hooks/useTransmissions'
import { formatClock } from '../lib/time'

interface Props {
  clock: number
  intercepted: number
  status: SignalStatus
}

export function Header({ clock, intercepted, status }: Props) {
  const lost = status === 'lost'
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.75rem] leading-none tracking-wide sm:text-4xl">
            DevFest Departures
          </h1>
          <p className="truncate font-label text-[11px] uppercase tracking-widest text-dim-text">
            Vibe Lounge · Enigma I intercept
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 font-mono text-[11px] uppercase tracking-wider sm:flex-row sm:items-center sm:gap-5 sm:text-xs">
          {/* fixed width so the label swap (Tuning in → On air) doesn't nudge the title */}
          <span
            className={`flex min-w-[7rem] items-center justify-end gap-1.5 ${lost ? 'text-signal' : ''}`}
            role="status"
          >
            <span aria-hidden className={`inline-block h-2 w-2 bg-signal ${lost ? '' : 'pulse-dot'}`} />
            {lost ? 'Signal lost' : status === 'connecting' ? 'Tuning in' : 'On air'}
          </span>
          <span className="hidden text-dim-text sm:inline">
            Intercepted <span className="text-paper">{intercepted}</span>
          </span>
          <time className="text-base tabular-nums tracking-normal sm:text-lg" aria-label="Čas v Praze">
            {formatClock(clock)}
          </time>
        </div>
      </div>
    </header>
  )
}
