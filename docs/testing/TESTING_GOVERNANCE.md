# Testing and Documentation Governance

Status: Active
Owner: Repository maintainers
Review cadence: Continuous with changes; quarterly health review; seasonal review before GW1

## Purpose

FPL Dashboard is expected to change. New planning ideas will be explored, usability will evolve, upstream FPL behavior will shift, bugs will reveal missing assumptions, and some features will be simplified or removed.

Tests and documentation are part of the product contract. They must evolve in the same pull request as the behavior they describe. This process is intentionally lightweight: update the smallest authoritative document and the smallest correct test layer while the context is still fresh.

## Sources of truth

When sources disagree, use this order:

1. accepted product behavior in the current code and approved product specification;
2. current automated contracts and API schemas;
3. active architecture and testing handbooks;
4. ADRs, which explain why a decision was made;
5. historical discovery, plans, and pilot evaluations.

Historical documents are evidence, not current operating instructions. Mark them historical rather than continuously rewriting the original record. ADRs are not edited to reverse a decision; add a new ADR that supersedes the old one.

## Document lifecycle

Every document belongs to one of four classes:

| Class | Examples | Maintenance rule |
|---|---|---|
| Active guide | Playwright handbook, auth setup, launch runbook | Update in the same change as behavior or operations |
| Product/architecture contract | Product spec, target/as-built architecture | Update when scope, user journey, data flow, persistence, or boundary changes |
| Decision record | ADRs | Preserve; add a superseding ADR when the decision changes |
| Historical record | Discovery strategy, initial plans, pilot evaluation | Preserve facts; add a dated resolution note or link to the active guide |

Active guides should include `Status` and `Last reviewed` metadata where practical. A materially changed guide receives a new review date. Do not change dates for spelling-only edits.

## Change triggers

Use this matrix during planning and review:

| Change | Required test action | Required documentation action |
|---|---|---|
| New user-facing feature | Identify P0–P3 risk; add unit/API coverage and one browser outcome only when the journey is critical | Update product spec/current architecture and handbook coverage; add ADR if a durable boundary or tradeoff is introduced |
| Usability or layout change | Keep outcome assertions; update semantic locators only if accessibility language intentionally changed; add responsive coverage for material mobile behavior | Update active user-flow/design guidance when instructions or navigation changed |
| Bug fix | Reproduce with the smallest failing regression test before or alongside the fix | Record the corrected contract in an active guide/spec if the prior behavior or assumption was ambiguous |
| Feature experiment | Put behind an explicit flag or bounded route; prefer reversible tests | Document hypothesis, success/exit criteria, and whether data or schema changes are temporary |
| Feature removed or trimmed | Delete tests that protect removed behavior; retain tests for shared contracts; verify navigation and API cleanup | Remove it from active guides/specs, mark migration/compatibility effects, and preserve the reason in changelog/ADR when significant |
| API or persistence change | Add contract, authorization, validation, migration, and failure-path coverage | Update as-built architecture, API/data contract, migration/runbook, and security implications |
| Official FPL lifecycle/data change | Classify as `DATA_CHANGE` before editing; add deterministic fixtures for the new shape and a bounded live assertion if stable | Update live-integration expectations and note season/lifecycle assumptions |
| Authentication/security change | Add positive and negative authorization tests; verify secret/artifact guards | Update auth setup, architecture boundary, threat implications, and operational recovery steps |
| CI/deployment change | Test workflow syntax/commands and preserve artifacts/guards | Update handbook commands, monitoring ownership, and launch/runbook steps |

## Definition of done

A change is complete when all applicable statements are true:

- The user outcome and risk level are understood.
- The smallest correct test layer protects the behavior.
- A bug fix includes a regression test unless the reason is recorded in the PR.
- Removed behavior no longer has misleading tests or active documentation.
- Controlled tests do not depend on volatile live football values.
- Live checks remain bounded and do not silently broaden production writes.
- Authentication cookies, tokens, and local browser state are not tracked or uploaded.
- Active documentation describes the resulting behavior, not the implementation plan that preceded it.
- Focused checks and the proportionate full regression gate pass.
- The PR checklist states which documents changed or why no documentation change was needed.

