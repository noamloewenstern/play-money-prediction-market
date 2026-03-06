import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

const PositionDetailSchema = z.object({
  marketId: z.string(),
  marketQuestion: z.string(),
  optionName: z.string(),
  optionColor: z.string(),
  value: z.number(),
  cost: z.number(),
  quantity: z.number(),
  pnl: z.number(),
  pnlPercent: z.number(),
})

const TagExposureSchema = z.object({
  tag: z.string(),
  totalValue: z.number(),
  totalCost: z.number(),
  pnl: z.number(),
  pnlPercent: z.number(),
  positionCount: z.number(),
  positions: z.array(PositionDetailSchema),
})

const CorrelatedGroupSchema = z.object({
  tags: z.array(z.string()),
  totalValue: z.number(),
  positionCount: z.number(),
  marketIds: z.array(z.string()),
})

export default {
  get: {
    summary: 'Get portfolio exposure heatmap data for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.object({
          totalValue: z.number(),
          totalCost: z.number(),
          totalPnl: z.number(),
          maxLoss: z.number(),
          tagExposures: z.array(TagExposureSchema),
          correlatedGroups: z.array(CorrelatedGroupSchema),
          untaggedExposure: TagExposureSchema.nullable(),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
