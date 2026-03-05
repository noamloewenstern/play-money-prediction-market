---
name: play-money-search
description: Full-text search across markets, users, and lists with current odds
---

# Search Play Money

## When to Use
- "search for markets about climate"
- "find prediction markets on elections"
- "search play money for AI"
- "look up user john"
- "find markets related to crypto"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Search
```
GET {PLAY_MONEY_BASE_URL}/api/v1/search
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Free-text search term |

## Input Parameters
- **query** (required): The search term from the user's request. Extract the key topic or phrase.

## Response Rendering

The response returns `{ data: { users, markets, lists } }` — three arrays.

### Markets Section
If markets are found, display:
```
### Markets (X results)
| # | Market | Probability | Status |
|---|--------|-------------|--------|
| 1 | Will GPT-5 launch in 2026? | YES 65% | Active |
```

### Users Section
If users are found, display:
```
### Users (X results)
| # | Username | Display Name |
|---|----------|--------------|
| 1 | @johndoe | John Doe |
```

### Lists Section
If lists are found, display:
```
### Lists (X results)
| # | Title | Markets |
|---|-------|---------|
| 1 | AI Predictions 2026 | 12 markets |
```

If no results found in any category, say: "No results found for '{query}'. Try different keywords or browse all markets."

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."

## Follow-up Suggestions
- If markets found: "Want to trade on any of these? Tell me the market number."
- If users found: "Want to see a user's portfolio or positions?"
- General: "Browse all active markets with `play-money-browse-markets`."
