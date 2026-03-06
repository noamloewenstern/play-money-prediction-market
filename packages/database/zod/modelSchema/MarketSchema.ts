import { z } from 'zod';
import { MarketVisibilitySchema } from '../inputTypeSchemas/MarketVisibilitySchema';

/////////////////////////////////////////
// MARKET SCHEMA
/////////////////////////////////////////

export const MarketSchema = z.object({
  id: z.string().cuid(),
  question: z.string().trim().min(1, { message: "Question is required" }),
  description: z.string(),
  resolutionCriteria: z.string().nullable(),
  slug: z.string().min(1, { message: "Slug is required" }),
  closeDate: z.coerce.date().nullable(),
  closedAt: z.coerce.date().nullable(),
  resolvedAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  canceledById: z.string().nullable(),
  createdBy: z.string(),
  tags: z.string().trim().array().max(5),
  ammAccountId: z.string(),
  clearingAccountId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  commentCount: z.number().int().nullable(),
  uniqueTradersCount: z.number().int().nullable(),
  uniquePromotersCount: z.number().int().nullable(),
  liquidityCount: z.number().int().nullable(),
  parentListId: z.string().nullable(),
  visibility: MarketVisibilitySchema.optional(),
  isFeatured: z.boolean().optional(),
  featuredAt: z.coerce.date().nullable().optional(),
  parentMarketId: z.string().nullable().optional(),
  conditionResolution: z.string().nullable().optional(),
  activatedAt: z.coerce.date().nullable().optional(),
  numericMin: z.number().nullable().optional(),
  numericMax: z.number().nullable().optional(),
  numericUnit: z.string().nullable().optional(),
  numericResolution: z.number().nullable().optional(),
})

export type Market = z.infer<typeof MarketSchema>

export default MarketSchema;
