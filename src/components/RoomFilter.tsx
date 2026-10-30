interface Props {
  rooms: string[]
  value: string | null
  onChange: (room: string | null) => void
}

export function RoomFilter({ rooms, value, onChange }: Props) {
  const chip = (label: string, room: string | null) => {
    const on = value === room
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        onClick={() => {
          onChange(room)
        }}
        className={`min-h-[36px] border px-3 font-mono text-xs uppercase tracking-wider transition-colors ${
          on ? 'border-paper bg-paper text-ink' : 'border-line text-paper hover:border-paper'
        }`}
      >
        {label}
      </button>
    )
  }
  return (
    <div role="group" aria-label="Filtr podle sálu" className="flex flex-wrap gap-2">
      {chip('Všechny sály', null)}
      {rooms.map((r) => chip(r, r))}
    </div>
  )
}
