import { describe, it, expect } from 'vitest'
import { countBlanks, hasFilledMarker, splitPrompt } from './blanks'

describe('blanks', () => {
  it('counts empty markers, with or without inner spaces', () => {
    expect(countBlanks('El condicionamiento [[ ]] fue descrito por [[]].')).toBe(2)
    expect(countBlanks('Sin espacios')).toBe(0)
  })

  it('splits a prompt into text and numbered blanks', () => {
    expect(splitPrompt('A [[ ]] y [[ ]].')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'blank', index: 0 },
      { kind: 'text', text: ' y ' },
      { kind: 'blank', index: 1 },
      { kind: 'text', text: '.' },
    ])
  })

  it('detects an answer written inside a marker', () => {
    expect(hasFilledMarker('La capital es [[Caracas]]')).toBe(true)
    expect(hasFilledMarker('La capital es [[  ]]')).toBe(false)
  })
})
