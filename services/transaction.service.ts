import { db } from '@/db/client';
import { incomes, expenses, installmentGroups } from '@/db/schema';
import { NewIncome, NewExpense, NewInstallmentGroup } from '@/types/domain';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { addMonths } from 'date-fns';

export const TransactionService = {
  // ... existing methods ...

  // Incomes
  async getIncomesByMonth(date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return await db.select()
      .from(incomes)
      .where(
        and(
          gte(incomes.date, startOfMonth),
          lte(incomes.date, endOfMonth)
        )
      )
      .orderBy(desc(incomes.date));
  },

  async getAllTransactions(limit = 100) {
    // Union queries are tricky in Drizzle SQLite sometimes, 
    // simpler to fetch both and sort in JS for MVP if data is small.
    const allIncomes = await db.select().from(incomes).orderBy(desc(incomes.date)).limit(limit);
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.date)).limit(limit);

    // Combine and sort
    const combined = [
      ...allIncomes.map(i => ({ ...i, isIncome: true })),
      ...allExpenses.map(e => ({ ...e, isIncome: false }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return combined.slice(0, limit);
  },

  async deleteTransaction(id: string, isIncome: boolean) {
    if (isIncome) {
      await db.delete(incomes).where(eq(incomes.id, id));
    } else {
      await db.delete(expenses).where(eq(expenses.id, id));
    }
  },

  async addIncome(income: Omit<NewIncome, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const newIncome: NewIncome = {
      ...income,
      id: Crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    return await db.insert(incomes).values(newIncome).returning();
  },

  // Expenses
  async getExpensesByMonth(date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return await db.select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startOfMonth),
          lte(expenses.date, endOfMonth)
        )
      )
      .orderBy(desc(expenses.date));
  },

  async addExpense(expense: Omit<NewExpense, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const newExpense: NewExpense = {
      ...expense,
      id: Crypto.randomUUID(),
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
    return await db.transaction(async (tx) => {
      // 1. Create Installment Group
      const groupId = Crypto.randomUUID();
      const now = new Date();
      
      await tx.insert(installmentGroups).values({
        ...group,
        id: groupId,
        createdAt: now,
      });

      // 2. Create Expenses for each month
      const expensesToInsert: NewExpense[] = [];
      const amountPerPayment = group.totalAmount / group.totalPayments;
      
      for (let i = 0; i < group.totalPayments; i++) {
        const paymentDate = addMonths(firstPaymentDate, i);
        
        expensesToInsert.push({
          id: Crypto.randomUUID(),
          amount: amountPerPayment,
          description: `${description} (${i + 1}/${group.totalPayments})`,
          category: category,
          date: paymentDate,
          type: 'INSTALLMENT',
          installmentGroupId: groupId,
          installmentNumber: i + 1,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      await tx.insert(expenses).values(expensesToInsert);
    });
  }
};
