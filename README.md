# servxauto-backend

Backend API for ServXAuto, built with [NestJS](https://nestjs.com), TypeORM and PostgreSQL.

## Requirements

- Node.js 22 (see `.nvmrc`)
- PostgreSQL

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your database credentials
npm run migration:run
npm run start:dev
```

The API is served at `http://localhost:3000/v1` (the unversioned health check is at `http://localhost:3000/health`).

All environment variables are listed in `.env.example`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` / `npm run start:prod` | Build and run the compiled app |
| `npm run lint` / `npm run lint:check` | Lint with auto-fix / lint only (CI) |
| `npm run typecheck` | Type-check without emitting |
| `npm test` / `npm run test:e2e` | Unit / end-to-end tests |

## Database migrations

Schema changes go through migrations (`synchronize` is disabled).

```bash
npm run migration:generate -- src/database/migrations/<Name>   # diff entities against the DB
npm run migration:create -- src/database/migrations/<Name>     # empty migration
npm run migration:run
npm run migration:revert
npm run migration:show
```

In production (compiled code): `npm run migration:run:prod`.

## Project structure

```
src/
  modules/      feature modules (one folder per domain: controller, service, dto/, entities/)
  config/       database and rate-limit configuration
  database/     TypeORM CLI data source and migrations
  core/         app-wide infrastructure: filters, pipes, decorators, exceptions
  common/       shared constants, DTOs, types and helper functions
```

Imports use the `@/` alias for anything outside the current folder (`@/common/...`) and `./` for files in the same folder.

## Error format

Every error response has the same shape:

```json
{ "status_code": 404, "message": "Record not found", "error_code": "RECORD_NOT_FOUND" }
```

Throw the exceptions in `src/core/exceptions/app-http.exception.ts` (e.g. `RecordNotFoundException`) from services; codes live in `src/common/constants/error-codes.constant.ts`.

## Docker

```bash
docker build -t servxauto-backend .
docker run --env-file .env -p 3000:3000 servxauto-backend
```
