# FPL Dashboard user guide

Updated: 2026-11-19

## 1. What FPL Dashboard does

FPL Dashboard helps you decide what to do before an FPL deadline and understand the outcome afterward. It can:

- load your public FPL history, live points, rank, fixtures, and leagues
- compare Floor, Balanced, and Upside plans over the next five Gameweeks
- recommend transfers, a starting XI, captain, vice captain, and bench order
- estimate Bench Boost and Triple Captain opportunities
- save one scenario as My Plan
- compare a new squad sync with the saved plan
- explain a saved plan using AI
- show curated, source-linked team news
- replay a recorded recommendation after a Gameweek is finalized

FPL Dashboard is a decision-support tool. It does not make changes to your official FPL account.

## 2. Sign in

Enter your numeric FPL Team ID on the sign-in page.

Your Team ID is the number in an official FPL URL such as:

```text
https://fantasy.premierleague.com/entry/1234567/event/10
```

In that example, the Team ID is `1234567`.

The dashboard can read public information for that entry. Private pre-deadline changes require a squad sync from your signed-in FPL Pick Team page.

## 3. Main dashboard

The home page summarizes your current public FPL position. Depending on the Gameweek lifecycle, it can show:

- overall rank and percentile
- current or latest official Gameweek score
- bank and team value
- transfers recorded by FPL
- live points and provisional or official status
- fixtures, history, leagues, rank projection, and transfer analysis
- This Week's Move from the same planning model used on the Planning page
- the latest available Planning backtest

### Published squad versus confirmed squad

The recommendation card identifies its squad source:

- **Published squad** means the dashboard is using the latest team FPL has made public. It may not include private changes made for the upcoming deadline.
- **Confirmed pre-deadline squad** means the dashboard is using a squad synchronized from your signed-in FPL Pick Team page.

If you make a transfer on FPL and do not synchronize again, the dashboard cannot know about that private change before the deadline.

## 4. Connect your current FPL squad

Open Planning and select **Set up squad import** or **Refresh squad**.

There are two synchronization methods.

### Method A: manual bookmark

This is the simplest method and does not require a browser extension.

1. On the dashboard import page, select **Copy complete bookmark code**.
2. Create a new browser bookmark.
3. Name it `Send squad to FPL Dashboard`.
4. Paste the copied code into the bookmark's URL or address field.
5. Open `https://fantasy.premierleague.com/my-team` and sign in to FPL.
6. While you are on that FPL page, run the `Send squad to FPL Dashboard` bookmark.
7. The dashboard opens with a local review of all 15 players.
8. Check the starting XI, bench, captain, vice captain, bank, and transfer information.
9. Select **Confirm and save squad**.

If the browser blocks the new tab, allow pop-ups for the official FPL site and try again.

### Method B: automatic userscript

This method is convenient if you synchronize frequently. It requires a compatible userscript manager in the browser where you use FPL.

1. Install and enable a trusted userscript manager for your browser.
2. On the dashboard import page, download the private auto-sync script.
3. Install that script in the userscript manager.
4. Open FPL's signed-in Pick Team page.
5. The script can synchronize on page load, focus, and detected roster changes during that session.

The downloaded script is paired only with your FPL entry. Its pairing expires, and creating a replacement script revokes the previous pairing.

You do not need the userscript if you prefer the manual bookmark workflow.

### What the dashboard receives

The synchronization includes player IDs, lineup positions, selling and purchase prices, captaincy, bench order, bank, squad value, transfer state, and active chip. It does not include your FPL password, cookies, session token, or email address.

## 5. Refresh squad and Check latest sync

These buttons have different meanings.

### Refresh squad

**Refresh squad** opens the squad-import instructions. To obtain new data, you must then do one of the following:

- run the bookmark from the signed-in FPL Pick Team page, or
- open the FPL Pick Team page with the paired userscript enabled

Opening or reloading the dashboard by itself cannot read private FPL changes.

