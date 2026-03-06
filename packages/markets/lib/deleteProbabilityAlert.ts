import db from '@play-money/database'

export async function deleteProbabilityAlert({ alertId, userId }: { alertId: string; userId: string }) {
  const alert = await db.probabilityAlert.findFirst({
    where: { id: alertId, userId },
  })

  if (!alert) {
    throw new Error('Alert not found or you do not have permission to delete it')
  }

  return db.probabilityAlert.delete({ where: { id: alertId } })
}
