---
name: testing
description: Testing patterns for this NestJS repo (unit specs with @nestjs/testing, e2e with supertest). Use when writing or fixing tests.
---

# Testing

- Unit specs: `src/**/*.spec.ts`, colocated, run with `npm test` (single: `npx jest src/path/x.spec.ts`). Jest maps `@/` to `src/`.
- Build the unit under test with `Test.createTestingModule`, mocking repositories via `{ provide: getRepositoryToken(Entity), useValue: { findOne: jest.fn(), ... } }`. Do not hit a real database in unit tests.
- Test services for business rules and error paths: assert the specific exception class (e.g. `RecordNotFoundException`) and its `error_code`, not just that something threw.
- Controllers get thin tests only (delegation, param handling).
- e2e: `test/*.e2e-spec.ts`, config `test/jest-e2e.json`, run with `npm run test:e2e`. Remember the global prefix/versioning/pipe/filters are set in `main.ts`, not `AppModule`, so e2e setup must apply them (`setGlobalPrefix('api')`, versioning, `AppValidationPipe`, filters) to match production responses.
- Always cover: happy path, not-found, conflict/duplicate, validation failure, and permission failure where applicable.
