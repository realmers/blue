# Blå Lund Recruitment App

IV1201 project

## Description

Blå Lund Recruitment App is a school project in the course "Arkitektur och design av globala applikationer" at KTH.
The system distinguishes between two types of users: applicants and recruiters. An applicant applies for a position within the company while a recruiter manages applications. The system covers two main areas: the registration of job applications and the administration of applications.

The project is built on the T3 Stack and deployed on Vercel with a PostgreSQL database hosted on Supabase.

## How to run

### Prerequisites

- [Node.js](https://nodejs.org) (v24 or later)
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (or a local PostgreSQL instance)

### Steps

1. Clone the repository
2. Run `pnpm install` — installs all dependencies and generates the Prisma client
3. Copy `.env.example` to `.env` and fill in the required environment variables (see below)
4. Run `pnpm run db:migrate` to apply database migrations
5. Run `pnpm run dev` to start the development server
6. The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment variables

| Variable             | Description                                              |
|----------------------|----------------------------------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string from Supabase               |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth session signing               |
| `NODE_ENV`           | `development`, `test`, or `production`                   |
| `LOG_LEVEL`          | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |

## Other useful commands

| Command                  | Description                                    |
|--------------------------|------------------------------------------------|
| `pnpm run db:studio`     | Open Prisma Studio to inspect the database     |
| `pnpm run db:generate`   | Generate a new Prisma migration                |
| `pnpm run db:push`       | Push schema changes directly to the database   |
| `pnpm test`              | Run unit tests with Vitest (watch mode)        |
| `pnpm run test:run`      | Run tests once                                 |
| `pnpm run test:coverage` | Run tests with coverage report                 |
| `pnpm run build`         | Build the application for production           |
| `pnpm run check`         | Run ESLint and TypeScript type checking        |

## Deployment

The application is deployed on [Vercel](https://vercel.com). Push to the main branch to trigger a production deployment. Make sure all environment variables are configured in the Vercel project settings.

## Development

### Front-end to Back-end stack

This is a [T3 Stack](https://create.t3.gg) project. If you are not familiar with the technologies used, please refer to the respective docs.

- [Next.js](https://nextjs.org)
- [tRPC](https://trpc.io)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Better Auth](https://better-auth.com)
- [Zod](https://zod.dev)

### Data layer

Uses a PostgreSQL database hosted on [Supabase](https://supabase.com).

Relevant resources:

- [Use Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Supabase connection strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### Local database (Docker)

A `docker-compose.yml` is included for running a local PostgreSQL instance during development:

```bash
docker compose up -d
```

This starts a PostgreSQL container on port `5433`. Set `DATABASE_URL` to:

```
postgresql://postgres:test@localhost:5433/blue
```
