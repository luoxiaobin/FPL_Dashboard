# Weekly Planning Workspace — Target Architecture

## Dependency direction

```text
FPL upstream
  -> typed FPL gateway
  -> normalized, versioned snapshots
  -> projection engine
  -> legal optimizer
  -> Floor / Balanced / Upside scenario generator
  -> product-oriented Route Handlers
  -> This Week workspace
```

UI code does not fetch official FPL endpoints directly. Projection and optimization code does not depend on Next.js or Supabase clients. Persistence stores source snapshots and model versions so a generated plan can be reproduced.

## Server boundaries

- `src/server/fpl` — fixed-host upstream access, response contracts, normalization, caching and errors
- `src/server/snapshots` — coherent global and entry-specific source snapshots
- `src/server/projections` — deterministic player projections and uncertainty
- `src/server/optimizer` — FPL legality and constrained squad search
- `src/server/scenarios` — strategy-specific complete weekly plans
- `src/server/plans` — My Plan selection, deadline freezing and evaluation

## Snapshot rules

- Global and entry data assembled into a plan must identify one coherent source snapshot.
- Global reference data may have a longer TTL than entry picks or live data.
- Every payload exposes `capturedAt`, `freshUntil`, `isStale`, and `sourceVersion`.
- A failed refresh preserves the last valid snapshot and surfaces degradation.
- Historical evaluation uses immutable deadline snapshots.

## Identity

Team ID import establishes the dashboard's revocable manager session but is not FPL OAuth. The confirmed squad contract is stored against that session's entry ID and is available wherever the manager establishes the same dashboard session. My Plan, constraints, and preferences remain device-local.

## Migration

The legacy dashboard remains available while `planning_workspace_v1` is rolled out. New storage is additive. Legacy tables and routes are retired only after output comparison, traffic validation, and rollback testing.

## Current vertical-slice limitations

- The initial model is deterministic and transparent, but not yet statistically calibrated.
- Scenario generation supports constrained transfers, legal lineup selection, captaincy, and no-chip decisions. Chip opportunity modeling is deferred to the next optimizer increment.
- My Plan is device-local until verified application identity and server persistence are introduced.
- Production access remains disabled unless `PLANNING_WORKSPACE_V1=true`.
- Pre-deadline squad access depends on a manager-invoked bookmark because FPL offers no third-party OAuth; official public picks take over automatically after the deadline.
