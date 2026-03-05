import { z } from 'zod'

const schema = {
  post: {
    requestBody: z.object({
      email: z.string().email(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      timezone: z.string().optional(),
    }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      400: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      409: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
  },
}

export default schema
