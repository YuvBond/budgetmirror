import { incomes, expenses, installmentGroups, incomeBudgets } from '@/db/schema';
import { NewIncome, NewExpense, NewInstallmentGroup } from '@/types/domain';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { buildInstallmentExpenses } from '@/services/transaction-installments';
import { combineAndSortTransactions } from '@/services/transaction-combine-sort';

type DbLike = any;

export function createTransactionService(deps: { db: DbLike; uuid: () => string }) {
  const { db, uuid } = deps;

  const ensureIncomeBudgetsForMonth = async (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const budgets = await db.select().from(incomeBudgets);
    if (budgets.length === 0) return;

    const existing = await db
      .select()
      .from(incomes)
      .where(and(gte(incomes.date, startOfMonth), lt(incomes.date, startOfNextMonth)));

    const existingKeys = new Set(
      existing
        .filter((i: any) => typeof i.description === 'string' && i.description.startsWith('תקציב הכנסה:'))
        .map((i: any) => `${i.description}|${i.date.getTime()}`)
    );

    const now = new Date();
    const toInsert: NewIncome[] = [];

    for (const budget of budgets) {
      const day = Math.min(budget.dayOfMonth, lastDay);
      const budgetDate = new Date(date.getFullYear(), date.getMonth(), day);
      const description = `תקציב הכנסה:${budget.id}`;
      const key = `${description}|${budgetDate.getTime()}`;
      if (existingKeys.has(key)) continue;

      toInsert.push({
        id: uuid(),
        amount: budget.amount,
        description,
        category: budget.category,
        date: budgetDate,
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (toInsert.length > 0) {
      await db.insert(incomes).values(toInsert);
    }
  };

  return {
    // Incomes
    async getIncomesByMonth(date: Date) {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      await ensureIncomeBudgetsForMonth(date);

      return await db
        .select()
        .from(incomes)
        .where(and(gte(incomes.date, startOfMonth), lt(incomes.date, startOfNextMonth)))
        .orderBy(desc(incomes.date));
    },

    async addIncome(income: Omit<NewIncome, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date();
      const newIncome: NewIncome = {
        ...income,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      return await db.insert(incomes).values(newIncome).returning();
    },

    // Expenses
    async getExpensesByMonth(date: Date) {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      return await db
        .select()
        .from(expenses)
        .where(and(gte(expenses.date, startOfMonth), lt(expenses.date, startOfNextMonth)))
        .orderBy(desc(expenses.date));
    },

    async addExpense(expense: Omit<NewExpense, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date();
      const newExpense: NewExpense = {
        ...expense,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      return await db.insert(expenses).values(newExpense).returning();
    },

    async addInstallmentExpense(
      group: Omit<NewInstallmentGroup, 'id' | 'createdAt'>,
      category: string,
      description: string,
      firstPaymentDate: Date
    ) {
      return await db.transaction(async (tx: DbLike) => {
        const groupId = uuid();
        const now = new Date();

        await tx.insert(installmentGroups).values({
          ...group,
          id: groupId,
          createdAt: now,
        });

        const expensesToInsert: NewExpense[] = buildInstallmentExpenses({
          groupId,
          group,
          category,
          description,
          firstPaymentDate,
          now,
          uuid,
          roundingStrategy: 'adjust_last',
        });

        await tx.insert(expenses).values(expensesToInsert);

        return { groupId, count: expensesToInsert.length };
      });
    },

    async getAllTransactions(limit = 100) {
      const allIncomes = await db.select().from(incomes).orderBy(desc(incomes.date)).limit(limit);
      const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.date)).limit(limit);
      return combineAndSortTransactions(allIncomes, allExpenses, limit);
    },

    async deleteTransaction(id: string, isIncome: boolean) {
      if (isIncome) {
        await db.delete(incomes).where(eq(incomes.id, id));
      } else {
        await db.delete(expenses).where(eq(expenses.id, id));
      }
    },
  };
}

