import Decimal from 'decimal.js'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { executeTransaction } from './executeTransaction'
import { getHouseAccount } from './getHouseAccount'

export async function adminAdjustBalance({
  userId,
  amount,
  adminId,
  reason,
}: {
  userId: string
  amount: number
  adminId: string
  reason: string
}) {
  const decimalAmount = new Decimal(amount).abs()

  if (decimalAmount.isZero()) {
    throw new Error('Amount must be non-zero')
  }

  const [userAccount, houseAccount] = await Promise.all([getUserPrimaryAccount({ userId }), getHouseAccount()])

  const isCredit = amount > 0

  const entries = [
    {
      amount: decimalAmount,
      assetType: 'CURRENCY' as const,
      assetId: 'PRIMARY',
      fromAccountId: isCredit ? houseAccount.id : userAccount.id,
      toAccountId: isCredit ? userAccount.id : houseAccount.id,
    },
  ]

  const transaction = await executeTransaction({
    type: 'HOUSE_GIFT',
    initiatorId: adminId,
    entries,
  })

  await createAuditLog({
    action: 'BALANCE_ADJUST',
    actorId: adminId,
    targetType: 'USER',
    targetId: userId,
    after: { amount, transactionId: transaction.id },
    metadata: { reason },
  })

  return transaction
}
