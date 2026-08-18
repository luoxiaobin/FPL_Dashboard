# ADR 003: Authenticated squad import contract

Status: Accepted for Phase 1  
Date: 2026-08-18

## Context

Before a Gameweek deadline, FPL exposes a manager's current squad through the authenticated `my-team` endpoint but not through the public entry picks endpoint. FPL does not provide third-party OAuth. The Phase 0 Safari bookmarklet probe confirmed that a script deliberately invoked on the signed-in FPL page can read the authenticated response without exporting the FPL session.

## Decision

The browser boundary will normalize the official response into schema version 1 before returning to FPL Dashboard. The contract contains only:

- import source, entry ID, schema version, and capture time;
- 15 player element IDs, lineup positions, buy/sell prices, multipliers, and captaincy flags;
- active chip, bank, squad value, transfer allowance, transfers made, cost, and transfer status.

The validator requires exactly 15 unique players and 15 unique lineup positions, one captain, one vice captain, bounded integer values, an approved source, and exact field sets. Unexpected fields are rejected so credentials, tokens, personal details, and arbitrary upstream data cannot cross the boundary accidentally.

Prices remain in FPL's integer tenths representation at this boundary. Conversion to display units happens downstream.

## Consequences

- Phase 2 can produce a small, versioned payload without copying cookies or authentication tokens.
- Contract changes require a new schema version rather than silently changing meaning.
- Imported data is not persisted in Phase 1.
- Freshness, player metadata reconciliation, club/position rules, and scenario integration remain downstream concerns.

## Phase 4 integration

After explicit review, the encoded contract may be retained in `sessionStorage` for the current tab only. The authenticated planning endpoint parses the contract again, requires its entry ID to match the server session, rejects captures older than two hours, verifies all players against current bootstrap data, and enforces squad composition, club limits, and starting-formation rules. Only then may the imported picks replace the unavailable public picks response for scenario generation. Unlimited pre-season transfers are modeled without points hits. No durable storage is introduced by this phase.
