import { redirect } from 'next/navigation'
import { auth } from '@play-money/auth'
import { SettingsPushNotificationsForm } from '@play-money/notifications/components/SettingsPushNotificationsForm'
import { SettingsQuietHoursForm } from '@play-money/notifications/components/SettingsQuietHoursForm'

export default async function NotificationSettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/settings/notifications')
  }

  return (
    <div className="space-y-10">
      <SettingsPushNotificationsForm />
      <SettingsQuietHoursForm />
    </div>
  )
}
