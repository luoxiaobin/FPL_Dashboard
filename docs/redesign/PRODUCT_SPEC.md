# Weekly Planning Workspace — V1 Product Specification

## Product promise

Help serious FPL managers make higher-expected-value weekly decisions without requiring mini-league or rival data.

## Primary workflow

For the next five Gameweeks, generate three complete and legal plans:

- **Floor** — prioritizes minutes security, availability, consistency, and fewer hits.
- **Balanced** — maximizes five-Gameweek expected points under the base model.
- **Upside** — accepts greater outcome and minutes variance for a higher ceiling.

Every plan includes transfers, transfer cost, starting XI, bench order, captain, vice-captain, chip choice, projected points, remaining bank, uncertainty, and its principal tradeoff. The product does not choose a winner; the manager may select and edit one as **My Plan**.

## Manager constraints

V1 supports:

1. locked players who cannot be sold
2. excluded incoming players
3. maximum points hit
4. minimum bank reserve

Squad legality, chip availability, free transfers, budget, selling prices, and formations are derived from the source snapshot.

## Information architecture

- **This Week** — deadline, squad health, constraints, scenario comparison, selected-plan detail and evidence
- **Squad** — list-first squad planning with an optional pitch view
- **Players** — projection evidence and comparison
- **Fixtures** — five-Gameweek schedule context
- **History** — chosen-plan and projection evaluation

## V1 boundary

Included: Team ID import, season-aware squad, versioned projections, three scenarios, four constraints, comparison, evidence, My Plan snapshot, responsive layout, freshness and confidence.

Deferred: rival optimization, live-rank projection, a full live command centre, external projection providers, editable model weights, price prediction, sharing, and automatic FPL actions.

## Success measures

- weekly scenario-generation completion
- scenario inspection and My Plan selection
- consecutive-Gameweek return rate
- projection calibration by position and horizon
- legal-plan generation rate
- workspace latency and snapshot freshness
- self-reported decision confidence

Overall-rank movement is a long-term outcome measure, not a release gate.

## Release gates

- no illegal scenario in invariant and captured-payload testing
- deterministic outputs for the same snapshot and model version
- explicit stale and upstream-error states
- full mobile planning workflow
- legacy-dashboard rollback through a feature flag

