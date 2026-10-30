import { useId, useState, type ChangeEvent } from 'react'
import { parseAgenda, type AgendaEntry } from '../lib/agenda'
import { enigma, isValidStart } from '../lib/enigma'

interface ManualDecodeProps {
  onPin: (ciphertext: string, start: string) => AgendaEntry | null
  defaultOpen: boolean
}

const sanitizeStart = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)

/** Offline fallback: paste a transmission, decode it, pin it to the board. */
export function ManualDecode({ onPin, defaultOpen }: ManualDecodeProps) {
  const id = useId()
  const [start, setStart] = useState('AAA')
  const [ciphertext, setCiphertext] = useState('')
  const [note, setNote] = useState<string | null>(null)

  const plaintext = isValidStart(start) && ciphertext ? enigma(ciphertext, start).output : ''
  const canPin = plaintext !== '' && parseAgenda(plaintext) !== null

  const handleStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStart(sanitizeStart(event.target.value))
  }
  const handleCiphertextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCiphertext(event.target.value)
    setNote(null)
  }
  const handlePin = () => {
    const entry = onPin(ciphertext, start)
    setNote(entry ? `Připnuto: ${entry.time} ${entry.room}` : 'Nepodařilo se rozpoznat formát.')
  }

  return (
    <details open={defaultOpen} className="group border border-line">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 font-mono text-xs uppercase tracking-widest">
        Manual decode
        <span aria-hidden className="text-dim-text transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-3 border-t border-line p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label
            htmlFor={`${id}-start`}
            className="grid gap-1 font-label text-xs uppercase tracking-wider text-dim-text"
          >
            Start
            <input
              id={`${id}-start`}
              value={start}
              onChange={handleStartChange}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="w-20 border border-line bg-ink px-2 py-2 font-mono text-lg tracking-[0.3em] text-paper"
            />
          </label>
          <p className="pb-2 font-label text-xs text-dim-text">
            Rotory I · II · III, reflektor B, plugboard DE VF ST
          </p>
        </div>
        <label
          htmlFor={`${id}-ciphertext`}
          className="grid gap-1 font-label text-xs uppercase tracking-wider text-dim-text"
        >
          Ciphertext
          <textarea
            id={`${id}-ciphertext`}
            value={ciphertext}
            onChange={handleCiphertextChange}
            rows={3}
            spellCheck={false}
            placeholder="12:50 CAPETATXS: RK BAKSQAW BQ FUFZ / …"
            className="border border-line bg-ink p-2 font-mono text-sm normal-case tracking-normal text-paper placeholder:text-dim"
          />
        </label>
        <output
          aria-live="polite"
          className="min-h-[3rem] border border-line bg-paper/[0.03] p-2 font-mono text-sm"
        >
          {plaintext || <span className="text-dim-text">—</span>}
        </output>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canPin}
            onClick={handlePin}
            className="min-h-[40px] border border-paper bg-paper px-4 font-mono text-xs font-bold uppercase tracking-wider text-ink disabled:border-line disabled:bg-transparent disabled:text-dim-text"
          >
            Připnout na tabuli
          </button>
          {note && <span className="font-label text-sm text-dim-text">{note}</span>}
        </div>
      </div>
    </details>
  )
}
