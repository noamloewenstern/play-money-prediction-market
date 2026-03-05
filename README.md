# Play Money [Temp]

**Play Money** is a prediction market platform. This codebase is structured as a monorepo using Turborepo, containing multiple standalone apps and shared feature packages.

[Join the discord!](https://discord.gg/Q5CeSMFeBP)

## Project Structure

- **apps**: Standalone apps, such as `web`, `backend`, etc.
- **packages**: Shared libraries split by feature, colocating backend and frontend logic together.

## Getting Started

### Option A: Docker (recommended)

The fastest way to get running. Requires only [Docker](https://docs.docker.com/get-docker/).

```bash
git clone https://github.com/casesandberg/play-money.git
cd play-money
./scripts/docker-start.sh
```

This builds and starts everything — PostgreSQL, schema migration, web app, and API server. On first run it creates a `.env` from `.env.example` with working defaults.

| Service  | URL                                        |
| -------- | ------------------------------------------ |
| Web app  | [localhost:3000](http://localhost:3000)     |
| API      | [localhost:3001](http://localhost:3001)     |

**Common Docker commands:**

```bash
docker compose logs -f          # Stream all logs
docker compose logs -f web      # Stream web logs only
docker compose restart          # Restart services
docker compose down             # Stop everything
docker compose down -v          # Stop and wipe the database
```

**Seeding sample data:**

```bash
docker compose run --rm db-setup sh -c \
  'npx dotenv -e /dev/null -- npx tsx packages/database/seed.ts'
```

**Architecture:**

```
docker compose up
  └─ postgres        (healthcheck)
       └─ db-setup   (prisma db push, then exits)
            ├─ web   (Next.js, port 3000)
            └─ api   (Next.js, port 3001)
```

The multi-stage `Dockerfile` produces slim production images (~150 MB each) using Next.js standalone output. `NEXT_PUBLIC_*` vars are baked at build time; runtime vars (DB, auth) are injected via `docker-compose.yml`.

### Option B: Local Node.js

#### Prerequisites

- Node.js >= 18
- npm
- PostgreSQL 16

#### Quick setup

```bash
git clone https://github.com/casesandberg/play-money.git
cd play-money
./scripts/setup-local.sh
```

The script creates `.env`, starts Postgres via Docker, pushes the schema, and seeds the database.

#### Manual setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Set up postgres database**:

   - Follow the [Installation instructions](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database).
   - Set a password during installation and accept default settings for other options.
   - Open a terminal and run:
     ```bash
     psql -U postgres
     ```
   - Enter the password you set during installation.
   - Create a new database for local development:
     ```sql
     CREATE DATABASE playmoney;
     ```

3. **Set up environment variables**:

   - Create a `.env` file based on the `.env.example` file provided.
   - (Reach out to @casesandberg to get the shared dev env if you wish)

4. **Start development servers**:
   ```bash
   npm run dev
   ```
   - This will start all necessary servers:
     - **Web app**: [localhost:3000](http://localhost:3000)
     - **Backend server**: [localhost:3001](http://localhost:3001)
     - **Database viewer**: [localhost:5555](http://localhost:5555)
     - **Storybook**: [localhost:6006](http://localhost:6006)

## Code Formatting and Linting

- **Eslint** and **Prettier** are used to enforce consistent code style.
- Before merging a pull request, please format your code:
  ```bash
  npm run format
  ```
- Alternatively, use a code editor that formats on file save.

## Contribution Guidelines

- Make sure your code adheres to the style guidelines.
- Feel free to reach out to maintainers for questions or clarifications.
