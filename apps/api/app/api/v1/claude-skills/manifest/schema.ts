import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const SkillManifestEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  downloadUrl: z.string(),
})

export default {
  get: {
    summary: 'Get the Claude Code skills manifest',
    responses: {
      200: z.object({ data: z.array(SkillManifestEntrySchema) }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
