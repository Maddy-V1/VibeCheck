import { z } from 'zod'

export const projectSubmissionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(50, 'Tell us more — at least 50 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  tier: z.enum(['tier1', 'tier2', 'tier3'], {
    message: 'Select a tier',
  }),
  live_url: z.string().url('Enter a valid URL including https://'),
  github_url: z
    .string()
    .url('Enter a valid GitHub URL')
    .refine((url) => url.includes('github.com'), 'Must be a GitHub URL')
    .optional()
    .or(z.literal('')),
  demo_video_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  tech_stack: z.array(z.string()).default([]),
  confirmed_live: z.literal(true, {
    error: 'Confirm your project is live',
  }),
  confirmed_own: z.literal(true, {
    error: 'Confirm this is your project',
  }),
  confirmed_guidelines: z.literal(true, {
    error: 'Agree to the guidelines',
  }),
})

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>
