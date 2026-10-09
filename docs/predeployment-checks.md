# Pre-deployment checks — October 9, 2026

Target: Vercel Node.js 24 with the existing Supabase database. No website was deployed during these checks.

## Verified

- 21 automated finance/authentication tests passed, including invalid API action rejection.
- Lint, TypeScript checks and the production build passed.
- Browser checks passed for registration, separate profiles, monthly budget/expenses, dark mode, mobile accessibility, failed-save export/retry, conflicts, cross-tab locking and deletion.
- Live Supabase checks passed for signup, JSON budget/expense persistence, profile isolation, revision conflicts and deletion. Temporary verification profiles were removed.
- Supabase SSL enforcement is enabled; the backend validates its certificate chain and hostname using the included public CA.
- npm audit reported zero vulnerabilities.
- A clean npm ci --ignore-scripts installation from the final lockfile passed in an isolated directory.
- The public build and uploadable source files contain none of the configured database credentials or session secret. The public build also excludes the configured invite, environment files and source maps.
- Vercel configuration matches the official schema properties. The published schema declares Draft 4 but uses newer numeric bounds; validation used Draft 7 for compatibility.

## Fixes made in this pass

- Added .vercelignore to exclude local credentials and Supabase CLI caches from uploads.
- Set the function region to Mumbai (bom1), matching the database.
- Restricted API action lookup to explicitly supported actions; prototype names return 404.

## Before deploying

Deploy the entire project rather than only dist/. In Vercel Production environment settings, set DATABASE_URL, INVITE_CODE and SESSION_SECRET from your private .env.local, and set APP_ORIGIN to the exact final HTTPS origin with no trailing slash. Retain the database to preserve existing profiles. Keep production credentials out of preview builds. The Vite preset, Node 24, build command, output directory, API function and certificate inclusion are configured in vercel.json.

See [deployment instructions](deployment.md). After deploying, check HTTPS, the API response, production cookie flags, sign-in, a save followed by reload, logout and security headers on the actual host. Hosted routing, Vercel environment settings, DNS and production cookies cannot be verified before that deployment exists. Password recovery is not implemented.
