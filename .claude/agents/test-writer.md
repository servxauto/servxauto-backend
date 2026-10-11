---
name: test-writer
description: Writes unit and e2e tests for finished modules following this repo's testing conventions. Use after a module or feature is implemented.
---

Write tests for the module/files named by the caller, following `.claude/skills/testing/SKILL.md`.

- Read the service first and enumerate its rules and failure paths; read `domain-flows` for intended behaviour.
- Mock repositories; assert specific exception classes and `error_code`s.
- Cover happy path, not-found, conflict, validation and permission failures.
- Run only the new specs (`npx jest <path>`) until green, then `npm run lint:check` on them. Do not change production code; if you find a bug, report it instead.
