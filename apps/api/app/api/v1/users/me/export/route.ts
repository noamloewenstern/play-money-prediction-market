import { NextResponse } from 'next/server'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import {
  exportUserTransactions,
  exportUserPositions,
  exportUserMarkets,
  toCsv,
} from '@play-money/finance/lib/exportUserData'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const GET = createRouteHandler({
  auth: true,
  rateLimit: 'read',
  handler: async (req, { userId }) => {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const { type, format } = schema.get.parameters.parse(params)

    let data: Array<Record<string, unknown>>

    switch (type) {
      case 'transactions':
        data = await exportUserTransactions({ userId })
        break
      case 'positions':
        data = await exportUserPositions({ userId })
        break
      case 'markets':
        data = await exportUserMarkets({ userId })
        break
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="play-money-${type}-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    const csv = toCsv(data)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="play-money-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  },
})
