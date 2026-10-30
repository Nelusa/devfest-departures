// Split-flap timing, shared by the animation and by the code that decides
// when a freshly decoded entry has finished revealing.

export const FLAP_TICK_MS = 45
/** Ticks every cell spins before the first one locks. */
export const FLAP_SPIN_TICKS = 7
/** Extra ticks per character, so cells lock left to right. */
export const FLAP_STAGGER_TICKS = 0.6
/** Delay between entries when several transmissions are decoded at once. */
export const FLAP_ROW_STAGGER_MS = 450
/** Offsets of the room and title/speaker fields relative to the row start. */
export const FLAP_FIELD_DELAY_MS = { time: 0, room: 100, text: 200 } as const

export const flapDurationMs = (length: number) =>
  (FLAP_SPIN_TICKS + length * FLAP_STAGGER_TICKS) * FLAP_TICK_MS

export const flapRowDelayMs = (order: number) => order * FLAP_ROW_STAGGER_MS

/** When the whole row (its longest field) has locked onto the plaintext. */
export function flapRowEndMs(order: number, longestFieldLength: number): number {
  return flapRowDelayMs(order) + FLAP_FIELD_DELAY_MS.text + flapDurationMs(longestFieldLength)
}