### Check latest sync

**Check latest sync** reads the newest squad that has already reached the dashboard. It does not contact FPL and does not trigger the bookmark or userscript remotely.

The comparison shows the sync time so you can confirm that it happened after your latest FPL changes.

## 6. Generate a plan

Open **Planning** and check the squad-source panel first.

- **Confirmed squad connected** means Planning is using your reviewed pre-deadline squad.
- **Using latest public squad** means private upcoming changes may be missing.

You can optionally set constraints:

- **Locked player IDs** prevent those players from being sold.
- **Excluded player IDs** prevent those players from being bought.
- **Maximum points hit** limits paid transfers.
- **Bank reserve** requires the plan to keep at least that much money available.

Select **Regenerate plans** after changing constraints or synchronizing a new squad.

## 7. Understand the three scenarios

Planning returns Floor, Balanced, and Upside scenarios.

### Floor

Floor favors dependable availability and lower modeled uncertainty. Its headline total is the lower model range for the five-Gameweek plan.

### Balanced

Balanced maximizes the base expected projection over the visible five-Gameweek horizon. This is the default recommendation shown on the home page.

### Upside

Upside emphasizes the higher model range and accepts more outcome uncertainty.

### Why all three can recommend the same move

Sometimes the same move, lineup, and captain are best under all three scoring objectives. The dashboard then explains that the recommendation is robust and uses the cards to show the floor, expected outcome, and ceiling. It does not create artificial differences.

## 8. Understand the points

The large Floor, Balanced, and Upside totals are accumulated projections over up to five Gameweeks. They are not predictions for one match.

The scenario also shows the selected Gameweek separately, such as `GW11: 85.6`. Player values shown in the selected Starting XI are also five-Gameweek values unless the label explicitly says the current Gameweek.

The engine handles the two timescales differently:

- the transfer is selected for its effect over the full horizon
- the displayed XI, captain, vice captain, and bench are selected for the next Gameweek
- each future Gameweek total is calculated with a newly optimized legal XI
- a transfer points hit is deducted once, not once per Gameweek

The numbers are estimates, not guaranteed FPL points.

## 9. Read a selected plan

The selected-scenario section contains:

- **Five-GW expected** or the applicable scenario range
- **Bank remaining** after modeled transfers
- **Captain** and **Vice captain** for the upcoming Gameweek
- **Transfers** with outgoing and incoming players
- **Points hit** caused by transfers beyond the available allowance
- **Starting XI** for the upcoming Gameweek
- **Bench order** for automatic substitutions
- **Snapshot updated** time and projection-model version

When available, the plan also shows the result of holding your current squad. The gain against hold is calculated after legal weekly lineups and transfer hits.

Always confirm current prices and any points hit displayed by the official FPL transfer page before submitting.

## 10. Why a surprising player may start

The displayed lineup is based on projected points for the upcoming Gameweek, formation rules, and the model's current availability estimate. A difficult fixture alone does not automatically put a player on the bench.

If a surprising player starts ahead of another player, check:

1. the individual next-Gameweek estimates
2. whether swapping them would create an illegal formation
3. current FPL availability flags
4. the Team News section and its source time
5. whether your squad was synchronized after the latest changes

The current projection model is intentionally lightweight. It does not yet include a full predicted-lineup or proprietary expected-minutes feed, so manager judgment remains important.

## 11. Save My Plan

Select **Mark as My Plan** on the scenario you intend to follow.

Saving a plan:

- records that exact scenario and its model inputs
- makes it available under My Plan
- enables the Review on FPL checklist
- enables the optional plan explanation
- allows a later post-deadline replay when results finalize

Saving a plan does not:

- make a transfer on FPL
- change your starting XI
- assign the captain or vice captain
- reorder your bench
- activate a chip

The plan is associated with its Gameweek and freezes at the applicable deadline.

## 12. Apply the plan on official FPL

