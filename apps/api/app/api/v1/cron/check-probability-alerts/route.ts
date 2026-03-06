import { NextResponse } from 'next/server'
import { checkProbabilityAlerts } from '@play-money/markets/lib/checkProbabilityAlerts'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkProbabilityAlerts()

    return NextResponse.json({ data: result })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
