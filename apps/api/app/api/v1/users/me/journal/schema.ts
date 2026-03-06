import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const TradeJournalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  marketId: z.string(),
  optionId: z.string(),
  transactionId: z.string(),
  tradeType: z.string(),
  note: z.string().nullable(),
  probabilityAtTrade: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  market: z.object({
    id: z.string(),
    question: z.string(),
    slug: z.string(),
    resolvedAt: z.date().nullable(),
    canceledAt: z.date().nullable(),
    marketResolution: z.object({ resolutionId: z.string() }).nullable(),
  }),
  option: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  }),
})

export default {
  get: {
    summary: 'Get trade decision journal for the authenticated user',
    security: true,
    parameters: z.object({
      limit: z.coerce.number().optional(),
      cursor: z.string().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(TradeJournalEntrySchema),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
          total: z.number(),
        }),
      }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
