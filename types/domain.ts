import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  incomes,
  expenses,
  assets,
  liabilities,
  installmentGroups,
  fixedBudgets,
  variableBudgets,
  incomeBudgets,
} from '@/db/schema';

export type Income = InferSelectModel<typeof incomes>;
export type NewIncome = InferInsertModel<typeof incomes>;

export type Expense = InferSelectModel<typeof expenses>;
export type NewExpense = InferInsertModel<typeof expenses>;

export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;

export type Liability = InferSelectModel<typeof liabilities>;
export type NewLiability = InferInsertModel<typeof liabilities>;

export type InstallmentGroup = InferSelectModel<typeof installmentGroups>;
export type NewInstallmentGroup = InferInsertModel<typeof installmentGroups>;

export type FixedBudget = InferSelectModel<typeof fixedBudgets>;
export type NewFixedBudget = InferInsertModel<typeof fixedBudgets>;

export type VariableBudget = InferSelectModel<typeof variableBudgets>;
export type NewVariableBudget = InferInsertModel<typeof variableBudgets>;

export type IncomeBudget = InferSelectModel<typeof incomeBudgets>;
export type NewIncomeBudget = InferInsertModel<typeof incomeBudgets>;
