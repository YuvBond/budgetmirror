import { createTestDb } from '@/db/test-db';
import { createBudgetService } from '@/services/budget.service.core';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('DB integration: BudgetService (core)', () => {
  it('adds/updates/deletes fixed budgets', async () => {
    const { db } = await createTestDb();
    const svc = createBudgetService({ db, uuid: () => 'uuid-1' });

    await svc.addFixedBudget({
      category: 'חשמל',
      amount: 200,
      dayOfMonth: 5,
      note: 'חשבון',
    });

    const all = await svc.getFixedBudgets();
    expect(all).toHaveLength(1);
    expect(all[0].category).toBe('חשמל');

    await svc.updateFixedBudget('uuid-1', { amount: 250 });
    const updated = await svc.getFixedBudgetById('uuid-1');
    expect(updated?.amount).toBe(250);

    await svc.deleteFixedBudget('uuid-1');
    expect((await svc.getFixedBudgets()).length).toBe(0);
  });

  it('adds variable budgets and carry-over copies to next month', async () => {
    const { db } = await createTestDb();
    const svc = createBudgetService({ db, uuid: () => `uuid-${Math.random()}` });

    const jan = new Date(2026, 0, 1);
    const feb = new Date(2026, 1, 1);

    await svc.addVariableBudget({
      category: 'אוכל',
      amount: 1000,
      month: jan,
      carryToNextMonth: true,
      note: '',
    });

    await svc.addVariableBudget({
      category: 'דלק',
      amount: 400,
      month: jan,
      carryToNextMonth: false,
      note: '',
    });

    const copied = await svc.copyCarryOverBudgetsToMonth(feb);
    expect(copied).toHaveLength(1);
    expect(copied[0].category).toBe('אוכל');
  });

  it('adds income budgets', async () => {
    const { db } = await createTestDb();
    const svc = createBudgetService({ db, uuid: () => 'uuid-income' });

    await svc.addIncomeBudget({
      category: 'משכורת',
      amount: 12000,
      dayOfMonth: 10,
      note: '',
    });

    const all = await svc.getIncomeBudgets();
    expect(all).toHaveLength(1);
    expect(all[0].amount).toBe(12000);
  });

  it('creates expense from fixed budget helper', async () => {
    const { db } = await createTestDb();
    const svc = createBudgetService({ db, uuid: () => 'uuid-exp' });

    await svc.createExpenseFromFixedBudget({
      category: 'חשמל',
      amount: 200,
      date: new Date(2026, 0, 2),
      description: 'תקציב קבוע',
    });

    const rows = await db.select().from(expenses).where(eq(expenses.category, 'חשמל'));
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(200);
  });
});

