const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Prague',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** Seconds since midnight in Europe/Prague. */
export function pragueSeconds(date: Date): number {
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
}

export function formatClock(sec: number): string {
  const s = ((Math.floor(sec) % 86400) + 86400) % 86400
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

/** "za 12 min", "za 1 h 05 min", "právě začíná" */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'právě začíná'
  if (minutes < 60) return `za ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `za ${h} h ${String(m).padStart(2, '0')} min` : `za ${h} h`
}

export const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
