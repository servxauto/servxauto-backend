---
description: Run the same checks as CI (lint, typecheck, tests, build) and report
---

Run these in order, using the non-fixing lint script so results match CI:

1. `npm run lint:check`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`

Keep going after a failure so all problems are visible. Report a short pass/fail per step, and for failures the file, line and cause. Do not fix anything unless I ask.
