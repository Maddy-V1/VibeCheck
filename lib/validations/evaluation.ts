import { z } from 'zod'

export const evaluationSchema = z
  .object({
    project_id: z.string().uuid(),
    tier_confirmed: z.enum(['tier1', 'tier2', 'tier3']),
    score_functionality: z.number().min(0).max(25),
    score_ux: z.number().min(0).max(20),
    score_complexity: z.number().min(0).max(20),
    score_deployment: z.number().min(0).max(10),
    score_code_quality: z.number().min(0).max(10),
    score_documentation: z.number().min(0).max(8),
    score_originality: z.number().min(0).max(7),
    reviewer_note: z
      .string()
      .min(50, 'Write at least 50 chars — users deserve real feedback')
      .max(500),
    internal_notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const total =
        data.score_functionality +
        data.score_ux +
        data.score_complexity +
        data.score_deployment +
        data.score_code_quality +
        data.score_documentation +
        data.score_originality
      return total <= 100
    },
    { message: 'Total score cannot exceed 100' }
  )
