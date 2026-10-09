# Personal budget upgrade

Scope: keep React, existing local storage keys, calculators, loans, and backups. Replace the student overview, navigation, budget editor, and transaction entry. Do not rewrite or erase existing user records.

1. Allow custom category names. New installations have no demo transactions, loans, or category allocations. Preserve legacy data and support monthly budget plans in the existing budget backup.
2. Calculate the selected month's spending against its entered budget. Income stays a separate ledger metric and never adds the allowance twice. Use local calendar dates. Reserve unpaid priority purchases before dividing available funds by remaining days.
3. Build a responsive cream/green dashboard with daily spending, category totals, recent activity, priority purchases, and persistent pinned notes. Support recording a priority purchase as an expense once, with undo through deleting its transaction.
4. Replace fixed budget sliders with exact amount inputs, custom category allocations, and visible validation. Mount fresh transaction forms when opened, with custom categories and dates.
5. Verify arithmetic, month isolation, storage/backups, paid priorities, build, lint, and browser workflows at desktop and mobile sizes. Update documentation.

Review focus: zero and exceeded budgets, local midnight, February/month boundaries, budget versus income double counting, reservations exceeding balance, duplicate category names, malformed imports, storage failure, reopen form defaults, and existing saved records.

Research: CFPB recommends tracking a month of spending and distinguishing needs from wants; YNAB recommends daily review and funding categories by personal priorities. These inform the UI; no fixed spending ratios are imposed.

- https://www.consumerfinance.gov/archive/blog/track-your-spending-with-this-easy-tool/
- https://www.ynab.com/blog/five-minute-budget-routine
