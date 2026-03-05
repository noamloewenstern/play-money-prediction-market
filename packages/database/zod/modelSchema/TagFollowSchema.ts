import { z } from 'zod';

/////////////////////////////////////////
// TAG FOLLOW SCHEMA
/////////////////////////////////////////

export const TagFollowSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  tag: z.string(),
  createdAt: z.coerce.date(),
})

export type TagFollow = z.infer<typeof TagFollowSchema>

export default TagFollowSchema;
