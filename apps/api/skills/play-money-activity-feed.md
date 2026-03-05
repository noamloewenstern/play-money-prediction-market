---
name: play-money-activity-feed
description: Stream recent site-wide or per-market activity and summarize trends
---

# Activity Feed

## When to Use
- "show recent activity"
- "what's happening on play money"
- "show activity for market X"
- "recent trades"
- "what's trending"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Site-Wide Activity
```
GET {PLAY_MONEY_BASE_URL}/api/v1/activity
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

### Per-Market Activity
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}/activity
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

## Input Parameters
- **market** (optional): If the user asks about a specific market, use the per-market endpoint. If search term, use `play-money-search` first.
- **scope** (optional): "site" for site-wide (default), or provide a market ID for market-specific activity.

## Response Rendering

The response returns `{ data: Array<MarketActivity> }`. Each activity item describes a trade, comment, liquidity event, or market action.

### Site-Wide Activity
```
## Recent Activity

| Time | User | Action | Market |
|------|------|--------|--------|
| 2 min ago | @alice | Bought YES ₮100 | Will AI pass Turing test? |
| 5 min ago | @bob | Sold NO ₮50 | Bitcoin to $200k? |
| 10 min ago | @carol | Added ₮500 liquidity | US Election 2028 |
| 15 min ago | @dave | Created market | Will Mars colony exist by 2035? |
```

### Per-Market Activity
```
## Activity: Will AI pass the Turing test by 2030?

| Time | User | Action | Amount |
|------|------|--------|--------|
| 2 min ago | @alice | Bought YES | ₮100.00 |
| 1 hour ago | @bob | Sold YES | ₮50.00 |
| 3 hours ago | @carol | Added liquidity | ₮500.00 |
```

After displaying activity, summarize trends:
- "Most active market in the last hour: [market name]"
- "Trending direction: YES probability increased from X% to Y%"
- Show at most 10 recent activities, summarize the rest

Format timestamps as relative time (e.g., "2 min ago", "1 hour ago"). Format all currency with `₮` and 2 decimal places.

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **404**: "Market not found. Try searching with `play-money-search`."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."

## Follow-up Suggestions
- "Want to trade on any active market? Use `play-money-trade`."
- "Browse all open markets with `play-money-browse-markets`."
- "Check the leaderboard with `play-money-leaderboard`."
