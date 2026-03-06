import { redirect } from 'next/navigation'
import React from 'react'
import { auth } from '@play-money/auth'
import { SettingsExportPage } from '@play-money/finance/components/SettingsExportPage'

export default async function AppSettingsExportPage() {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/settings/export')
  }

  return <SettingsExportPage />
}
