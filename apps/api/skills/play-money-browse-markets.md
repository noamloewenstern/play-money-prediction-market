---
name: play-money-browse-markets
description: List, filter, and explore prediction markets with current probabilities
---

# Browse Prediction Markets

## When to Use
- "show me prediction markets"
- "what markets are trending"
- "list open markets about AI"
- "browse markets tagged with politics"
- "show me active prediction markets"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### List Markets
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | `active` | Filter: `active`, `halted`, `closed`, `resolved`, `canceled`, `all` |
| `createdBy` | string | No | — | Filter by creator user ID |
| `tags` | string | No | — | Comma-separated tag list (e.g., `ai,technology`) |
| `limit` | number | No | 50 | Results per page (1-100) |
| `cursor` | string | No | — | Pagination cursor from previous response's `pageInfo.endCursor` |
| `sortField` | string | No | — | Field to sort by |
| `sortDirection` | string | No | `desc` | `asc` or `desc` |

### Get Single Market
```
GET {PLAY_MONEY_BASE_URL}/api/v1/markets/{id}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `extended` | boolean | No | Include additional market details |

## Input Parameters
- **topic/tags** (optional): If the user mentions a topic, use the `tags` parameter with relevant tag names
- **status** (optional): Default to `active` unless the user asks for closed/resolved markets
- **count** (optional): Map to `limit`, default to 10 for display

## Response Rendering

Display markets as a formatted table:

```
| # | Market | Probability | Volume | Closes |
|---|--------|-------------|--------|--------|
| 1 | Will AI pass the Turing test by 2030? | YES 72% | ₮12,450.00 | Mar 15, 2026 |
| 2 | Will Bitcoin reach $200k? | YES 34% | ₮8,200.50 | Dec 31, 2026 |
```

For each market:
- Show the `question` field as the market name
- Calculate probability from market options: each option has a `probability` field (0-1), display as percentage
- Show volume formatted with `₮` symbol and 2 decimal places
- Show `closeDate` in human-readable format (e.g., "Mar 15, 2026")
- If the market has multiple options (non-binary), list option names with their probabilities

After the table, show pagination info:
- "Showing X of Y total markets"
- If `pageInfo.hasNextPage` is true, suggest: "Say 'show more' to see the next page"

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **500**: "The Play Money API is experiencing issues. Try again in a moment."
- Empty results: "No markets found matching your criteria. Try broadening your search or removing filters."

## Follow-up Suggestions
After displaying markets, suggest 1-2 of these:
- "Want to trade on any of these markets? Tell me the number."
- "Search for markets on a specific topic with `play-money-search`."
- "Check your current balance before trading."
