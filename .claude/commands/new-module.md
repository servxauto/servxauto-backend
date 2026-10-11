---
description: Scaffold a new feature module under src/modules
argument-hint: <module-name> [short description]
---

Scaffold a new module: $ARGUMENTS

Follow the `nest-module-conventions` skill. Steps:

1. Create `src/modules/<name>/` with module, controller, service, `dto/`, `entities/` and spec files.
2. Register the module in `src/app.module.ts`.
3. Add only what the description needs (don't invent endpoints or fields). If entity fields are unclear, ask first.
4. If an entity was added, generate the migration per the `typeorm-entities-migrations` skill.
5. Add service unit tests per the `testing` skill.
6. Run `/check` and report.
