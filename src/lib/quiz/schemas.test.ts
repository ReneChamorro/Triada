import { describe, it, expect } from 'vitest'
import { quizDefinitionSchema, quizSubmissionSchema } from './schemas'

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const base = { instructions: null, passingScore: 70, maxAttempts: 3 }

describe('quizDefinitionSchema', () => {
  it('accepts a valid quiz with all four types', () => {
    const result = quizDefinitionSchema.safeParse({
      ...base,
      questions: [
        { id: uuid(1), type: 'single', prompt: '¿Quién?', points: 1,
          options: [{ id: 'a', text: 'Beck' }, { id: 'b', text: 'Ellis' }], correctOptionIds: ['a'] },
        { id: uuid(2), type: 'multiple', prompt: 'Elige', points: 1,
          options: [{ id: 'a', text: 'X' }, { id: 'b', text: 'Y' }], correctOptionIds: ['a', 'b'] },
        { id: uuid(3), type: 'fill', prompt: 'Terapia [[ ]] conductual', points: 1, blanks: [['cognitiva']], strict: false },
        { id: uuid(4), type: 'essay', prompt: 'Explica', points: 5, graderNotes: 'Rúbrica' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a single-choice question with two correct answers', () => {
    const result = quizDefinitionSchema.safeParse({
      ...base,
      questions: [{ id: uuid(1), type: 'single', prompt: 'P', points: 1,
        options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionIds: ['a', 'b'] }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a correct answer that is not one of the options', () => {
    const result = quizDefinitionSchema.safeParse({
      ...base,
      questions: [{ id: uuid(1), type: 'multiple', prompt: 'P', points: 1,
        options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionIds: ['z'] }],
    })
    expect(result.success).toBe(false)
  })

  it('requires one answer list per blank', () => {
    const result = quizDefinitionSchema.safeParse({
      ...base,
      questions: [{ id: uuid(1), type: 'fill', prompt: '[[ ]] y [[ ]]', points: 1, blanks: [['a']], strict: false }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an answer written inside the visible prompt', () => {
    const result = quizDefinitionSchema.safeParse({
      ...base,
      questions: [{ id: uuid(1), type: 'fill', prompt: 'Capital: [[Caracas]] [[ ]]', points: 1, blanks: [['a']], strict: false }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects duplicate question ids', () => {
    const q = { id: uuid(1), type: 'essay', prompt: 'P', points: 1 }
    expect(quizDefinitionSchema.safeParse({ ...base, questions: [q, q] }).success).toBe(false)
  })
})

describe('quizSubmissionSchema', () => {
  it('rejects unknown question types and oversized essays', () => {
    expect(quizSubmissionSchema.safeParse({ answers: [{ questionId: uuid(1), type: 'magic' }] }).success).toBe(false)
    expect(quizSubmissionSchema.safeParse({
      answers: [{ questionId: uuid(1), type: 'essay', text: 'x'.repeat(10001) }],
    }).success).toBe(false)
  })
})
