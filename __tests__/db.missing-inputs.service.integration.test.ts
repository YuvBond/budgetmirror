import { createTestDb } from '@/db/test-db';
import { createTransactionService } from '@/services/transaction.service.core';
import { createNetWorthService } from '@/services/net-worth.service.core';
import { createMissingInputsService } from '@/services/missing-inputs.service.core';
import { assets } from '@/db/schema';

describe('DB integration: MissingInputsService (core)', () => {
  it('alerts when no expenses this week and no income this month', async () => {
    const { db } = await createTestDb();
    const tx = createTransactionService({ db, uuid: () => 'uuid' });
    const nw = createNetWorthService({ db, uuid: () => 'uuid' });
    const svc = createMissingInputsService({ transactionService: tx, netWorthService: nw });

    const alerts = await svc.check(new Date(2026, 0, 14)); // Wed
    expect(alerts).toEqual(['לא עודכנו הוצאות השבוע', 'לא הוגדרה הכנסה החודש']);
  });

  it('does not alert about weekly expenses if an expense exists on start-of-week; does alert about assets not updated', async () => {
    const { db } = await createTestDb();
    let n = 0;
    const tx = createTransactionService({ db, uuid: () => `uuid-${++n}` });
    const nw = createNetWorthService({ db, uuid: () => `uuid-${++n}` });
    const svc = createMissingInputsService({ transactionService: tx, netWorthService: nw });

    // Date is Wed 2026-01-14; start-of-week is Sun 2026-01-11
    await tx.addExpense({
      amount: 1,
      description: 'x',
      category: 'y',
      date: new Date(2026, 0, 11, 0, 0, 0),
      type: 'VARIABLE',
      installmentGroupId: null,
      installmentNumber: null,
    });

    await tx.addIncome({
      amount: 1,
      description: 'x',
      category: 'y',
      date: new Date(2026, 0, 2),
      isRecurring: false,
    });

    // Insert an asset with updatedAt in previous month to trigger "assets not updated" alert
    await db.insert(assets).values({
      id: 'a-1',
      name: 'עו"ש',
      amount: 10,
      type: 'LIQUID',
      date: new Date(2026, 0, 1),
      updatedAt: new Date(2025, 11, 31),
    });

    const alerts = await svc.check(new Date(2026, 0, 14));
    expect(alerts).toEqual(['לא עודכן שווי נכסים החודש']);
  });
});

