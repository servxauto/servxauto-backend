# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NestJS 11 + TypeORM + PostgreSQL API (Node >= 22). See `README.md` for setup; env vars are listed in `.env.example`. Served at `http://localhost:3000/api/v1`.

## Commands

- `npm run start:dev` — watch mode
- `npm run build` / `npm run start:prod`
- `npm run lint` (auto-fixes) / `npm run lint:check` (CI, no fix) / `npm run typecheck`
- `npm test` — unit tests (Jest, `src/**/*.spec.ts`); single test: `npx jest src/path/file.spec.ts` or `npx jest -t "name"`
- `npm run test:e2e` — e2e tests in `test/` (own config `test/jest-e2e.json`)
- Migrations (`synchronize` is off; schema changes must go through migrations):
  - `npm run migration:generate -- src/database/migrations/<Name>` (diffs entities against the DB)
  - `npm run migration:create -- src/database/migrations/<Name>` (empty)
  - `npm run migration:run` / `migration:revert` / `migration:show`
  - `npm run migration:run:prod` runs against compiled `dist/`

## Architecture

- **Bootstrap (`src/main.ts`)**: global prefix `api` + URI versioning (default `v1`), helmet, `AppValidationPipe`, and the exception filters `AllExceptionsFilter` then `HttpExceptionFilter`. `TRUST_PROXY` controls Express `trust proxy` (matters for throttler IP detection). CORS is currently commented out.
- **`src/app.module.ts`**: global `ConfigModule`, async TypeORM and Throttler config from `src/config/`, and `ThrottlerGuard` registered globally via `APP_GUARD`.
- **Feature code** goes in `src/modules/<domain>/` (controller, service, `dto/`, `entities/`) — the folder does not exist yet. Entities are auto-discovered by the glob `**/*.entity{.ts,.js}`; migrations are loaded from `src/database/migrations` and `src/database/seeders` (seeders run as migrations).
- **Two DB configs must stay in sync**: `src/config/typeorm.config.ts` (runtime, via `ConfigService`) and `src/database/data-source.ts` (TypeORM CLI, via `dotenv`/`process.env`).
- **Unified error format**: every error responds `{ status_code, message, error_code }`. Throw the exceptions from `src/core/exceptions/app-http.exception.ts` (e.g. `RecordNotFoundException`) in services, with codes/messages from `src/common/constants/error-codes.constant.ts` and `error-messages.constant.ts`. Pass the original error as `cause` (logged, never sent to the client). Non-HTTP exceptions become a generic 500.
- **Validation**: `AppValidationPipe` uses `whitelist` + `forbidNonWhitelisted` + `transform` + `stopAtFirstError`, and reports "Missing fields: …" or "Invalid fields: …" as an `InvalidRequestException`. Unknown DTO properties are rejected with 400.
- **Shared helpers**: `src/common/` holds pagination/sorting DTOs, types and utils; `src/core/` holds app-wide infrastructure (filters, pipes, decorators like `CurrentUser`).

## Project knowledge

`.claude/knowledge/` holds the product briefs and task specs. Read the relevant file before designing or implementing a feature, and do not claim requirements from a file you have not read.

- `.claude/knowledge/workshop-onboarding-auth.md` — Workshop App (partner) backend brief: phone + OTP login, account-state routing, 6-step onboarding, submission, admin review outcomes, resubmission.
- `.claude/knowledge/user-auth.md` — task spec for the authentication and onboarding APIs (endpoints, persistence, migrations, validation, tests, API docs).

## Conventions

- Use the `@/` alias (maps to `src/`, also in Jest) for imports outside the current folder and `./` for same-folder files.
