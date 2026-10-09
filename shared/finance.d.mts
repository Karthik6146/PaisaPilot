import type { Transaction, LoanItem, BudgetConfig, UserSettings } from '../src/types/finance';
export interface Snapshot { transactions: Transaction[]; loans: LoanItem[]; budget: BudgetConfig; settings: UserSettings; }
export const DEFAULT_SETTINGS: UserSettings;
export const MAX_BACKUP_BYTES: number;
export function emptySnapshot(name?: string): Snapshot;
export function parseSnapshot(value: unknown): Snapshot;
export function parseBackup(json: string): Snapshot;
export function exportBackup(snapshot: Snapshot): string;
export function validMoney(value: unknown): boolean;
export function validDate(value: unknown): boolean;
export function csvCell(value: string | number): string;