Use the Review on FPL panel as a handoff checklist.

1. Select **Open Transfers**.
2. Make the listed transfer or transfers on official FPL.
3. Review the price and points hit shown by FPL.
4. Confirm the transfer only if it matches your intention.
5. Select **Open Pick Team**.
6. Arrange the listed Starting XI.
7. Set the captain and vice captain.
8. Put substitutes in the listed bench order, including the reserve goalkeeper.
9. Activate a chip only if you have separately decided to follow the chip guidance.
10. Save or confirm the changes on FPL.
11. Synchronize the squad to the dashboard again.
12. Select **Check latest sync**.

You can also select **Copy checklist** and keep the instructions visible while working on FPL.

## 13. Understand plan verification

The verification panel checks each part independently.

- **Transfer — Squad reflects transfer** means the outgoing player is absent and the incoming player is present in the latest synchronized squad.
- **Squad — Matches plan** means all 15 players match the saved scenario.
- **Starting XI — Matches plan** means the same 11 players are starting.
- **Captain — Matches plan** checks the captain flag.
- **Vice captain — Matches plan** checks the vice-captain flag.
- **Bench order — Matches plan** checks the substitute order and reserve goalkeeper slot.

`Pending` means the latest synchronized squad does not match that item. Common reasons include:

- you have not synchronized after making the change
- the userscript did not run on the FPL page
- the dashboard is showing an older sync timestamp
- the transfer was made but the lineup or captaincy was not updated
- the saved plan is now different from the changes you chose to make

The check is detailed enough to detect a correct 15-player squad with the wrong captain or bench order.

## 14. Remaining free transfers

When Planning uses a confirmed private squad, it reads FPL's total transfer allowance and the number already made, then calculates the remaining allowance. A transfer already used can therefore leave zero free transfers for another suggestion.

If Planning uses only a published squad, the exact private pre-deadline transfer state is not available. The dashboard uses a fallback assumption and labels the squad source. Synchronize the current squad for the most accurate transfer and hit calculation.

After making a transfer, synchronize and regenerate. Otherwise an older recommendation may continue to propose a move based on the old squad.

## 15. Chip opportunities

The Chip opportunities panel currently evaluates Bench Boost and Triple Captain.

FPL provides separate chip copies in the first and second halves of the season. The panel identifies the applicable half and shows the expiration Gameweek and deadline.

For each chip it shows:

- whether that copy has already been used
- estimated points from using it now
- the best visible opportunity within the current planning horizon
- a later visible comparison when available

### Bench Boost

The estimate is the projected total of the four bench players before normal automatic substitutions. A strong bench is necessary, but uncertainty about minutes still matters.

### Triple Captain

The estimate is the additional captain score from the third multiplier, with an allowance for vice-captain fallback risk.

`Consider using this week` means the current Gameweek is the best positive opportunity among the visible Gameweeks in the applicable half. It does not mean the dashboard has evaluated every remaining Gameweek in the half-season.

The current planner does not yet construct full Wildcard or Free Hit squads.

## 16. AI plan explanation

After saving My Plan, select **Explain this plan**.

The explanation uses Claude Sonnet and is labeled with the model name. It receives recorded plan facts such as transfers, projections, lineup, bench, captaincy, and legal lineup comparisons. It does not receive authority to change the plan.

The explanation is generated on demand and then cached for that saved scenario and explanation version. Reopening the same explanation normally does not make another model call.

Treat the text as an explanation of the recorded model output, not a new prediction or a source of breaking team news.

## 17. Team News

The Team News panel displays reviewed source material processed by Claude Haiku. Each item can include:

- the player
- a restricted availability or role label
- an exact evidence excerpt
- a link to the source
- the source publication time
- the batch processing time
- the AI model attribution

The current feature is manually curated. It does not continuously browse the web, and a blank panel does not prove that there is no relevant news.

