import { redirect } from 'next/navigation'
import { auth } from '@play-money/auth'
import { SettingsTradeConfirmationForm } from '@play-money/markets/components/SettingsTradeConfirmationForm'

export default async function TradingSettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/settings/trading')
  }

  return (
    <div>
      <SettingsTradeConfirmationForm />
    </div>
  )
}
