import { z } from 'zod';

export const MarketVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);

export type MarketVisibilityType = `${z.infer<typeof MarketVisibilitySchema>}`

export default MarketVisibilitySchema;
