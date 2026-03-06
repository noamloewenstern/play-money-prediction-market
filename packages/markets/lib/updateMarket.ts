import db, { Market } from '@play-money/database'
import { slugifyTitle } from './helpers'

export async function updateMarket({
  id,
  question,
  description,
  resolutionCriteria,
  closeDate,
  tags,
  createdBy,
  visibility,
}: {
  id: string
  question?: string
  description?: string
  resolutionCriteria?: string | null
  closeDate?: Date
  tags?: Array<string>
  createdBy?: string
  visibility?: 'PUBLIC' | 'PRIVATE'
}) {
  const updatedData: Partial<Market> = {}

  if (question) {
    updatedData.question = question
    updatedData.slug = slugifyTitle(question)
  }

  if (description) {
    updatedData.description = description
  }

  if (resolutionCriteria !== undefined) {
    updatedData.resolutionCriteria = resolutionCriteria
  }

  if (closeDate) {
    updatedData.closeDate = closeDate
  }

  if (tags) {
    updatedData.tags = tags.map((tag) => slugifyTitle(tag))
  }

  if (createdBy) {
    updatedData.createdBy = createdBy
  }

  if (visibility) {
    updatedData.visibility = visibility
  }

  const updatedMarket = await db.market.update({
    where: { id },
    data: { ...updatedData, updatedAt: new Date() },
  })

  return updatedMarket
}
