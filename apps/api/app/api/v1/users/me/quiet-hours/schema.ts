import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const QuietHoursSettingsSchema = z.object({
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.number().int().min(0).max(23).nullable(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable(),
  doNotDisturb: z.boolean(),
  timezone: z.string(),
})

export default {
  get: {
    summary: 'Get quiet hours settings for the current user',
    security: true,
    responses: {
      200: z.object({ data: QuietHoursSettingsSchema }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  patch: {
    summary: 'Update quiet hours settings for the current user',
    security: true,
    requestBody: z.object({
      quietHoursEnabled: z.boolean().optional(),
      quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
      quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
      doNotDisturb: z.boolean().optional(),
    }),
    responses: {
      200: z.object({ data: QuietHoursSettingsSchema }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
