import { z } from 'zod/v4'

// === Primitives ===

export const uuidSchema = z.uuid()

export const emailSchema = z.email()

export const phoneSchema = z.string().regex(
  /^\+?[\d\s\-().]{7,20}$/,
  'Número de teléfono inválido'
)

export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo')

// === Payment ===

export const paymentMethodSchema = z.enum([
  'zelle',
  'pago_movil',
  'transferencia_usd',
  'paypal_manual',
])

export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const referenceCodeSchema = z
  .string()
  .min(1, 'El código de referencia es requerido')
  .max(100, 'El código de referencia es muy largo')
  .regex(/^[a-zA-Z0-9\-_.\s]+$/, 'El código contiene caracteres inválidos')

// === API Schemas ===

export const paymentSubmitSchema = z.object({
  courseId: uuidSchema,
  paymentMethod: paymentMethodSchema,
  referenceCode: referenceCodeSchema,
  notes: z.string().max(500, 'Las notas son muy largas').optional(),
})

export type PaymentSubmitInput = z.infer<typeof paymentSubmitSchema>

export const grantAccessSchema = z.object({
  userId: uuidSchema,
  courseId: uuidSchema,
  paymentMethod: z.string().min(1).max(50).optional(),
  amountPaid: z.number().min(0).optional(),
  paymentId: z.string().max(200).optional(),
  adminNote: z.string().max(500).optional(),
})

export type GrantAccessInput = z.infer<typeof grantAccessSchema>

export const purchaseActionSchema = z.object({
  purchaseId: uuidSchema,
  reason: z.string().max(500).optional(),
})

export type PurchaseActionInput = z.infer<typeof purchaseActionSchema>

// === Registration ===

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  lastname: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  phone: phoneSchema.optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

// === Helpers ===

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map(issue => issue.message).join('. ')
}
