# ADR 002: Season-aware, reproducible snapshots

Status: accepted

FPL identifiers are external identifiers scoped to a season, not globally stable primary keys. New planning data therefore references a mandatory season and an immutable source snapshot. Generated scenarios store their model version, constraints, inputs, and output.

Legacy tables remain unchanged during migration. The additive schema prevents the 2026–27 transition from overwriting historical identities and enables later projection evaluation using only information available at generation time.