## Pull-request process

### 1. Before implementation

Write one sentence for the intended user outcome and assign a risk level. Decide whether the change is a contract change or an implementation-only change. For a new critical journey, add or update a plan under `specs/` before generating broad browser coverage.

### 2. During implementation

Keep code, regression tests, fixtures, and active documentation in the same branch. Prefer test data that demonstrates relationships. Do not postpone documentation until after details have been forgotten.

### 3. Before review

Complete `.github/pull_request_template.md`. Review the diff specifically for stale names, removed routes, feature-flag behavior, privacy boundaries, and counts/status statements. Run focused tests first, then the required gates.

### 4. During review

The reviewer verifies both directions:

- every changed product contract is reflected in tests/docs;
- every changed test/doc describes behavior that still exists.

Reviewers should challenge assertion weakening, unexplained snapshot/count changes, live-data hard-coding, new production writes, and documentation that merely repeats code.

### 5. After deployment

Run the non-destructive production smoke test. For changes to login, official FPL integration, lifecycle handling, or confirmed-squad planning, run the gated live test when its bounded write is acceptable. Record production-only findings as bugs with evidence and classification.

## Bug workflow

1. Capture the user-visible impact and evidence.
2. Classify the failure using the Playwright handbook taxonomy.
3. Reproduce it at the lowest reliable layer.
4. Add a regression test that fails for the right reason.
5. Fix the product without weakening the expected outcome.
6. Update the active contract/document if the bug exposed an undocumented rule.
7. Run focused, full deterministic, and appropriate production checks.

If reproduction requires volatile live state, preserve the observed shape as a small deterministic fixture and keep only stable relationships in the live assertion.

## Feature retirement workflow

Removing code without removing its promises creates documentation debt; deleting every related test can remove shared safeguards. For a retired feature:

1. identify routes, components, flags, persistence, jobs, tests, and docs;
2. decide which underlying contracts remain shared;
3. remove feature-specific tests and retain/refactor shared protections;
4. update navigation, product spec, active architecture, handbook inventory, smoke checks, and runbooks;
5. document data migration or rollback implications;
6. add a superseding ADR when reversing a significant architectural decision.

## Scheduled health reviews

### Quarterly

- Compare active docs with routes, workflows, scripts, and test inventory.
- Remove redundant or low-value browser scenarios.
- Review skipped tests, flaky history, healing events, and artifact usefulness.
- Verify commands, URLs, feature flags, owners, and secret names.
- Review open P0/P1 risks and decide whether coverage still matches product usage.

### Before each season / GW1

- Verify official FPL endpoints and response shapes used by the app/bookmarklet.
- Refresh deterministic fixtures only when the contract changed.
- Exercise upcoming-GW, active-GW, provisional, and official lifecycle paths.
- Re-authenticate the ignored local Playwright state if needed.
- Run production smoke, gated live login, and review-only bookmarklet transport.
- Confirm deadline/expiry assumptions and public-picks handoff behavior.

### After major releases

- Confirm the deployed release identity and health contract.
- Run critical deterministic browser journeys against the release candidate or deployment.
- Update `Last reviewed` metadata and the testing baseline only when the released suite materially changed.

## Keeping inventory accurate

Avoid scattering exact test counts across active documents. The testing index may contain one dated baseline; command output and CI are the live source of truth. When the suite materially changes, update that single baseline and the handbook's coverage list in the same PR.

Feature lists should describe user outcomes, not filenames. Filenames belong in operational examples only and should be verified when moved.

## Ownership and exceptions

The author of a behavior change owns the corresponding test and documentation updates. The reviewer owns verification that the updates are sufficient. Repository maintainers own quarterly/seasonal reviews and resolution of conflicting documents.

An exception is allowed when testing or documentation is disproportionate or blocked, but the PR must state:

- what is omitted;
- why;
- the risk created;
- the follow-up owner or issue;
- the temporary evidence used instead.

“No docs needed” is valid for implementation-only refactors whose user behavior, contracts, operations, and architecture do not change—but it must be an explicit reviewed decision.
