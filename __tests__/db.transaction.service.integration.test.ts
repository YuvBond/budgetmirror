import { createTestDb } from '@/db/test-db';
import { createTransactionService } from '@/services/transaction.service.core';
import { expenses, incomes, installmentGroups } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('DB integration: TransactionService (core)', () => {
  it('addIncome + getIncomesByMonth + deleteTransaction work end-to-end', async () => {
    const { db } = await createTestDb();
    const svc = createTransactionService({ db, uuid: () => 'uuid-1' });

    const d = new Date(2026, 0, 31, 23, 0, 0);
    await svc.addIncome({
      amount: 1000,
      description: 'Salary',
      category: 'משכורת',
      date: d,
      isRecurring: false,
    });

    const jan = await svc.getIncomesByMonth(new Date(2026, 0, 1));
    expect(jan).toHaveLength(1);
    expect(jan[0].category).toBe('משכורת');

    await svc.deleteTransaction('uuid-1', true);
    const after = await svc.getIncomesByMonth(new Date(2026, 0, 1));
    expect(after).toHaveLength(0);
  });

  it('addExpense + getExpensesByMonth includes last-day times', async () => {
    const { db } = await createTestDb();
    const svc = createTransactionService({ db, uuid: () => 'uuid-e1' });

    await svc.addExpense({
      amount: 12.34,
      description: 'Groceries',
      category: 'אוכל',
      date: new Date(2026, 0, 31, 23, 59, 59),
      type: 'VARIABLE',
      installmentGroupId: null,
      installmentNumber: null,
    });

    const jan = await svc.getExpensesByMonth(new Date(2026, 0, 15));
    expect(jan).toHaveLength(1);
    expect(jan[0].amount).toBeCloseTo(12.34, 10);
  });

  it('addInstallmentExpense creates a group + N expenses and getAllTransactions returns flags', async () => {
    const { db } = await createTestDb();
    let n = 0;
    const svc = createTransactionService({ db, uuid: () => `uuid-${++n}` });

    const result = await svc.addInstallmentExpense(
      {
        name: 'Laptop',
        totalAmount: 100,
        totalPayments: 2,
        startDate: new Date(2026, 0, 5),
      },
      'מחשב',
      'לפטופ',
      new Date(2026, 0, 5)
    );

    expect(result.count).toBe(2);

    const groups = await db.select().from(installmentGroups);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(result.groupId);

    const ex = await db.select().from(expenses).where(eq(expenses.installmentGroupId, result.groupId));
    expect(ex).toHaveLength(2);

    // Add an income too, then check getAllTransactions flags
    await svc.addIncome({
      amount: 1,
      description: 'x',
      category: 'y',
      date: new Date(2026, 0, 20),
      isRecurring: false,
    });

    const all = await svc.getAllTransactions(10);
    expect(all.some((t) => t.isIncome === true)).toBe(true);
    expect(all.some((t) => t.isIncome === false)).toBe(true);
  });
});

