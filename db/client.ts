import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'budget_mirror.db';

const expoDb = openDatabaseSync(DB_NAME);

export const db = drizzle(expoDb, { schema });

// Helper to check/debug
export const resetDb = () => {
  // In dev only
  expoDb.execSync('PRAGMA foreign_keys = OFF;');
  expoDb.execSync('DROP TABLE IF EXISTS incomes;');
  expoDb.execSync('DROP TABLE IF EXISTS expenses;');
  expoDb.execSync('DROP TABLE IF EXISTS installment_groups;');
  expoDb.execSync('DROP TABLE IF EXISTS assets;');
  expoDb.execSync('DROP TABLE IF EXISTS liabilities;');
  expoDb.execSync('PRAGMA foreign_keys = ON;');
};
