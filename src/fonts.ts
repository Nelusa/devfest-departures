// Self-hosted so the board renders identically offline (SIGNAL LOST) and
// never swaps typefaces mid-flap. Only the weights and subsets we use.
import '@fontsource/bebas-neue/latin-400.css'
import '@fontsource/bebas-neue/latin-ext-400.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-ext-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import '@fontsource/jetbrains-mono/latin-ext-700.css'
import '@fontsource/courier-prime/latin-400.css'
import '@fontsource/courier-prime/latin-ext-400.css'

/** Font faces the first screen needs; loaded before we reveal the board. */
export const CRITICAL_FONTS = [
  '400 1em "Bebas Neue"',
  '400 1em "JetBrains Mono"',
  '700 1em "JetBrains Mono"',
  '400 1em "Courier Prime"',
]
