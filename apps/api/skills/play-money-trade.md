---
name: play-money-trade
description: Buy or sell shares on a market option with pre-trade quotes
---

# Trade on a Prediction Market

## When to Use
- "buy shares on market X"
- "sell my position in market Y"
- "trade on the AI market"
- "bet 100 on YES"
- "I want to buy 50 on option A"
- "get a quote for buying YES on market X"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Step 1: Get Market Details (to find option IDs)
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}
```

### Step 2: Get a Quote
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/quote
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "optionId": "<market option CUID>",
  "amount": 100,
  "isBuy": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `optionId` | string | Yes | The CUID of the market option to trade |
| `amount` | number | Yes | Amount in ₮ to spend (buy) or shares to sell |
| `isBuy` | boolean | No | `true` for buy quote, `false` for sell quote. Defaults to buy |

**Response:**
```json
{
  "data": {
    "newProbability": 0.72,
    "potentialReturn": 142.50
  }
}
```

### Step 3: Execute Buy
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/buy
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "optionId": "<market option CUID>",
  "amount": 100
}
```

### Step 4 (Alternative): Execute Sell
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/sell
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "optionId": "<market option CUID>",
  "amount": 100
}
```

## Input Parameters
- **market** (required): Market ID or a search term to find the market. If the user provides a name, use `play-money-search` first to find the ID.
- **option** (required): Which option to trade (e.g., "YES", "NO", or an option name for multi-choice markets). Map to the `optionId` from the market details.
- **amount** (required): Amount in ₮ to spend or sell.
- **direction** (required): "buy" or "sell". Default to "buy" if the user says "bet" or "trade".

## Response Rendering

### Quote Display (before confirmation)
```
📊 Trade Quote
Market: Will AI pass the Turing test by 2030?
Option: YES
Amount: ₮100.00
Direction: BUY

Estimated return: ₮142.50 (42.5% profit)
New probability: 72% (was 65%)

⚠️ Confirm this trade? (yes/no)
```

**IMPORTANT: Always show the quote and ask for explicit confirmation before executing the trade.**

### Trade Confirmation (after execution)
```
Trade executed successfully!
Market: Will AI pass the Turing test by 2030?
Option: YES
Amount spent: ₮100.00
```

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **403**: "You don't have permission to trade on this market."
- **404**: "Market not found. Try searching with `play-money-search`."
- **400** with "insufficient balance": "Not enough funds. Check your balance with `play-money-check-balance`."
- **400** with "market already resolved": "This market has already been resolved and can no longer be traded."
- **400** with "market closed": "This market is closed for trading."

## Follow-up Suggestions
- "Want to view your updated portfolio? Use `play-money-portfolio`."
- "Check your remaining balance with `play-money-check-balance`."
- "Add liquidity to this market with `play-money-add-liquidity`."
