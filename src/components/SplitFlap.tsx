import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FLAP_SPIN_TICKS, FLAP_STAGGER_TICKS, FLAP_TICK_MS } from '../lib/flap'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const FADE_MS = 600

const isFlippable = (ch: string) => /[\p{L}\p{N}]/u.test(ch)
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? 'X'

interface SplitFlapProps {
  text: string
  /** What the cells show before they start spinning (the ciphertext). Same length as `text`. */
  from?: string
  active: boolean
  delayMs?: number
  /** Called on every tick that changes cells, e.g. for a clack sound. */
  onTick?: () => void
  className?: string
}

/**
 * Split-flap text: every letter spins through random glyphs and locks onto the
 * target, left to right. Width never changes (monospace, same length), so the
 * layout stays still. With reduced motion the text simply fades in.
 */
export function SplitFlap({ text, from, active, delayMs = 0, onTick, className }: SplitFlapProps) {
  const reduceMotion = useReducedMotion()
  const animate = active && !reduceMotion
  const [frame, setFrame] = useState<{ shown: string; locked: number } | null>(() =>
    animate ? { shown: from ?? text, locked: 0 } : null,
  )
  const tickHandler = useRef(onTick)
  tickHandler.current = onTick

  useEffect(() => {
    if (!active || reduceMotion) {
      setFrame(null)
      return
    }

    const target = [...text]
    const lastTick = FLAP_SPIN_TICKS + target.length * FLAP_STAGGER_TICKS
    let tick = 0
    let interval: ReturnType<typeof setInterval> | undefined
    setFrame({ shown: from ?? text, locked: 0 })

    const start = setTimeout(() => {
      interval = setInterval(() => {
        tick += 1
        if (tick >= lastTick) {
          clearInterval(interval)
          setFrame(null)
          return
        }
        const shown = target
          .map((ch, i) =>
            tick >= FLAP_SPIN_TICKS + i * FLAP_STAGGER_TICKS || !isFlippable(ch) ? ch : randomGlyph(),
          )
          .join('')
        const locked = Math.max(0, Math.floor((tick - FLAP_SPIN_TICKS) / FLAP_STAGGER_TICKS) + 1)
        setFrame({ shown, locked })
        tickHandler.current?.()
      }, FLAP_TICK_MS)
    }, delayMs)

    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [active, reduceMotion, text, from, delayMs])

  if (active && reduceMotion) {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: FADE_MS / 1000 }}
      >
        {text}
      </motion.span>
    )
  }

  if (!frame) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{frame.shown.slice(0, frame.locked)}</span>
      <span aria-hidden className="opacity-50">
        {frame.shown.slice(frame.locked)}
      </span>
    </span>
  )
}
