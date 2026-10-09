import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const supabaseCA = readFileSync(new URL('./supabase-ca.crt', import.meta.url), 'utf8');

export function databaseClient(url) {
  // Supabase transaction pooling requires unnamed statements and one query in flight.
  return postgres(url, { max: 1, max_pipeline: 1, prepare: false, ssl: { rejectUnauthorized: true, ca: supabaseCA }, idle_timeout: 20, connect_timeout: 10, fetch_types: false });
}

export function postgresStore(url) {
  const sql = databaseClient(url);
  return {
    async throttle(key, maximum) {
      const [row] = await sql`INSERT INTO paisapilot.auth_limits AS limits (key, count, expires_at) VALUES (${key}, 1, now() + interval '15 minutes') ON CONFLICT (key) DO UPDATE SET count = CASE WHEN limits.expires_at <= now() THEN 1 ELSE limits.count + 1 END, expires_at = CASE WHEN limits.expires_at <= now() THEN now() + interval '15 minutes' ELSE limits.expires_at END RETURNING count`;
      return row.count <= maximum;
    },
    async cleanup() {
      await sql`DELETE FROM paisapilot.sessions WHERE expires_at <= now()`;
      await sql`DELETE FROM paisapilot.auth_limits WHERE expires_at <= now()`;
    },
    async findProfile(username) { const [p] = await sql`SELECT id, password_hash FROM paisapilot.profiles WHERE username = ${username}`; return p; },
    async register(profile) {
      const [p] = await sql`INSERT INTO paisapilot.profiles (id, username, password_hash, data) VALUES (${profile.id}, ${profile.username}, ${profile.password_hash}, ${sql.json(profile.data)}) ON CONFLICT (username) DO NOTHING RETURNING id`;
      return p;
    },
    async addSession(s) { await sql`INSERT INTO paisapilot.sessions (token_hash, profile_id, invite_hash, csrf, expires_at) VALUES (${s.token_hash}, ${s.profile_id}, ${s.invite_hash}, ${s.csrf}, ${s.expires_at})`; },
    async session(token, invite) { const [s] = await sql`SELECT s.profile_id, s.csrf, p.username, p.data, p.revision FROM paisapilot.sessions s JOIN paisapilot.profiles p ON p.id = s.profile_id WHERE s.token_hash = ${token} AND s.invite_hash = ${invite} AND s.expires_at > now()`; return s; },
    async removeSession(token) { await sql`DELETE FROM paisapilot.sessions WHERE token_hash = ${token}`; },
    async password(id) { const [p] = await sql`SELECT password_hash FROM paisapilot.profiles WHERE id = ${id}`; return p?.password_hash; },
    async save(id, revision, data) { const [p] = await sql`UPDATE paisapilot.profiles SET data = ${sql.json(data)}, revision = revision + 1 WHERE id = ${id} AND revision = ${revision} RETURNING revision`; return p; },
    async deleteProfile(id) { await sql`DELETE FROM paisapilot.profiles WHERE id = ${id}`; },
  };
}
