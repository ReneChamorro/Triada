import { describe, it, expect } from 'vitest'
import { normalizeAnswer, gradeQuestion, gradeQuiz, type GradableQuestion, type AnswerKey } from './grading'

const single: GradableQuestion = { id: 'q1', type: 'single', points: 2, blankCount: 0 }
const multiple: GradableQuestion = { id: 'q2', type: 'multiple', points: 3, blankCount: 0 }
const fill: GradableQuestion = { id: 'q3', type: 'fill', points: 3, blankCount: 3 }
const essay: GradableQuestion = { id: 'q4', type: 'essay', points: 5, blankCount: 0 }

const keys: AnswerKey[] = [
  { questionId: 'q1', correctOptionIds: ['a'], blankAnswers: [], strict: false },
  { questionId: 'q2', correctOptionIds: ['a', 'c'], blankAnswers: [], strict: false },
  { questionId: 'q3', correctOptionIds: [], blankAnswers: [['Pávlov', 'Pavlov'], ['perro'], ['campana']], strict: false },
]
const key = (id: string) => keys.find((k) => k.questionId === id)

describe('normalizeAnswer', () => {
  it('ignores case, accents, extra spaces and edge punctuation', () => {
    expect(normalizeAnswer('  Terapia   Cognitiva. ', false)).toBe('terapia cognitiva')
    expect(normalizeAnswer('¿Pávlov?', false)).toBe('pavlov')
  })
  it('keeps case and accents in strict mode', () => {
    expect(normalizeAnswer('Pávlov', true)).toBe('Pávlov')
    expect(normalizeAnswer('pavlov', true)).not.toBe(normalizeAnswer('Pávlov', true))
  })
})

describe('gradeQuestion', () => {
  it('single: full points only for the correct option', () => {
    expect(gradeQuestion(single, key('q1'), { questionId: 'q1', type: 'single', optionId: 'a' })).toBe(2)
    expect(gradeQuestion(single, key('q1'), { questionId: 'q1', type: 'single', optionId: 'b' })).toBe(0)
    expect(gradeQuestion(single, key('q1'), { questionId: 'q1', type: 'single', optionId: null })).toBe(0)
  })

  it('multiple: all-or-nothing on the exact set', () => {
    const grade = (optionIds: string[]) =>
      gradeQuestion(multiple, key('q2'), { questionId: 'q2', type: 'multiple', optionIds })
    expect(grade(['c', 'a'])).toBe(3)
    expect(grade(['a'])).toBe(0)
    expect(grade(['a', 'b', 'c'])).toBe(0)
    expect(grade([])).toBe(0)
  })

  it('fill: proportional credit per blank, empty never matches', () => {
    const grade = (blanks: string[]) =>
      gradeQuestion(fill, key('q3'), { questionId: 'q3', type: 'fill', blanks })
    expect(grade(['pavlov', 'Perro', 'campana'])).toBe(3)
    expect(grade(['Pavlov', 'gato', 'campana'])).toBe(2)
    expect(grade(['', '', ''])).toBe(0)
  })

  it('essay: text needs review, empty scores 0', () => {
    expect(gradeQuestion(essay, undefined, { questionId: 'q4', type: 'essay', text: 'Mi respuesta' })).toBeNull()
    expect(gradeQuestion(essay, undefined, { questionId: 'q4', type: 'essay', text: '   ' })).toBe(0)
    expect(gradeQuestion(essay, undefined, undefined)).toBe(0)
  })

  it('a missing or mismatched answer scores 0', () => {
    expect(gradeQuestion(single, key('q1'), undefined)).toBe(0)
    expect(gradeQuestion(single, key('q1'), { questionId: 'q1', type: 'multiple', optionIds: ['a'] })).toBe(0)
  })
})

describe('gradeQuiz', () => {
  it('returns the grade immediately when there is no essay to review', () => {
    const result = gradeQuiz([single, multiple], keys, [
      { questionId: 'q1', type: 'single', optionId: 'a' },
      { questionId: 'q2', type: 'multiple', optionIds: ['a'] },
    ], 40)
    expect(result.needsReview).toBe(false)
    expect(result.maxPoints).toBe(5)
    expect(result.autoPoints).toBe(2)
    expect(result.scorePercent).toBe(40)
    expect(result.passed).toBe(true) // inclusive threshold
  })

  it('withholds the grade while an essay is pending review', () => {
    const result = gradeQuiz([single, essay], keys, [
      { questionId: 'q1', type: 'single', optionId: 'a' },
      { questionId: 'q4', type: 'essay', text: 'Desarrollo' },
    ], 70)
    expect(result.needsReview).toBe(true)
    expect(result.scorePercent).toBeNull()
    expect(result.passed).toBeNull()
  })

  it('fails below the passing score', () => {
    const result = gradeQuiz([single, multiple], keys, [], 70)
    expect(result.scorePercent).toBe(0)
    expect(result.passed).toBe(false)
  })
})
