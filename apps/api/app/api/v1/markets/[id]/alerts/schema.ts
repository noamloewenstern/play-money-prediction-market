import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const AlertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  marketId: z.string(),
  optionId: z.string(),
  threshold: z.number(),
  direction: z.enum(['ABOVE', 'BELOW']),
  isActive: z.boolean(),
  triggeredAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  option: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    probability: z.number().nullable(),
  }),
})

export default {
  get: {
    summary: 'Get probability alerts for a market',
    parameters: z.object({ id: z.string() }),
    responses: {
      200: z.object({ data: z.array(AlertSchema) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Create a probability alert for a market option',
    security: true,
    parameters: z.object({ id: z.string() }),
    requestBody: z.object({
      optionId: z.string(),
      threshold: z.number().int().min(0).max(100),
      direction: z.enum(['ABOVE', 'BELOW']),
    }),
    responses: {
      200: z.object({ data: AlertSchema }),
      401: ServerErrorSchema,
      409: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
