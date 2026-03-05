---
name: play-money-portfolio
description: View open positions grouped by market with unrealized P&L
---

# View Portfolio

## When to Use
- "show my portfolio"
- "what positions do I have"
- "show my open trades"
- "what am I holding"
- "show my investments"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Step 1: Get Current User
```
GET {PLAY_MONEY_BASE_URL}/api/v1/users/me
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

### Step 2: Get User Positions
```
GET {PLAY_MONEY_BASE_URL}/api/v1/users/{userId}/positions
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | `active` | Filter: `active`, `closed`, `all` |
| `limit` | number | No | 50 | Results per page (1-100) |
| `cursor` | string | No | — | Pagination cursor |

### Step 3: Get User Balance
```
GET {PLAY_MONEY_BASE_URL}/api/v1/users/me/balance
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

## Input Parameters
- **status** (optional): Default to `active` (open positions). User can ask for `closed` or `all`.
- **user** (optional): Defaults to authenticated user (`me`). Can view another user's positions by ID.

## Response Rendering

```
## Your Portfolio

**Cash Balance:** ₮1,250.00

### Open Positions (X total)
| Market | Option | Quantity | Value | P&L |
|--------|--------|----------|-------|-----|
| Will AI pass Turing test? | YES | 50 shares | ₮72.00 | +₮22.00 |
| Bitcoin to $200k? | NO | 30 shares | ₮45.00 | -₮5.00 |

**Total Position Value:** ₮117.00
**Net P&L:** +₮17.00
```

For each position:
- Show the market question
- Show the option name (YES/NO or custom option name)
- Show quantity of shares held
- Show current estimated value (quantity * current probability)
- Calculate P&L where possible from available data
- Format all currency with `₮` and 2 decimal places

If no positions found: "You don't have any open positions. Browse markets to find trading opportunities."

Pagination: If `pageInfo.hasNextPage` is true, say "Showing X of Y positions. Say 'show more' to see the rest."

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **404**: "User not found."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."

## Follow-up Suggestions
- "Want to sell any of these positions? Tell me which one."
- "Browse markets for new trading opportunities with `play-money-browse-markets`."
- "Check the leaderboard to see how you rank with `play-money-leaderboard`."
