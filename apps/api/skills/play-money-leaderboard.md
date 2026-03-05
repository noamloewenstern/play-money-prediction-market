---
name: play-money-leaderboard
description: Fetch and display the monthly leaderboard
---

# View Leaderboard

## When to Use
- "show me the leaderboard"
- "who are the top traders"
- "show rankings"
- "leaderboard for this month"
- "who's winning on play money"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Get Leaderboard
```
GET {PLAY_MONEY_BASE_URL}/api/v1/leaderboard
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | number | No | Current year | Year for the leaderboard |
| `month` | number | No | Current month | Month for the leaderboard (1-12) |

**Response:**
```json
{
  "data": {
    "topTraders": [{ "userId": "...", "displayName": "Alice", "username": "alice", "total": 5000, "rank": 1 }],
    "topCreators": [...],
    "topPromoters": [...],
    "topQuesters": [...],
    "topReferrers": [...],
    "userRankings": {
      "trader": { "rank": 15, "total": 1200, ... },
      "creator": null,
      ...
    }
  }
}
```

## Input Parameters
- **month** (optional): Month number (1-12). Defaults to current month.
- **year** (optional): Year. Defaults to current year.
- **category** (optional): If the user asks for a specific category (traders, creators, etc.), filter the display.

## Response Rendering

```
## Leaderboard — March 2026

### Top Traders
| Rank | User | Profit |
|------|------|--------|
| 🥇 1 | @alice (Alice) | ₮5,000.00 |
| 🥈 2 | @bob (Bob) | ₮3,200.00 |
| 🥉 3 | @carol (Carol) | ₮2,800.00 |
| 4 | @dave (Dave) | ₮1,500.00 |
| 5 | @eve (Eve) | ₮1,200.00 |

### Top Creators
| Rank | User | Score |
|------|------|-------|
| 🥇 1 | @frank (Frank) | ₮4,000.00 |
...
```

Show top 5 for each category. If the user has a ranking, highlight it:
```
**Your Rankings:**
- Trader: #15 (₮1,200.00)
- Quester: #8 (₮800.00)
```

If the user asks for a specific category only, show just that category's full listing.

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."

## Follow-up Suggestions
- "Want to see a previous month? Tell me which month and year."
- "Check your portfolio with `play-money-portfolio`."
- "Browse markets to improve your ranking with `play-money-browse-markets`."
