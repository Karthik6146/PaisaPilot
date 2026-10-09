import { emptySnapshot, parseBackup, exportBackup, DEFAULT_SETTINGS } from '../../shared/finance.mjs';
export { emptySnapshot, parseBackup, exportBackup, DEFAULT_SETTINGS };
export const DEFAULT_BUDGET = emptySnapshot().budget;
const keys = ['pocketguard_transactions_v1', 'pocketguard_loans_v1', 'pocketguard_budget_v1', 'pocketguard_settings_v1'];

// Remove every legacy live/recovery copy only after explicit browser cleanup consent.
export function clearLegacyData() {
  let success = true;
  for (const key of keys.flatMap(key => [key, key + '_recovery'])) {
    try { localStorage.removeItem(key); } catch { success = false; }
  }
  return success;
}