// Enigma I, pure and framework-free.
// Configuration mirrors GET https://devfest-vibe-lounge.web.app/api/enigma

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export interface RotorSpec {
  name: string
  wiring: string
  notch: string
}

/** Left to right. */
export const ROTORS: readonly [RotorSpec, RotorSpec, RotorSpec] = [
  { name: 'I', wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  { name: 'II', wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  { name: 'III', wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
]
export const REFLECTOR = { name: 'B', wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT' }
export const RINGS = 'AAA'
export const PLUGBOARD: readonly string[] = ['DE', 'VF', 'ST']

/** Rotor positions as letter indices, left to right. */
export type Positions = readonly [left: number, middle: number, right: number]

export interface EnigmaStep {
  /** Index of the character in the input string. */
  index: number
  input: string
  output: string
  /** Rotor positions after stepping, e.g. "BFX". */
  position: string
  /** Which rotors moved on this keypress, left to right. */
  moved: readonly [boolean, boolean, boolean]
  doubleStep: boolean
}

export interface EnigmaResult {
  output: string
  steps: EnigmaStep[]
}

const mod26 = (n: number) => ((n % 26) + 26) % 26
const toIndex = (letter: string) => letter.charCodeAt(0) - 65
const toLetter = (index: number) => ALPHABET.charAt(index)
const isMachineLetter = (ch: string) => ch >= 'A' && ch <= 'Z'

/** Wiring tables are total over 0–25, so a miss is a programming error. */
function lookup(table: readonly number[], index: number): number {
  const value = table[index]
  if (value === undefined) throw new RangeError(`Wiring index out of range: ${index}`)
  return value
}

function invert(table: readonly number[]): number[] {
  const inverse = new Array<number>(26)
  table.forEach((out, i) => (inverse[out] = i))
  return inverse
}

interface WiredRotor {
  forward: readonly number[]
  backward: readonly number[]
  notch: number
  ring: number
}

function wire(spec: RotorSpec, slot: RotorSlot): WiredRotor {
  const forward = [...spec.wiring].map(toIndex)
  return { forward, backward: invert(forward), notch: toIndex(spec.notch), ring: toIndex(RINGS.charAt(slot)) }
}

type RotorSlot = 0 | 1 | 2
const RIGHT_TO_LEFT = [2, 1, 0] as const
const LEFT_TO_RIGHT = [0, 1, 2] as const
const wiredRotors = [wire(ROTORS[0], 0), wire(ROTORS[1], 1), wire(ROTORS[2], 2)] as const
const reflector = [...REFLECTOR.wiring].map(toIndex)
const plugboard = PLUGBOARD.reduce(
  (map, pair) => {
    const a = toIndex(pair.charAt(0))
    const b = toIndex(pair.charAt(1))
    map[a] = b
    map[b] = a
    return map
  },
  Array.from({ length: 26 }, (_, i) => i),
)

function passRotor(table: readonly number[], signal: number, position: number, ring: number): number {
  const offset = position - ring
  return mod26(lookup(table, mod26(signal + offset)) - offset)
}

export function isValidStart(start: string): boolean {
  return /^[A-Z]{3}$/.test(start)
}

export function parseStart(start: string): Positions {
  const s = start.toUpperCase()
  if (!isValidStart(s)) throw new Error(`Invalid start position "${start}"`)
  return [toIndex(s.charAt(0)), toIndex(s.charAt(1)), toIndex(s.charAt(2))]
}

export const formatPositions = (positions: Positions) => positions.map(toLetter).join('')

/**
 * Advance the rotors by one keypress. The right rotor always steps; the middle
 * steps when the right one is on its notch, and when the middle one is itself
 * on its notch it steps again together with the left (the double step).
 */
export function stepRotors([left, middle, right]: Positions) {
  const doubleStep = middle === wiredRotors[1].notch
  const moved = [doubleStep, doubleStep || right === wiredRotors[2].notch, true] as const
  const next: Positions = [
    moved[0] ? mod26(left + 1) : left,
    moved[1] ? mod26(middle + 1) : middle,
    mod26(right + 1),
  ]
  return { next, moved, doubleStep }
}

/** Plugboard → R → M → L → reflector → L → M → R → plugboard. */
export function encodeLetter(letter: number, positions: Positions): number {
  let signal = lookup(plugboard, letter)
  for (const slot of RIGHT_TO_LEFT) {
    signal = passRotor(wiredRotors[slot].forward, signal, positions[slot], wiredRotors[slot].ring)
  }
  signal = lookup(reflector, signal)
  for (const slot of LEFT_TO_RIGHT) {
    signal = passRotor(wiredRotors[slot].backward, signal, positions[slot], wiredRotors[slot].ring)
  }
  return lookup(plugboard, signal)
}

/**
 * Encrypt or decrypt (Enigma is reciprocal). Only A–Z goes through the machine
 * and steps the rotors; a–z is upper-cased first; everything else, including
 * Czech diacritics, passes through unchanged.
 */
export function enigma(text: string, start: string): EnigmaResult {
  let positions = parseStart(start)
  let output = ''
  const steps: EnigmaStep[] = []

  for (const [index, raw] of [...text].entries()) {
    const ch = raw >= 'a' && raw <= 'z' ? raw.toUpperCase() : raw
    if (!isMachineLetter(ch)) {
      output += raw
      continue
    }
    const { next, moved, doubleStep } = stepRotors(positions)
    positions = next
    const out = toLetter(encodeLetter(toIndex(ch), positions))
    output += out
    steps.push({ index, input: ch, output: out, position: formatPositions(positions), moved, doubleStep })
  }

  return { output, steps }
}
