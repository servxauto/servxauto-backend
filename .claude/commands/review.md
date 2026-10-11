---
description: Review the current changes against this repo's conventions
---

Review the uncommitted changes (`git diff` plus untracked files) against the `nest-module-conventions` and `typeorm-entities-migrations` skills. Check specifically:

- Expected failures use `AppHttpException` subclasses with proper codes (no raw `Error`/`HttpException`).
- DTOs are fully decorated (unknown props are rejected globally), snake_case fields, list endpoints paginated.
- No business logic in controllers; no repository use outside services.
- Entity changes come with a migration that has a working `down()`.
- `@/` alias usage, tests present for new service logic.
- Behaviour matches the `domain-flows` skill where relevant.

Report findings by severity with file:line. Don't edit files unless I ask.
