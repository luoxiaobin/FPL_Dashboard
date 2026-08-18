# Testing documentation

Start with [Agentic Playwright Testing Handbook](./PLAYWRIGHT_HANDBOOK.md). It is the current operating guide for why the browser suite exists, how it is designed, how to run it, and how to extend it safely.

Use [Testing and Documentation Governance](./TESTING_GOVERNANCE.md) for the ongoing process: change triggers, definition of done, pull-request review, bug regression, feature retirement, and quarterly/seasonal maintenance.

Supporting records:

- [FPL test strategy](./fpl-test-strategy.md) — original repository discovery, risk model, and initial scope. Historical foundation; some inventory counts describe the pilot starting point.
- [Agentic Playwright pilot evaluation](./agentic-playwright-pilot-evaluation.md) — evidence and adoption decision from the Planner → Generator → Healer experiment.
- [Live integration pilot](./live-integration-pilot.md) — bounded production browser contract and failure classification.
- [Local FPL authentication setup](./fpl-playwright-auth-setup.md) — handling the ignored local FPL browser state safely.
- [Browser-mediated FPL integration ADR](../redesign/adr/004-browser-mediated-fpl-integration.md) — why the bookmarklet is used and why official-account writes are out of scope.
- [Initial smoke plan](../../specs/initial-smoke-plan.md) — first approved public-entry slice.

Current automated baseline (2026-08-18):

- 30 Vitest files, 138 tests;
- 20 deterministic Playwright project executions: 19 passing and one intentional desktop skip for a mobile-only scenario;
- one opt-in deployed-dashboard live test;
- one opt-in local authenticated-FPL bookmarklet transport test;
- hourly non-destructive production smoke monitoring.
