# PaisaPilot — Invite-only personal budgets

A monthly pocket-money tracker with private profiles, daily spending, manual categories, priorities, notes, calculators, lend/borrow records and dark mode.

Everyone needs the same owner-provided six-digit invite to register or sign in. Each profile has a unique username and password. The invite is checked on the server, never embedded in client JavaScript. No name, personal records, default fees or profile is preloaded.

## Start and deploy

Use **Node.js 24**, **Vercel** and **Supabase Postgres**. Configure the four server variables in .env.example, run npm run db:setup (or apply server/schema.sql in Supabase's SQL editor), and follow [the deployment guide](docs/deployment.md).

~~~sh
npm ci --ignore-scripts
npm run dev
~~~

For local development, configure .env.local and visit its exact APP_ORIGIN. Missing API/database configuration fails closed; this is no longer a browser-only static app.

## Your budget

Enter your monthly pocket money, create your own categories, and record each day's spending. Unpaid priorities reserve money; marking one paid creates its expense and releases the reservation. Notes and budgets belong to their selected month.

Daily allowance is **max(0, remaining monthly budget − unpaid priorities) ÷ days left, including today**. The monthly budget is starting pocket money plus money received that month. Enter the initial allowance only in the budget; record additional receipts as income. Removing a receipt reduces available funds automatically. Loans are tracked separately.

Profiles autosave to Postgres. Export backups regularly. If a save fails, current changes remain on screen and are included in exports; retry before leaving. Another tab's conflicting save is rejected rather than overwritten. Sign-out and profile switching lock other tabs, so export pending changes there first.

## Existing data and cleanup

Restore your own exported JSON through Profile & backup after signing in. Existing browser data is never automatically assigned to a new profile. A separate confirmed cleanup removes all legacy live/recovery keys and reports deletion failures. Backups exclude legacy API keys and unknown fields.

Unused AI code, the unsafe graph viewer, student badges and confetti were removed. Calculators parse arithmetic without JavaScript evaluation. Google Fonts requests were removed. Historical guides under docs describe the older UI; this README and the deployment guide describe the current product.

## Checks

~~~sh
npm test
npm run lint
npm run build
npm run test:browser
npm audit
~~~

Checks include invite enforcement, profile isolation, CSRF, session revocation, throttling, revision conflicts, financial/backup validation, CSV neutralization, arithmetic parsing, failed-save exports and browser accessibility. Browser tests use dummy local data; live Supabase/Vercel configuration still needs verification before sharing the site.

[Deployment, secrets, profile security and limitations](docs/deployment.md)
