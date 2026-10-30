const BARS = [0, 1, 2, 3, 4, 5, 6]

export function SignalBars({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`flex items-end gap-[3px] ${className}`}>
      {BARS.map((i) => (
        <span
          key={i}
          className="listen-bar block h-full w-[3px] bg-paper/70"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  )
}
