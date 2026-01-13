import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey(), // UUID
  amount: real('amount').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const installmentGroups = sqliteTable('installment_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  totalAmount: real('total_amount').notNull(),
  totalPayments: integer('total_payments').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  type: text('type').notNull(), // 'FIXED', 'VARIABLE', 'INSTALLMENT'
  
  // Foreign Key for Installments
  installmentGroupId: text('installment_group_id').references(() => installmentGroups.id),
  installmentNumber: integer('installment_number'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'LIQUID', 'INVESTMENT', 'PROPERTY'
  date: integer('date', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const liabilities = sqliteTable('liabilities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'LOAN', 'MORTGAGE', 'CREDIT_CARD_DEBT'
  date: integer('date', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
