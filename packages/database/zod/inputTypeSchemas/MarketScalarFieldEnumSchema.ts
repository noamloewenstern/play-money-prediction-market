import { z } from 'zod';

export const MarketScalarFieldEnumSchema = z.enum(['id','question','description','resolutionCriteria','slug','closeDate','closedAt','resolvedAt','canceledAt','canceledById','createdBy','tags','ammAccountId','clearingAccountId','createdAt','updatedAt','commentCount','uniqueTradersCount','uniquePromotersCount','liquidityCount','parentListId']);

export default MarketScalarFieldEnumSchema;
