import { z } from 'zod'
import {
  ApiEndpoints,
  createPaginatedResponseSchema,
  paginationSchema,
  ServerErrorSchema,
  zodCoerceCSVToArray,
} from '@play-money/api-helpers'
import { ListSchema, MarketOptionSchema, MarketSchema, MarketVisibilitySchema, QuestionContributionPolicySchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get markets',
    parameters: z
      .object({
        status: z.enum(['active', 'halted', 'closed', 'resolved', 'canceled', 'all']).optional(),
        createdBy: z.string().optional(),
        tags: zodCoerceCSVToArray.optional(),
        marketType: z.enum(['binary', 'multi', 'numeric']).optional(),
        minTraders: z.coerce.number().int().nonnegative().optional(),
        maxTraders: z.coerce.number().int().nonnegative().optional(),
        minLiquidity: z.coerce.number().nonnegative().optional(),
        maxLiquidity: z.coerce.number().nonnegative().optional(),
        closeDateMin: z.coerce.date().optional(),
        closeDateMax: z.coerce.date().optional(),
        featured: z
          .string()
          .transform((v) => v === 'true')
          .optional(),
        parentMarketId: z.string().optional(),
      })
      .merge(paginationSchema)
      .optional(),
    responses: {
      200: createPaginatedResponseSchema(MarketSchema),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Create a market',
    security: true,
    requestBody: MarketSchema.pick({
      question: true,
      description: true,
      resolutionCriteria: true,
      closeDate: true,
      tags: true,
    }).extend({
      options: z.array(
        MarketOptionSchema.pick({
          name: true,
          color: true,
        })
      ),
      type: z.enum(['binary', 'multi', 'list', 'group', 'numeric']),
      contributionPolicy: QuestionContributionPolicySchema.optional(),
      visibility: MarketVisibilitySchema.optional(),
      parentMarketId: z.string().optional(),
      conditionResolution: z.string().optional(),
      numericMin: z.coerce.number().optional(),
      numericMax: z.coerce.number().optional(),
      numericUnit: z.string().optional(),
    }),
    responses: {
      200: z.object({ data: z.object({ market: MarketSchema.optional(), list: ListSchema.optional() }) }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
