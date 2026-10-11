---
description: Generate and review a TypeORM migration for the current entity changes
argument-hint: <MigrationName>
---

Create the migration "$ARGUMENTS" following the `typeorm-entities-migrations` skill.

1. `npm run migration:generate -- src/database/migrations/$ARGUMENTS` (needs the DB from `.env` to be reachable; if it isn't, say so and stop).
2. Read the generated file: remove unrelated drift, confirm `down()` reverses `up()`, flag risky operations (NOT NULL on populated tables, drops, type changes).
3. Delegate to the `db-migration-reviewer` agent if the change is non-trivial.
4. Do NOT run `migration:run` unless I ask.
