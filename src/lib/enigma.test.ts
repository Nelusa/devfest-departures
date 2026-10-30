import { describe, expect, it } from 'vitest'
import { enigma } from './enigma'

describe('enigma', () => {
  it('matches the API test vector', () => {
    expect(enigma('HELLO DEVFEST', 'AAA').output).toBe('IABEA NVTNZMA')
  })

  it('is reciprocal', () => {
    expect(enigma('IABEA NVTNZMA', 'AAA').output).toBe('HELLO DEVFEST')
  })

  it('passes digits, punctuation and diacritics through unchanged', () => {
    const cipher = '12:50 CAPETATXS: RK BAKSQAW BQ FUFZ / RBUQWLD ŠLDQOÍF, LRHXR OPTÁŠKT'
    expect(enigma(cipher, 'HVZ').output).toBe(
      '12:50 MOONSHINE: AI PRINTER GO BRRR / DOMINIK ŠIMONÍK, DENIS VALÁŠEK',
    )
  })

  it('double steps the middle rotor', () => {
    const { steps } = enigma('AAA', 'ADU')
    expect(steps.map((s) => s.position)).toEqual(['ADV', 'AEW', 'BFX'])
    expect(steps[2]?.doubleStep).toBe(true)
  })

  it('records a step only for A–Z', () => {
    expect(enigma('A-1 Š B', 'AAA').steps).toHaveLength(2)
  })
})
