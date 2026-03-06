import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import db from '@play-money/database'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const marketId = searchParams.get('marketId')

  if (!marketId) {
    return new Response('Missing required param: marketId', { status: 400 })
  }

  let market
  try {
    market = await db.market.findUnique({
      where: { id: marketId },
      include: {
        options: { orderBy: { probability: 'desc' } },
        user: { select: { displayName: true, username: true } },
        marketResolution: { include: { resolution: true } },
      },
    })
  } catch {
    return new Response('Market not found', { status: 404 })
  }

  if (!market) {
    return new Response('Market not found', { status: 404 })
  }

  const isResolved = !!market.resolvedAt
  const isCanceled = !!market.canceledAt
  const options = market.options.slice(0, 5) // Show max 5 options

  const statusLabel = isResolved ? 'Resolved' : isCanceled ? 'Canceled' : null
  const statusColor = isResolved ? '#22c55e' : '#ef4444'

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
          padding: '56px 64px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '36px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#7c3aed',
              }}
            />
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.02em' }}>
              Play Money
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusLabel && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: statusColor,
                  backgroundColor: `${statusColor}22`,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${statusColor}44`,
                }}
              >
                {statusLabel}
              </span>
            )}
            <span style={{ fontSize: '14px', color: '#52525b' }}>play.money</span>
          </div>
        </div>

        {/* Market question */}
        <div
          style={{
            fontSize: options.length <= 2 ? '40px' : '34px',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '40px',
            color: '#fafafa',
            display: '-webkit-box',
            overflow: 'hidden',
            lineClamp: 3,
            flex: '0 0 auto',
          }}
        >
          {market.question}
        </div>

        {/* Probability bars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {options.map((option) => {
            const prob = option.probability ?? Math.round(100 / options.length)
            const barColor = option.color || '#7c3aed'
            const isWinner =
              isResolved && market.marketResolution?.resolution?.id === option.id

            return (
              <div
                key={option.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {/* Label row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        backgroundColor: barColor,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: isWinner ? 700 : 500,
                        color: isWinner ? '#fafafa' : '#d4d4d8',
                      }}
                    >
                      {option.name}
                      {isWinner ? ' ✓' : ''}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: isWinner ? '#22c55e' : '#fafafa',
                      minWidth: '48px',
                      textAlign: 'right',
                    }}
                  >
                    {prob}%
                  </span>
                </div>

                {/* Bar */}
                <div
                  style={{
                    display: 'flex',
                    height: '12px',
                    backgroundColor: '#27272a',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${prob}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '6px',
                      opacity: isResolved ? (isWinner ? 1 : 0.4) : 0.85,
                    }}
                  />
                </div>
              </div>
            )
          })}

          {market.options.length > 5 && (
            <span style={{ fontSize: '14px', color: '#71717a' }}>
              +{market.options.length - 5} more options
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #27272a',
          }}
        >
          <span style={{ fontSize: '13px', color: '#52525b' }}>
            By {market.user.displayName}
          </span>
          <span style={{ fontSize: '13px', color: '#52525b' }}>
            {market.options.length} option{market.options.length !== 1 ? 's' : ''}
            {market.uniqueTradersCount ? ` · ${market.uniqueTradersCount} trader${market.uniqueTradersCount !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
