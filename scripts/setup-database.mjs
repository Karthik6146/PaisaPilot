import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { databaseClient } from '../server/store.mjs';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local before running database setup.');
const sql = databaseClient(process.env.DATABASE_URL);
try {
  const schema = await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8');
  await sql.begin(async tx => {
    // Only the trusted, checked-in schema is executed as SQL text.
    await tx.unsafe(schema);
    const rows = await tx`SELECT c.relname, c.relrowsecurity,
      has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE') AS anon_access,
      has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE') AS authenticated_access
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'paisapilot' AND c.relname IN ('profiles', 'sessions', 'auth_limits') AND c.relkind = 'r'`;
    assert.equal(rows.length, 3, 'All three application tables must exist.');
    for (const row of rows) {
      assert.equal(row.relrowsecurity, true, 'RLS must be enabled: ' + row.relname);
      assert.equal(row.anon_access, false, 'Anonymous access must be denied: ' + row.relname);
      assert.equal(row.authenticated_access, false, 'Public API access must be denied: ' + row.relname);
    }
  });
  console.log('Supabase schema installed. All three tables have RLS and deny public API access.');
} finally { await sql.end(); }
