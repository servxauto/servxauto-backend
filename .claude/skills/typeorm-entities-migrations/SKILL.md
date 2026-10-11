---
name: typeorm-entities-migrations
description: How to define TypeORM entities and write/review migrations in this repo (synchronize is off). Use when adding or changing entities, columns, relations, indexes or migrations.
---

# Entities and migrations

- `synchronize` is **false**. Every entity change needs a migration in `src/database/migrations/`.
- Workflow: edit entity, then `npm run migration:generate -- src/database/migrations/<PascalName>`, then **read the generated SQL** (remove unrelated drift), then `npm run migration:run`. Use `migration:create` for data migrations or hand-written SQL.
- Seed data goes in `src/database/seeders/` (loaded as migrations, so it runs once and in order).
- Entity files: `*.entity.ts` inside the module's `entities/` folder. Use `snake_case` column names to match the API's snake_case fields.
- Every migration must have a working `down()`. Adding NOT NULL columns to populated tables needs a default or a backfill step.
- Index foreign keys and columns used in `where` / sort. Sortable columns exposed via `sort_by` should be indexed on large tables.
- Never edit a migration that has already been merged; add a new one.
- Runtime and CLI DB configs are separate (`src/config/typeorm.config.ts` and `src/database/data-source.ts`); keep entity/migration globs identical in both.