Always check the timestamps. News published after the displayed processing time may not be included. The current pilot informs your decision but does not automatically reduce or increase the numerical player projection.

## 18. Planning backtest

After FPL marks a Gameweek both finished and data-checked, the home page can replay the latest eligible pre-deadline Balanced recommendation.

The comparison uses official final player points and applies:

- legal automatic substitutions
- reserve-goalkeeper rules
- captain-to-vice fallback
- transfer points hits
- Bench Boost or Triple Captain scoring when recorded

It compares the manager's actual net points with the hypothetical recorded plan. If the plan advised a scoring chip that was not active, it can also show how many points that chip would have added in the replay.

### Why a backtest may be unavailable

- FPL has not finalized and data-checked the Gameweek.
- No Balanced recommendation with default constraints was recorded before the deadline.
- A recommendation was generated only after the deadline.
- Official player results are incomplete for the recorded 15-player squad.

A positive result for one Gameweek is evidence about that opportunity, not proof that every future recommendation will outperform the manager.

## 19. Troubleshooting

### My transfer is complete, but the old recommendation remains

Synchronize the squad again and regenerate Planning. Check that the displayed sync time is after the transfer.

### Check latest sync does not refresh FPL

That button only reloads the latest squad already stored by the dashboard. Run the bookmark on FPL or open FPL Pick Team with the userscript enabled first.

### The squad matches, but captain or bench is Pending

The transfer is correct, but the detailed Pick Team configuration differs from My Plan. Recheck captain, vice captain, all 11 starters, substitute order, and reserve goalkeeper.

### Planning still suggests another transfer after I used mine

Confirm that Planning says **Confirmed squad connected**, check the latest sync time, and regenerate. If it is using a public squad, it may not know your private remaining-transfer state.

### The three scenarios are identical

This means the model objectives converged on the same legal decision. The different totals show the range of modeled outcomes.

### Team News looks old

Check each source time and the batch processing time. The pilot is updated through reviewed batches and is not a continuous news feed.

### Explain this plan is unavailable

The feature requires a saved persisted scenario and a configured Anthropic service. The deterministic plan remains usable without it.

### The backtest says no recommendation

The system requires a persisted Balanced recommendation generated before the finalized Gameweek deadline with the default constraints.

### The dashboard reports a network error

The official FPL API, the dashboard, or its database may be temporarily unavailable. Keep a valid saved squad, wait briefly, and retry. Do not clear a correct confirmed squad merely because the upstream service is temporarily unavailable.

## 20. Privacy and safety

- The dashboard does not ask for your FPL password.
- The bookmark and userscript run inside your already signed-in FPL page.
- Only a minimized squad contract is sent to the dashboard.
- The application does not submit official FPL changes.
- A replacement auto-sync script revokes the previous pairing.
- AI features receive planning facts or operator-supplied news excerpts, not FPL credentials.

Official FPL remains the final authority for prices, points hits, deadlines, submitted transfers, lineup, captaincy, and chips.

## 21. Glossary

| Term | Meaning |
| --- | --- |
| **FPL Team ID / Entry ID** | The numeric identifier for an FPL team. |
| **Published squad** | Picks visible from FPL's public API after the applicable release. |
| **Confirmed squad** | A private pre-deadline squad synchronized and reviewed in the dashboard. |
| **Snapshot** | The recorded source data and projections used to generate a scenario. |
| **Scenario** | A complete legal transfer, squad, XI, bench, captaincy, and projection result. |
| **My Plan** | The scenario selected and saved by the manager. |
| **Five-Gameweek horizon** | The current and next four available Gameweeks, or fewer near a boundary. |
| **Points hit** | FPL points deducted for transfers beyond the free allowance. |
| **Floor** | Lower modeled range emphasizing availability and stability. |
| **Balanced** | Base expected projection. |
| **Upside** | Higher modeled range accepting more uncertainty. |
| **Replay** | Applying final official results to a recorded pre-deadline plan. |

