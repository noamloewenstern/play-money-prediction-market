# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Play Money is a prediction market platform. Turborepo monorepo with Next.js 14 (App Router), PostgreSQL/Prisma, SWR, and shadcn/ui. npm workspaces, no path aliases — cross-package imports use `@play-money/*` package names.

## Commands

```bash
npm run dev              # Start all dev servers (web:3000, api:3001, storybook:6006, db-studio:5555)
npm run build            # Build all apps
npm run lint             # ESLint across monorepo
npm run format           # Prettier check
npm run format:fix       # Prettier fix
npm run type-check       # TypeScript checking
npm run test             # Run all Jest tests
npm run test:watch       # Jest watch mode
npx jest path/to/file.test.ts  # Run a single test file

# Database (PostgreSQL + Prisma)
npm run db:generate      # Generate Prisma client & Zod types (MUST run after schema changes)
npm run db:push          # Sync schema changes to DB
npm run db:reset         # Reset & reseed database
npm run db:script -- <name>  # Run one-off script from packages/database/scripts/
```

All root scripts use `dotenv-cli` to load `.env` automatically.

## Architecture

```
apps/
  web/          # Next.js frontend (port 3000) — App Router, SSR + client components
  api/          # Next.js API server (port 3001) — REST routes under /api/v1/
  storybook/    # Component library (port 6006)

packages/
  database/     # Prisma schema, migrations, seed, Zod types, mock factories
  ui/           # shadcn/ui + custom components (only package with a CSS build step)
  config/       # Shared ESLint, Prettier, Jest, TypeScript, Tailwind configs
  auth/         # NextAuth v5 + Prisma adapter + getAuthUser()
  api-helpers/  # Zod schemas, apiHandler client, SWR hooks, pagination
  finance/      # AMM math, executeTransaction, Decimal.js (leaf package)
  markets/      # Prediction markets core logic
  users/        # User profiles & context
  comments/     # Comments + TipTap editor
  notifications/ lists/ referrals/ quests/ search/ transparency/
```

**Packages have no JS build step** — raw `.ts` files consumed directly by app bundlers via workspace symlinks. Only `apps/*` and `packages/ui` CSS actually build.

**Dependency chain** (deepest path): `apps/*` → `markets` → `finance` + `notifications` + `quests` → `database` → (Prisma). `db:generate` must complete before anything builds.

**Feature package pattern**: Each package has `lib/` (server logic, one function per file), `components/`, `context/`, `types.ts`. No index.ts barrel — consumers import sub-paths directly: `@play-money/users/lib/getUserById`.

## Gotchas and Non-Obvious Patterns

- **Prisma `omit` strips `email`/`emailVerified` globally** from User queries. You won't see these fields unless you explicitly `select` them.
- **Custom ESLint rule `enforce-protection-of-sensitive-fields`** blocks returning `email` in `NextResponse.json()`. This is intentional — PII protection.
- **Use `type` not `interface`** — ESLint enforces `consistent-type-definitions: type`.
- **Use `Array<T>` not `T[]`** — ESLint enforces `array-type: generic`.
- **`apiHandler` is isomorphic** — on server reads `next/headers` cookies; on client uses `credentials: 'include'`. Located in `packages/api-helpers/client/index.ts`.
- **SWR invalidation uses exported path constants** — call `mutate(MY_BALANCE_PATH)`, not arbitrary strings. Constants in `packages/api-helpers/client/hooks.ts`.
- **SSR cache invalidation uses `revalidateTag()`** in inline Server Actions within page files.
- **Auth is per-route, not middleware** — each protected route calls `getAuthUser(req)` manually at the top. Returns `userId` or `null`.
- **Auth supports API keys** — `getAuthUser` checks `x-api-key` header as fallback after session.
- **No pre-commit hooks** — CI is the only gate. Run `format`, `lint`, `type-check` locally before pushing.
- **Custom Jest matchers** — `toBeCloseToDecimal()` available in all tests for Decimal.js comparisons.
- **Domain error classes** per package (e.g., `UserNotFoundError`, `MarketNotFoundError`) — catch these in route handlers and map to HTTP status codes.

## API Patterns

**Route structure**: `apps/api/app/api/v1/<resource>/route.ts` + co-located `schema.ts`.

**Response shapes**:
```ts
// Success
NextResponse.json({ data: market })
NextResponse.json({ data: items, pageInfo: { hasNextPage, endCursor, total } })
// Error
NextResponse.json({ error: 'message' }, { status: 4xx/5xx })
```

**Validation**: Every route has a `schema.ts` exporting Zod schemas per method. Route handlers call `schema.get.parameters.parse(params)` for query params, `schema.post.requestBody.parse(body)` for bodies. Return type is `SchemaResponse<typeof schema.get.responses>`.

**Auth pattern in routes**:
```ts
const userId = await getAuthUser(req)
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

## Frontend Patterns

**Data fetching**: SWR hooks in `packages/api-helpers/client/hooks.ts` (e.g., `useMarketBalance`, `useNotifications`). `SWRProvider` prepends `NEXT_PUBLIC_API_URL` and sets `credentials: 'include'`.

**Mutations**: Call `apiHandler` functions directly (`createMarket`, `updateMe`), then `mutate()` SWR path constants to invalidate.

**State**: No global state library. React Context per domain (`UserContext`, `SidebarContext`), SWR for server state.

**Components**: PascalCase files. Page components suffixed `Page`, forms suffixed `Form`, dialogs suffixed `Dialog`.

**Forms**: Always React Hook Form + `zodResolver` + shadcn `<Form>` components. Form persistence via `usePersistForm` hook from `@play-money/ui`.

## Code Style

- Prettier: single quotes, no semicolons, trailing commas (es5), print width 120
- Import sorting: third-party → `@play-money/*` → local (via `@trivago/prettier-plugin-sort-imports`)
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- ESLint extends `@vercel/style-guide` + `eslint-config-turbo`

## Testing Patterns

- Jest + ts-jest, test environment: node
- Tests colocated: `<filename>.test.ts` next to source
- **DB mock**: Global setup via `jest-mock-extended` — every test gets a deep-mocked Prisma client. Reset before each test via `mockReset(dbMock)`.
- **Mock factories**: `@play-money/database/mocks` provides `mockUser()`, `mockMarket()`, `mockAccount()`, `mockBalance()` etc. with faker data + optional overrides.
- **Function mocking**: `jest.mock('./getMarketAmmAccount')` then `jest.mocked(fn).mockResolvedValue(...)`.

## CI Checks (what runs on PRs)

1. `npm run format` — Prettier
2. `npm run lint` — ESLint
3. `npm run type-check` — TypeScript
4. `npm run test` — Jest
5. `npm run build` — Full build
6. Chromatic — Visual regression on Storybook stories

## References

- @.env.example — All environment variables
- @packages/database/schema.prisma — Full data model
- @packages/config/ — All shared configs (ESLint, Prettier, Jest, TypeScript, Tailwind)
