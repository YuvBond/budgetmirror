// Prefer ASM build in Jest/CI to avoid WASM memory allocation issues.
import initSqlJs from 'sql.js/dist/sql-asm.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '@/db/schema';

// Keep this in sync with the app's migration SQL (currently in app/_layout.tsx).
const m0000 = `CREATE TABLE \`assets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`type\` text NOT NULL,
\t\`date\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`expenses\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`amount\` real NOT NULL,
\t\`description\` text,
\t\`category\` text NOT NULL,
\t\`date\` integer NOT NULL,
\t\`type\` text NOT NULL,
\t\`installment_group_id\` text,
\t\`installment_number\` integer,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\tFOREIGN KEY (\`installment_group_id\`) REFERENCES \`installment_groups\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`incomes\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`amount\` real NOT NULL,
\t\`description\` text,
\t\`category\` text NOT NULL,
\t\`date\` integer NOT NULL,
\t\`is_recurring\` integer DEFAULT false,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`installment_groups\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`total_amount\` real NOT NULL,
\t\`total_payments\` integer NOT NULL,
\t\`start_date\` integer NOT NULL,
\t\`created_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`liabilities\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`type\` text NOT NULL,
\t\`date\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`fixed_budgets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`category\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`day_of_month\` integer NOT NULL,
\t\`note\` text,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`variable_budgets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`category\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`month\` integer NOT NULL,
\t\`carry_to_next_month\` integer DEFAULT false,
\t\`note\` text,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`income_budgets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`category\` text NOT NULL,
\t\`amount\` real NOT NULL,
\t\`day_of_month\` integer NOT NULL,
\t\`note\` text,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);`;

function splitStatements(sql: string) {
  return sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createTestDb() {
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database();

  // Enforce FK constraints, so we can test them.
  sqlite.run('PRAGMA foreign_keys = ON;');

  for (const stmt of splitStatements(m0000)) {
    sqlite.run(stmt);
  }

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

