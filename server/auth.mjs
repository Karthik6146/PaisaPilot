import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const token = () => randomBytes(32).toString('hex');
export const hashToken = value => createHash('sha256').update(value).digest('hex');
export const privateHash = (value, secret) => createHmac('sha256', secret).update(value).digest('hex');
export const equal = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return salt + ':' + key.toString('hex');
}
export async function checkPassword(password, stored) {
  const [salt, expected] = (stored || '').split(':');
  // Run the same expensive hash for nonexistent accounts; do not leak existence through a fast path.
  const key = await derive(password, salt || '0'.repeat(32), 64, options);
  return equal(key.toString('hex'), expected || '0'.repeat(128));
}
export function readConfig(env = process.env) {
  const origin = env.APP_ORIGIN;
  if (!origin || !/^\d{6}$/.test(env.INVITE_CODE || '') || (env.SESSION_SECRET || '').length < 32 || !env.DATABASE_URL) throw new Error('Missing server configuration');
  const parsed = new URL(origin);
  const production = env.NODE_ENV === 'production' || env.VERCEL === '1';
  if (parsed.origin !== origin || (parsed.protocol !== 'https:' && (production || !['localhost', '127.0.0.1'].includes(parsed.hostname)))) throw new Error('Invalid application origin');
  return { origin, production, database: env.DATABASE_URL, invite: env.INVITE_CODE, secret: env.SESSION_SECRET };
}
