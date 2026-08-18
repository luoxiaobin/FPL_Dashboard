# ADR 004: Browser-mediated FPL integration

Status: Accepted
Date: 2026-08-18

## Context

The Planning product needs the manager's current, editable squad before the Gameweek deadline. Public FPL endpoints expose finalized historical Gameweek picks, not the signed-in manager's current Pick Team state. FPL provides neither documented third-party OAuth nor a supported delegated application API.

Copying FPL credentials, cookies, tokens, or session state into FPL Dashboard would create an excessive security and operational burden. Waiting for the public picks endpoint would remove the product's highest-value planning window.

## Decision

Adopt a user-invoked bookmarklet as a browser-mediated, read-only connector. It executes on the authenticated FPL origin, obtains only the minimum current-team data, normalizes it into the strict squad-import contract, and transports that contract to the dashboard for local review and explicit confirmation.

Credentials and authentication material never cross the FPL origin. The dashboard does not impersonate the manager, automate login, or retain FPL session access.

Official public picks supersede the confirmed import automatically after release. The bookmarklet is therefore a time-bounded bridge across a specific upstream product gap.

## Consequences

Positive:

- pre-deadline Planning uses the manager's real squad and economic state;
- no FPL password or reusable session secret is entrusted to the dashboard;
- the manager initiates every capture and reviews the normalized result;
- upstream changes are isolated behind a versioned contract and validation boundary;
- the same pattern can support richer user-invoked, pre-deadline reads.

Costs and risks:

- installation and invocation are less convenient than OAuth;
- bookmark behavior and authenticated endpoints are undocumented and may change;
- freshness depends on the manager invoking Refresh squad;
- the integration must remain minimal and carefully monitored against FPL terms and behavior.

## Write boundary

This decision does not authorize writes to the official FPL account. Transfers, picks, captaincy, bench order, and chip activation remain recommendations for the manager to apply in the official UI.

A future write capability requires a new ADR, explicit legal/terms review, a separately tested contract, same-origin preview and confirmation, read-before-write and read-after-write verification, and stronger safeguards for irreversible points hits and chips. Unattended or scheduled actions are prohibited by the product architecture.
