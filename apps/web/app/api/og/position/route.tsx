import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import Decimal from 'decimal.js'
import db from '@play-money/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const marketId = searchParams.get('marketId')
  const optionId = searchParams.get('optionId')
  const userId = searchParams.get('userId')

  if (!marketId || !optionId || !userId) {
    return new Response('Missing required params: marketId, optionId, userId', { status: 400 })
  }

  let market, option, user, position
  try {
    ;[market, option, user, position] = await Promise.all([
      db.market.findUnique({ where: { id: marketId } }),
      db.marketOption.findUnique({ where: { id: optionId } }),
      db.user.findUnique({ where: { id: userId } }),
      db.marketOptionPosition.findFirst({
        where: {
          marketId,
          optionId,
          account: { userPrimary: { id: userId } },
        },
      }),
    ])
  } catch {
    return new Response('Market, option, or user not found', { status: 404 })
  }

  if (!market || !option || !user) {
    return new Response('Market, option, or user not found', { status: 404 })
  }

  const currentProb = option.probability ?? 50
  const quantity = position ? new Decimal(position.quantity).toNumber() : 0
  const cost = position ? new Decimal(position.cost).toNumber() : 0
  const value = position ? new Decimal(position.value).toNumber() : 0
  const entryPrice = quantity > 0 ? cost / quantity : 0
  const entryProb = Math.round(entryPrice * 100)
  const pnl = value - cost
  const pnlPct = cost > 0 ? Math.round(((value - cost) / cost) * 100) : 0
  const isPositive = pnl >= 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', fontWeight: 600 }}>{user.displayName}</span>
              <span style={{ fontSize: '16px', color: '#a1a1aa' }}>@{user.username}</span>
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: '20px', color: '#a1a1aa', fontWeight: 600 }}>Play Money</div>
        </div>

        {/* Market question */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '40px',
            display: '-webkit-box',
            overflow: 'hidden',
            lineClamp: 2,
          }}
        >
          {market.question}
        </div>

        {/* Position details */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            padding: '32px',
            backgroundColor: '#18181b',
            borderRadius: '16px',
            border: '1px solid #27272a',
            flex: 1,
            alignItems: 'center',
          }}
        >
          {/* Option badge + prediction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '4px',
                  backgroundColor: option.color,
                }}
              />
              <span style={{ fontSize: '22px', fontWeight: 600, color: '#e4e4e7' }}>{option.name}</span>
            </div>
            <div style={{ fontSize: '16px', color: '#71717a', marginTop: '4px' }}>Position</div>
          </div>

          {/* Entry probability */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px', color: '#71717a' }}>Bought at</span>
            <span style={{ fontSize: '40px', fontWeight: 700 }}>{entryProb}%</span>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', fontSize: '32px', color: '#71717a' }}>&rarr;</div>

          {/* Current probability */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px', color: '#71717a' }}>Now at</span>
            <span style={{ fontSize: '40px', fontWeight: 700, color: option.color }}>{currentProb}%</span>
          </div>

          {/* P&L */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px', color: '#71717a' }}>P&L</span>
            <span
              style={{
                fontSize: '40px',
                fontWeight: 700,
                color: isPositive ? '#22c55e' : '#ef4444',
              }}
            >
              {isPositive ? '+' : ''}
              {pnlPct}%
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
