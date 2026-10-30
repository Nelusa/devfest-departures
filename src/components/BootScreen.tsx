import { motion } from 'framer-motion'
import { SignalBars } from './SignalBars'

/** Shown until the first poll and the fonts are in, so the board appears in one piece. */
export function BootScreen() {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[45] grid place-items-center bg-ink px-6 text-center"
    >
      <div className="grid justify-items-center gap-4">
        <SignalBars className="h-8" />
        <p className="font-mono text-sm font-bold uppercase tracking-[0.3em]">Tuning in</p>
        <p className="font-label text-sm text-dim-text">Zachytávám Enigma vysílání…</p>
      </div>
    </motion.div>
  )
}
