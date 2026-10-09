// Test-only store. Production always uses Postgres and never falls back to this fixture.
export function memoryStore() {
  const profiles = new Map(), sessions = new Map(), limits = new Map();
  return {
    profiles, sessions, limits,
    async throttle(key, max) { const count = (limits.get(key) || 0) + 1; limits.set(key, count); return count <= max; },
    async cleanup() { for (const [key, s] of sessions) if (Date.parse(s.expires_at) <= Date.now()) sessions.delete(key); },
    async findProfile(username) { return [...profiles.values()].find(p => p.username === username); },
    async register(p) { if (await this.findProfile(p.username)) return undefined; profiles.set(p.id, { ...structuredClone(p), revision: 0 }); return { id: p.id }; },
    async addSession(s) { sessions.set(s.token_hash, structuredClone(s)); },
    async session(hash, invite) { const s = sessions.get(hash); if (!s || s.invite_hash !== invite || Date.parse(s.expires_at) <= Date.now()) return undefined; const p = profiles.get(s.profile_id); return p && structuredClone({ ...s, username: p.username, data: p.data, revision: p.revision }); },
    async removeSession(hash) { sessions.delete(hash); },
    async password(id) { return profiles.get(id)?.password_hash; },
    async save(id, revision, data) { const p = profiles.get(id); if (!p || p.revision !== revision) return undefined; p.data = structuredClone(data); return { revision: ++p.revision }; },
    async deleteProfile(id) { profiles.delete(id); for (const [key, s] of sessions) if (s.profile_id === id) sessions.delete(key); },
  };
}
