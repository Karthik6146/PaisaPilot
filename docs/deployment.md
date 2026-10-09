# Deploy PaisaPilot on Vercel

This version needs its API and Postgres database. Uploading only `dist` to a static host will not enable profiles. Vercel is the prepared target; Netlify needs a different function adapter and is not configured here.

## Database and environment

Create a Supabase project near your Vercel function region. Apply [server/schema.sql](../server/schema.sql) in Supabase's SQL editor as postgres, or configure DATABASE_URL locally and run npm run db:setup. The setup command installs the schema and checks RLS and access permissions in one transaction. Use separate projects for production, development and previews.

In the Supabase dashboard, choose **Connect → Transaction pooler** and copy the exact URI (port 6543). Replace the password placeholder with your database password, URL-encoding any special characters. The backend uses one connection per warm instance, disables prepared statements and query pipelining, and verifies TLS certificates. Use the pooler endpoint rather than the IPv6-only direct endpoint. Keep the paisapilot schema out of the Data API's exposed schemas. Do not add public access policies or put a database password/service role key in browser code. The app's existing invite/profile authentication runs on its server; no public Supabase client key is needed.

Import the repository into Vercel with the **Vite** preset and **Node.js 24.x**. `vercel.json` configures the locked install, build, API function, output and security headers. Set these variables in Vercel's **Production** environment:

The function region is bom1 (Mumbai), matching the connected Supabase database. If you move the database, update the function region too. Deploy the complete project, including api/, server/, shared/ and server/supabase-ca.crt. The .vercelignore file prevents local environment files and Supabase CLI caches from being uploaded. Configure credentials through Vercel's environment settings; do not upload .env.local.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction pooler URI with the actual database password |
| `INVITE_CODE` | Your chosen six digits, including any leading zeroes |
| `SESSION_SECRET` | At least 32 random characters; preferably 32 random bytes encoded as hex |
| `APP_ORIGIN` | HTTPS website origin, e.g. `https://your-project.vercel.app`. A root trailing slash and surrounding whitespace are normalized; paths, queries and fragments are rejected. |

Generate the secret locally: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Store it only in environment settings. Never prefix these variables with `VITE_` or commit real `.env` files.

Redeploy after configuration. Use one canonical origin for sign-in. When adding a custom domain, change `APP_ORIGIN` and redirect other hostnames. Previews need their own exact origin and separate database/secrets. Never expose production secrets to untrusted branch previews. Missing configuration fails closed.

Save all four variables in the **Production** environment before deploying. If Vercel blocks the commit author, set this repository's Git author email to the email connected to your Vercel/GitHub account before creating the next commit.

For this first deployment, use your existing DATABASE_URL, INVITE_CODE and SESSION_SECRET from .env.local if you want to retain the profiles already created. Set APP_ORIGIN to your final HTTPS website origin instead of localhost. Changing hosts requires signing in again because cookies belong to the host. Do not run development experiments against the production database after launch. Keep preview deployments disconnected until you give them separate credentials and a database.

## Create your profile

Choose **Create a profile** and enter your invite, profile name, username and password. No personal profile or administrator is seeded. Create your own profile with your own details. Other invited people create independent profiles; the shared invite does not identify a profile or grant access to anyone else's records.

Passwords must be 12–128 characters. Save them in a password manager: email verification and password recovery are not implemented. Distribute the invite privately. A six-digit code has one million possibilities, so throttling and profile passwords remain necessary.

## Verify before sharing

Use dummy records first. Check wrong invite rejection, signup/sign-in, budget/expense saving, reload persistence, backup export/restore, a second profile's empty workspace, logout and profile deletion. Confirm production cookies have the `__Host-` prefix, `Secure`, `HttpOnly` and `SameSite=Strict`. Confirm security headers and API `Cache-Control: no-store`. Live hosting and database checks have not been run in this workspace.

Auth uses database-backed limits: 20 requests per IP, 10 per username and 1,000 globally per 15 minutes. IP handling trusts Vercel's replaced client-IP header specifically. Set Vercel firewall/bot controls and provider spending limits before a wide public launch; revisit IP trust if adding another proxy. Database errors fail closed, with no production memory-store fallback.

## Data and privacy

Records belong to the authenticated profile. Cookies hold opaque sessions; credentials and financial records are not saved to localStorage. Sessions expire after seven days. Changing the invite or session secret and redeploying invalidates existing sessions. Logout invalidates this browser's session, not other devices. Other tabs lock when the session changes; export pending edits in those tabs before signing out or switching profiles.

Saves run in order. Stale revisions return a conflict instead of overwriting another tab. Export pending edits, reload, then intentionally reconcile a conflict. Failed or ambiguous network writes never silently report success. Closing with pending edits triggers a warning; a browser/device failure can still lose changes that have not reached the server. Keep backups regularly.

**Clear financial records** empties the active profile's finance data and retains its identity. **Delete profile** requires its password and removes the live profile and sessions. Supabase backups/history follow provider retention policy; application deletion does not immediately erase provider backups. Exported files and old browser copies must be removed separately.

Before upgrading an old installation or sharing its browser, export your own JSON from the old app. Restore it through **Profile & backup** after signing in to your own profile. Restore retains the current profile name, strips legacy credentials/unknown fields and rejects invalid/oversized data. Nothing is assigned to a new user automatically. **Remove old browser copies** explicitly removes all four legacy live keys and four recovery keys, reports failures and does not alter cloud profiles. Damaged recovery data is never imported automatically.

## Local development and checks

Copy `.env.example` to `.env.local` and fill all four variables using a development Supabase project. Keep `APP_ORIGIN=http://localhost:5173` and visit that exact URL. Run `npm ci --ignore-scripts`, `npm run db:setup` and `npm run dev`. Vite serves the same API handler. `npm run preview` serves only static assets, not a full API environment.

```sh
npm test
npm run lint
npm run build
npm run test:browser
npm audit
```

Browser checks use installed Chrome, disposable profiles, the production bundle/CSP, a local test API and dummy credentials. External browser requests are blocked. They do not validate live Supabase SQL, Vercel routing or provider configuration. The backend includes Supabase's public root certificate in server/supabase-ca.crt and verifies the certificate chain and hostname. Vercel includes that file in the API function. When Supabase rotates its CA, update the public certificate from the dashboard's Database SSL Configuration and rerun the connection checks; never disable verification. Current public certificate: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt (expires April 26, 2031).

After configuring a development database and starting npm run dev at localhost:5173, npm run test:database checks actual signup, JSON budget/expense persistence, profile isolation, stale revisions and deletion through the app. It creates randomly named temporary profiles and removes them in cleanup; existing profiles remain untouched. Repeated runs count toward the authentication rate limit.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [Vercel client-IP headers](https://vercel.com/docs/headers/request-headers), [Supabase Postgres connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Postgres.js parameterized queries](https://github.com/porsager/postgres).
