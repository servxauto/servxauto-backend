---
description: Implement a feature end to end, following the product flow (plan, schema, code, tests, checks)
argument-hint: <feature description>
---

Implement this feature: $ARGUMENTS

1. **Flow first**: read the `domain-flows` skill. If the feature touches a flow, state, role or rule that is missing or unclear there, ask me before coding. Don't guess business rules.
2. **Plan**: delegate to the `feature-planner` agent, or plan inline for small changes. Show the plan (endpoints, entities, states, error codes, permissions) and wait for my approval when it adds or changes schema or public API.
3. **Schema**: entities plus a migration (`typeorm-entities-migrations` skill).
4. **Code**: module, DTOs, service, controller (`nest-module-conventions` skill). Add domain error codes/messages to the constants files.
5. **Tests**: `testing` skill, covering the flow's happy path and each failure rule.
6. **Verify**: run `/check`. Then summarize what changed, and update the `domain-flows` skill if the feature established new flow facts I confirmed.
