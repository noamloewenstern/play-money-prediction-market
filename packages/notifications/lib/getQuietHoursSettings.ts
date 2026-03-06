import db from '@play-money/database'

export type QuietHoursSettings = {
  quietHoursEnabled: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  doNotDisturb: boolean
  timezone: string
}

export async function getQuietHoursSettings({ userId }: { userId: string }): Promise<QuietHoursSettings> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
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
