---
name: play-money-create-market
description: Interactively scaffold and submit a new prediction market
---

# Create a Prediction Market

## When to Use
- "create a new market"
- "make a prediction market about X"
- "I want to create a market"
- "set up a new prediction question"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

### Step 1: Generate Tags (optional)
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets/generate-tags
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "Will AI pass the Turing test by 2030?"
}
```

**Response:**
```json
{
  "data": ["ai", "technology", "turing-test"]
}
```

### Step 2: Create Market
```
POST {PLAY_MONEY_BASE_URL}/api/v1/markets
```

**Headers:**
```
x-api-key: {PLAY_MONEY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "Will AI pass the Turing test by 2030?",
  "description": "Resolves YES if a publicly demonstrated AI system...",
  "closeDate": "2030-12-31T23:59:59.000Z",
  "tags": ["ai", "technology"],
  "options": [
    { "name": "Yes", "color": "#4CAF50" },
    { "name": "No", "color": "#F44336" }
  ],
  "type": "binary"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | The prediction market question |
| `description` | string | No | Detailed description and resolution criteria |
| `closeDate` | string | No | ISO 8601 date when the market closes for trading |
| `tags` | Array<string> | No | Tags for categorization |
| `options` | Array<{name, color}> | Yes | Market options. Binary: Yes/No. Multi: custom options |
| `type` | string | Yes | `binary`, `multi`, or `list` |
| `contributionPolicy` | string | No | For lists only: `OWNERS_ONLY` or `PUBLIC` |

## Input Parameters

Guide the user through these fields interactively:

1. **Question** (required): The prediction question. Should be clear, specific, and resolvable.
2. **Type** (required): Ask if it's a Yes/No question (`binary`) or has multiple options (`multi`).
3. **Options** (required for multi): If multi-choice, ask for the option names.
4. **Close Date** (optional): When should trading end? Suggest a reasonable date based on the question.
5. **Description** (optional): Resolution criteria. Help the user write clear criteria.
6. **Tags** (optional): Use the generate-tags endpoint to suggest tags, let user confirm or modify.

## Response Rendering

### Preview (before confirmation)
```
📋 New Market Preview

Question: Will AI pass the Turing test by 2030?
Type: Binary (Yes/No)
Close Date: Dec 31, 2030
Tags: ai, technology
Description: Resolves YES if a publicly demonstrated AI system...

Options:
  - Yes (green)
  - No (red)

⚠️ Create this market? (yes/no)
```

**IMPORTANT: Always show a preview and ask for explicit confirmation before creating the market.**

### After Creation
```
Market created successfully!
Question: Will AI pass the Turing test by 2030?
Market ID: {id}
URL: {PLAY_MONEY_BASE_URL}/questions/{slug}
```

## Error Handling
- **401**: "API key is invalid or expired. Run `npx play-money@latest install-claude-skills` to reconfigure."
- **400**: "Invalid market data. Check that all required fields are provided and valid."
- **500**: "Failed to create market. Try again in a moment."

## Follow-up Suggestions
- "Want to add liquidity to your new market? Use `play-money-add-liquidity`."
- "Share your market link with others to get trading started!"
- "Create another market? Just tell me your next prediction question."
