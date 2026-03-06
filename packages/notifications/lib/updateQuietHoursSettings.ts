import db from '@play-money/database'
import { QuietHoursSettings } from './getQuietHoursSettings'

export async function updateQuietHoursSettings({
  userId,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  doNotDisturb,
}: {
  userId: string
  quietHoursEnabled?: boolean
  quietHoursStart?: number | null
  quietHoursEnd?: number | null
  doNotDisturb?: boolean
}): Promise<QuietHoursSettings> {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(quietHoursEnabled !== undefined ? { quietHoursEnabled } : {}),
      ...(quietHoursStart !== undefined ? { quietHoursStart } : {}),
      ...(quietHoursEnd !== undefined ? { quietHoursEnd } : {}),
      ...(doNotDisturb !== undefined ? { doNotDisturb } : {}),
    },
    select: {
      quietHoursEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      doNotDisturb: true,
      timezone: true,
    },
  })

  return user
}
