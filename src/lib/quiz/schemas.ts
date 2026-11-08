import { z } from 'zod/v4'
import { countBlanks, hasFilledMarker } from './blanks'

// === Authoring (admin) ===

const optionSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  text: z.string().trim().min(1, 'Las opciones no pueden estar vacías').max(500),
})

const questionBase = {
  id: z.uuid(),
  prompt: z.string().trim().min(1, 'El enunciado es requerido').max(4000),
  points: z.number().positive('Los puntos deben ser mayores a 0').max(1000),
}

const questionDefinitionSchema = z.discriminatedUnion('type', [
  z.object({
    ...questionBase,
    type: z.literal('single'),
    options: z.array(optionSchema).min(2, 'Se necesitan al menos 2 opciones').max(10),
    correctOptionIds: z.array(z.string()).length(1, 'Marca exactamente una respuesta correcta'),
  }),
  z.object({
    ...questionBase,
    type: z.literal('multiple'),
    options: z.array(optionSchema).min(2, 'Se necesitan al menos 2 opciones').max(10),
    correctOptionIds: z.array(z.string()).min(1, 'Marca al menos una respuesta correcta').max(10),
  }),
  z.object({
    ...questionBase,
    type: z.literal('fill'),
    blanks: z
      .array(z.array(z.string().trim().min(1).max(200)).min(1, 'Cada espacio necesita al menos una respuesta').max(20))
      .min(1, 'Agrega al menos un espacio [[ ]] al enunciado')
      .max(20),
    strict: z.boolean(),
  }),
  z.object({
    ...questionBase,
    type: z.literal('essay'),
    graderNotes: z.string().trim().max(4000).nullable().optional(),
  }),
])

export const quizDefinitionSchema = z
  .object({
    instructions: z.string().trim().max(4000).nullable().optional(),
    passingScore: z.number().int().min(0).max(100),
    maxAttempts: z.number().int().min(1).max(50).nullable(),
    questions: z.array(questionDefinitionSchema).min(1, 'Agrega al menos una pregunta').max(100),
  })
  .superRefine((quiz, ctx) => {
    const seen = new Set<string>()
    quiz.questions.forEach((q, i) => {
      const n = i + 1
      if (seen.has(q.id)) {
        ctx.addIssue({ code: 'custom', message: `Pregunta ${n}: identificador duplicado`, path: ['questions', i] })
      }
      seen.add(q.id)

      if (hasFilledMarker(q.prompt)) {
        ctx.addIssue({
          code: 'custom',
          message: `Pregunta ${n}: escribe los espacios como [[ ]] vacíos; las respuestas van aparte`,
          path: ['questions', i, 'prompt'],
        })
      }

      if (q.type === 'single' || q.type === 'multiple') {
        const optionIds = new Set(q.options.map((o) => o.id))
        if (optionIds.size !== q.options.length) {
          ctx.addIssue({ code: 'custom', message: `Pregunta ${n}: opciones duplicadas`, path: ['questions', i] })
        }
        if (new Set(q.correctOptionIds).size !== q.correctOptionIds.length ||
            q.correctOptionIds.some((id) => !optionIds.has(id))) {
          ctx.addIssue({ code: 'custom', message: `Pregunta ${n}: respuesta correcta inválida`, path: ['questions', i] })
        }
      }

      if (q.type === 'fill' && countBlanks(q.prompt) !== q.blanks.length) {
        ctx.addIssue({
          code: 'custom',
          message: `Pregunta ${n}: el enunciado tiene ${countBlanks(q.prompt)} espacio(s) [[ ]] y ${q.blanks.length} lista(s) de respuestas`,
          path: ['questions', i],
        })
      }
    })
  })

export type QuizDefinition = z.infer<typeof quizDefinitionSchema>
export type QuestionDefinition = QuizDefinition['questions'][number]

// === Submission (student) ===

const answerSchema = z.discriminatedUnion('type', [
  z.object({ questionId: z.uuid(), type: z.literal('single'), optionId: z.string().max(64).nullable() }),
  z.object({ questionId: z.uuid(), type: z.literal('multiple'), optionIds: z.array(z.string().max(64)).max(20) }),
  z.object({ questionId: z.uuid(), type: z.literal('fill'), blanks: z.array(z.string().max(200)).max(20) }),
  z.object({ questionId: z.uuid(), type: z.literal('essay'), text: z.string().max(10000) }),
])

export const quizSubmissionSchema = z.object({
  answers: z.array(answerSchema).max(100),
})

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>

// === Essay grading (instructor) ===

export const essayGradeSchema = z.object({
  grades: z
    .array(
      z.object({
        answerId: z.uuid(),
        points: z.number().min(0).max(1000),
        feedback: z.string().trim().max(2000).nullable().optional(),
      })
    )
    .max(100),
  finalize: z.boolean(),
})
