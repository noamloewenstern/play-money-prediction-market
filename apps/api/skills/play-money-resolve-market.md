---
name: play-money-resolve-market
description: Resolve or cancel a market with a supporting link
---

# Resolve a Market

## When to Use
- "resolve market X"
- "close market X as YES"
- "cancel market X"
- "resolve my prediction market"
- "mark market as resolved"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`
- User must be the market creator or an admin

## API Calls

### Step 1: Get Market Details
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

Use this to display the market question and list available options with their IDs.

### Step 2a: Resolve Market
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/resolve
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "optionId": "<winning option CUID>",
  "supportingLink": "https://example.com/evidence"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `optionId` | string | Yes | The CUID of the winning option |
| `supportingLink` | string | No | URL with evidence supporting the resolution |

### Step 2b: Cancel Market (alternative)
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/cancel
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

## Input Parameters
- **market** (required): Market ID or search term. If search term, use `play-money-search` to find it.
- **winning option** (required for resolve): Which option won (e.g., "YES", "NO", or an option name).
- **supporting link** (optional): Evidence URL for the resolution.

## Response Rendering

### Preview (before confirmation)
```
⚖️ Market Resolution Preview

Market: Will AI pass the Turing test by 2030?
Winning Option: YES
Supporting Link: https://example.com/evidence

This action is IRREVERSIBLE. All positions will be settled.

⚠️ Confirm resolution? (yes/no)
```

**IMPORTANT: Always show a preview and ask for explicit confirmation. Resolution is irreversible.**

### After Resolution
```
Market resolved successfully!
Market: Will AI pass the Turing test by 2030?
Winner: YES
All positions have been settled.
```

### For Cancellation
```
Market cancelled successfully!
Market: Will AI pass the Turing test by 2030?
All funds have been returned to traders.
```

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **403**: "You don't have permission to resolve this market. Only the market creator or admins can resolve."
- **404**: "Market not found. Try searching with `play-money-search`."
- **400** with "already resolved": "This market has already been resolved."

## Follow-up Suggestions
- "Check the leaderboard to see updated rankings with `play-money-leaderboard`."
- "View your portfolio to see settled positions with `play-money-portfolio`."
