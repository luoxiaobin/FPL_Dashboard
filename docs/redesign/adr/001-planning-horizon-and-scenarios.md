# ADR 001: Five-Gameweek, scenario-based planning

Status: accepted

The product optimizes expected FPL performance over a rolling five-Gameweek horizon. It presents complete Floor, Balanced, and Upside plans without naming a default recommendation. Ownership is explanatory context, not an optimization objective. No-chip is the baseline; a chip appears only when its incremental value exceeds a versioned threshold.

This avoids one-week transfer churn while keeping uncertainty tractable. Complete plans prevent contradictory independent transfer, captaincy, lineup, and chip recommendations.

