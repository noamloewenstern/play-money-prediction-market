import db from '@play-money/database'

export async function isInQuietHours({ userId }: { userId: string }): Promise<boolean> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      doNotDisturb: true,
      quietHoursEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      timezone: true,
    },
  })

  if (user.doNotDisturb) {
    return true
  }

  if (!user.quietHoursEnabled || user.quietHoursStart == null || user.quietHoursEnd == null) {
    return false
  }

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: user.timezone,
    hour: 'numeric',
    hour12: false,
  })
  const currentHour = parseInt(formatter.format(now), 10)

  const start = user.quietHoursStart
  const end = user.quietHoursEnd

  if (start <= end) {
    return currentHour >= start && currentHour < end
  }

  // Wraps midnight (e.g., 22 to 8)
  return currentHour >= start || currentHour < end
}
