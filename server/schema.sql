-- Run in Supabase's SQL editor as postgres. Keep this schema out of exposed Data API schemas.
CREATE SCHEMA IF NOT EXISTS paisapilot;
CREATE TABLE IF NOT EXISTS paisapilot.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  data jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS paisapilot.sessions (
  token_hash text PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES paisapilot.profiles(id) ON DELETE CASCADE,
  invite_hash text NOT NULL,
  csrf text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON paisapilot.sessions(expires_at);
CREATE TABLE IF NOT EXISTS paisapilot.auth_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE paisapilot.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE paisapilot.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paisapilot.auth_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA paisapilot FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA paisapilot FROM PUBLIC, anon, authenticated;
