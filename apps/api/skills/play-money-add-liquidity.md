---
name: play-money-add-liquidity
description: Deposit liquidity into a market
---

# Add Liquidity to a Market

## When to Use
- "add liquidity to market X"
- "deposit funds into market X"
- "provide liquidity for market X"
- "fund market X"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Step 1: Get Market Details
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

### Step 2: Add Liquidity
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/liquidity
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount in ₮ to deposit as liquidity |

## Input Parameters
- **market** (required): Market ID or search term. If search term, use `play-money-search` to find it.
- **amount** (required): Amount of ₮ to deposit.

## Response Rendering

### Preview (before confirmation)
```
💧 Liquidity Deposit Preview

Market: Will AI pass the Turing test by 2030?
Amount: ₮500.00

Adding liquidity reduces price impact for traders in this market.

⚠️ Confirm deposit? (yes/no)
```

**IMPORTANT: Always show a preview and ask for explicit confirmation before depositing liquidity.**

### After Deposit
```
Liquidity added successfully!
Market: Will AI pass the Turing test by 2030?
Amount deposited: ₮500.00
```

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **404**: "Market not found. Try searching with `play-money-search`."
- **400** with "insufficient balance": "Not enough funds. Check your balance with `play-money-check-balance`."
- **400**: "Invalid deposit amount."

## Follow-up Suggestions
- "Check your updated balance with `play-money-check-balance`."
- "Trade on this market with `play-money-trade`."
- "Browse more markets with `play-money-browse-markets`."
