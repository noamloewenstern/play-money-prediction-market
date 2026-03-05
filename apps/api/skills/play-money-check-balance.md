---
name: play-money-check-balance
description: Show current currency balance and daily quest status
---

# Check Balance

## When to Use
- "what's my balance"
- "how much money do I have"
- "check my funds"
- "show my balance"
- "how many tokens do I have"
- "what are my daily quests"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Get Balance
```
GET {PLAY_MONEY_BASE_URL}/api/v1/users/me/balance
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Response:**
```json
{
  "data": {
    "balance": 1250.00
  }
}
```

### Get Stats (includes quests)
```
GET {PLAY_MONEY_BASE_URL}/api/v1/users/{userId}/stats
```

First get the user ID from `GET /api/v1/users/me`, then use it here.

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Response:**
```json
{
  "data": {
    "netWorth": 2500.00,
    "tradingVolume": 15000.00,
    "totalMarkets": 5,
    "lastTradeAt": "2026-03-05T14:30:00Z",
    "activeDayCount": 12,
    "otherIncome": 500.00,
    "quests": [
      {
        "title": "Make a trade",
        "award": 50,
        "href": "/questions",
        "completed": true
      },
      {
        "title": "Create a market",
        "award": 100,
        "href": "/create",
        "completed": false
      }
    ]
  }
}
```

## Input Parameters
None required. This skill uses the authenticated user's data automatically.

## Response Rendering

```
## Your Balance

**Cash:** ₮1,250.00
**Net Worth:** ₮2,500.00
**Trading Volume:** ₮15,000.00

### Daily Quests
- [x] Make a trade — ₮50 reward
- [ ] Create a market — ₮100 reward

**Stats:**
- Markets created: 5
- Active days: 12
- Last trade: Mar 5, 2026
```

Format all currency with `₮` and 2 decimal places. Show quests with checkmarks for completed ones.

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."

## Follow-up Suggestions
- If balance > 0: "You have ₮X available. Want to browse markets to trade?"
- If uncompleted quests: "Complete your daily quests to earn more ₮!"
- "View your full portfolio with `play-money-portfolio`."
