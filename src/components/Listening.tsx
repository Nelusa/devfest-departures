import { SignalBars } from './SignalBars'

interface ListeningProps {
  secondsToNext: number | null
}

export function Listening({ secondsToNext }: ListeningProps) {
  return (
    <div className="flex items-center gap-4 border border-t-0 border-line px-4 py-5">
      <SignalBars className="h-6" />
      <div>
        <p className="font-mono text-sm font-bold uppercase tracking-wider">Listening…</p>
        <p className="font-label text-sm text-dim-text">
          Nové zprávy každou minutu
          {secondsToNext ? <span className="tabular-nums"> · další za {secondsToNext} s</span> : null}
        </p>
      </div>
    </div>
  )
}
