import { describe, it, expect } from 'vitest'
import { toReviewDisplayName } from './display-name'

describe('toReviewDisplayName', () => {
  it('uses the first name and the initial of the last name', () => {
    expect(toReviewDisplayName({ name: 'maría josé', lastname: 'González Pérez' })).toBe('María G.')
  })
  it('falls back to full_name', () => {
    expect(toReviewDisplayName({ full_name: 'Andrés Rivas' })).toBe('Andrés R.')
  })
  it('works with a single name', () => {
    expect(toReviewDisplayName({ name: 'Lucía' })).toBe('Lucía')
  })
  it('returns a neutral label when there is no usable name', () => {
    expect(toReviewDisplayName({ name: '  ', full_name: '123' })).toBe('Estudiante')
  })
})
