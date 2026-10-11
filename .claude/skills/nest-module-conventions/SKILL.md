---
name: nest-module-conventions
description: Conventions for creating or changing NestJS feature modules in this repo (controller/service/DTO/entity layout, errors, validation, pagination, imports). Use whenever adding or editing anything under src/modules.
---

# Module conventions

## Layout
`src/modules/<domain>/` containing `<domain>.module.ts`, `<domain>.controller.ts`, `<domain>.service.ts`, `dto/`, `entities/<name>.entity.ts`, and `*.spec.ts` beside the file under test. Register the module in `AppModule` imports.

## Layers
- **Controller**: routing, DTO binding, `@Param('id', UuidParamPipe)`, `@CurrentUser()`. No business logic, no repository access.
- **Service**: business rules and repository access (`@InjectRepository`). Throws exceptions from `@/core/exceptions/app-http.exception`.
- Entities are discovered by the `**/*.entity{.ts,.js}` glob; no manual registration beyond `TypeOrmModule.forFeature([...])` in the module.

## Errors
- Never throw raw `HttpException`/`Error` for expected failures. Use `RecordNotFoundException`, `RecordConflictException`, `InvalidRequestException`, `AppForbiddenException`, etc.
- Domain-specific codes go in the `// domain specific error codes` section of `src/common/constants/error-codes.constant.ts`, with messages in `error-messages.constant.ts`.
- Pass the underlying error as `cause` when wrapping (e.g. unique-violation `23505` from Postgres becomes `RecordConflictException`).

## DTOs and validation
- class-validator decorators on every field. The global `AppValidationPipe` rejects unknown properties (`forbidNonWhitelisted`), so every accepted field needs a decorator.
- Request/response fields are `snake_case` (matches `status_code`, `sort_by`, `total_pages`).
- List endpoints: extend `PaginationQueryDto` / `SortingQueryDto`, validate `sort_by` with `@IsIn([...])`, return via `paginate()` or `paginateQuery()` from `@/common/utils/pagination.util` (returns `PaginatedResult`).

## Imports
`@/...` for anything outside the current folder, `./` for same-folder files.

## Done means
`/check` passes (lint:check, typecheck, test, build). Schema changes ship with a migration (see the `typeorm-entities-migrations` skill).
