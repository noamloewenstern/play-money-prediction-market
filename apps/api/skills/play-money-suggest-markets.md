---
name: play-money-suggest-markets
description: Propose well-formed prediction market questions for a given topic
---

# Suggest Prediction Markets

## When to Use
- "suggest markets about AI"
- "what prediction markets should I create about climate change"
- "propose some markets based on recent news"
- "give me market ideas about technology"
- "suggest prediction questions about the 2028 election"

## Prerequisites
- `PLAY_MONEY_API_KEY` environment variable must be set (needed to create markets after suggestions)
- `PLAY_MONEY_BASE_URL` environment variable (defaults to https://play.money)
- If either is missing, instruct the user to run: `npx play-money@latest install-claude-skills --api-key <key> --base-url https://play.money`

## API Calls

This skill does NOT make API calls for generating suggestions. It uses Claude's reasoning to propose markets, then formats them ready for submission via `play-money-create-market`.

The output format follows the `POST /api/v1/markets` request body schema:
```json
{
  "question": "string (required)",
  "description": "string (resolution criteria)",
  "closeDate": "ISO 8601 string",
  "tags": ["string"],
  "options": [{ "name": "string", "color": "string" }],
  "type": "binary | multi"
}
```

## Input Parameters
- **topic** (required): The topic or news event to generate prediction market questions about.
- **count** (optional): Number of markets to suggest (default: 3-5).

## Response Rendering

For each suggested market, display:

```
## Suggested Markets: [Topic]

### 1. Will [specific event] happen by [date]?
- **Type:** Binary (Yes/No)
- **Close Date:** Dec 31, 2026
- **Tags:** tag1, tag2
- **Resolution Criteria:** Resolves YES if [specific, measurable condition]. Source: [suggested verification method].

### 2. Which [category] will [achieve something] first?
- **Type:** Multi-choice
- **Options:** Option A, Option B, Option C
- **Close Date:** Jun 30, 2027
- **Tags:** tag1, tag2
- **Resolution Criteria:** Resolves to whichever option [specific condition] first, as reported by [source].

---

Want to create any of these? Tell me the number and I'll set it up with `play-money-create-market`.
```

### Market Quality Guidelines
When generating suggestions, ensure each market:
1. Has a **specific, falsifiable question** — not vague or subjective
2. Has a **clear close date** that makes sense for the question
3. Has **detailed resolution criteria** — what exactly triggers YES/NO
4. Has **relevant tags** for discoverability
5. Is **interesting and tradeable** — there should be genuine uncertainty
6. Avoids **duplicate existing markets** — if the user has searched first, consider what already exists

## Error Handling
No API calls, so no API errors. If the topic is too vague:
- "Could you be more specific? For example, instead of 'technology', try 'AI language models in 2026' or 'Apple product launches'."

## Follow-up Suggestions
- "Want to create any of these markets? Tell me the number."
- "Search existing markets first to avoid duplicates with `play-money-search`."
- "Refine the topic for more targeted suggestions."
