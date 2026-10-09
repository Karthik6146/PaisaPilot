# Invite-only profiles and deployment

Use Vercel Node functions and Neon Postgres. The six-digit shared invite is a server environment secret. Profiles use unique usernames, passwords hashed with scrypt, opaque HttpOnly cookies and separate server-owned records. No default personal identity or automatic import of browser data.

1. Put bounded finance validation and backup/CSV helpers in `shared/finance.mjs`; reuse them on the browser and API. Remove dynamic calculator evaluation, unused AI and the graph viewer. Fix numeric handling, deletion and emergency backups.
2. Add `server/schema.sql`, `server/store.mjs`, `server/auth.mjs`, `server/handler.mjs` and `api/index.mjs`. Parameterized queries, database-backed auth throttling, CSRF/origin checks, session expiry/revocation and profile-specific optimistic saves. Fail closed without deployment secrets.
3. Add an invite/profile login UI and authenticated workspace wrapper. Adapt App to server-loaded snapshots, serialized autosave, explicit errors/retry/export, sign-out, profile deletion and explicit import of an exported legacy backup. Avoid discovering unbound personal records in a shared browser.
4. Add Vercel headers/config, placeholder environment variables and deployment instructions. Keep real credentials out of source. Public output must not include graph metadata or personal records.
5. Verify shared finance edge cases, profile isolation, invite enforcement, password/session/CSRF handling, throttling, revision conflicts and failed saves with dummy offline stores. Run dependency audit, lint/build and browser checks. Live Neon/Vercel verification requires owner configuration; do not publish without it.

Design: reuse the cream/green dashboard and existing dark theme. Entry screen shows the invite, username and password with a create-profile mode. No profile directory is exposed. Preserve the dashboard and manual categories. Existing local data stays untouched until the owner explicitly restores it; deletion then removes legacy live/recovery copies only when requested.

Implemented and verified with 20 automated tests, production-build browser checks and accessibility scans. The browser checks also cover stale-tab conflicts and shared-browser session locking. Live deployment remains dependent on the owner's Vercel/Neon configuration; see docs/deployment.md.
