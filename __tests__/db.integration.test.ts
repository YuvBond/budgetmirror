import { and, gte, lt, desc, eq } from 'drizzle-orm';
import { createTestDb } from '@/db/test-db';
import { incomes, expenses, installmentGroups } from '@/db/schema';
import { buildInstallmentExpenses } from '@/services/transaction-installments';

describe('DB integration (sql.js + Drizzle)', () => {
  it('inserts and queries incomes by month boundaries (date stored as timestamp)', async () => {
    const { db } = await createTestDb();

    const jan10 = new Date(2026, 0, 10);
    const feb01 = new Date(2026, 1, 1);
    const now = new Date(2026, 0, 14);

    await db.insert(incomes).values([
      {
        id: 'i-jan',
        amount: 1000,
        description: 'Jan income',
        category: 'salary',
        date: jan10,
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'i-feb',
        amount: 2000,
        description: 'Feb income',
        category: 'salary',
        date: feb01,
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const queryMonth = new Date(2026, 0, 15); // Jan
    const startOfMonth = new Date(queryMonth.getFullYear(), queryMonth.getMonth(), 1);
    const startOfNextMonth = new Date(queryMonth.getFullYear(), queryMonth.getMonth() + 1, 1);

    const rows = await db
      .select()
      .from(incomes)
      .where(and(gte(incomes.date, startOfMonth), lt(incomes.date, startOfNextMonth)))
      .orderBy(desc(incomes.date));

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('i-jan');
    expect(rows[0].date).toBeInstanceOf(Date);
  });

  it('enforces FK: expenses.installment_group_id must exist when provided', async () => {
    const { db } = await createTestDb();
    const now = new Date(2026, 0, 14);

    // Create group
    await db.insert(installmentGroups).values({
      id: 'g-1',
      name: 'Laptop',
      totalAmount: 100,
      totalPayments: 2,
      startDate: new Date(2026, 0, 1),
      createdAt: now,
    });

    // Valid FK insert
    await db.insert(expenses).values({
      id: 'e-ok',
      amount: 50,
      description: 'ok',
      category: 'misc',
      date: new Date(2026, 0, 2),
      type: 'INSTALLMENT',
      installmentGroupId: 'g-1',
      installmentNumber: 1,
      createdAt: now,
      updatedAt: now,
    });

    const ok = await db.select().from(expenses).where(eq(expenses.id, 'e-ok'));
    expect(ok).toHaveLength(1);

    // Invalid FK insert should throw
    await expect(
      db.insert(expenses).values({
        id: 'e-bad',
        amount: 50,
        description: 'bad',
        category: 'misc',
        date: new Date(2026, 0, 3),
        type: 'INSTALLMENT',
        installmentGroupId: 'missing',
        installmentNumber: 2,
        createdAt: now,
        updatedAt: now,
      })
    ).rejects.toBeTruthy();
  });

  it('installment flow: inserting generated installments and querying by month includes last-day times', async () => {
    const { db } = await createTestDb();
    const now = new Date(2026, 0, 14, 12, 0, 0);

    // Create installment group (like the app)
    await db.insert(installmentGroups).values({
      id: 'g-2',
      name: 'Phone',
      totalAmount: 10,
      totalPayments: 3,
      startDate: new Date(2026, 0, 31),
      createdAt: now,
    });

    // First payment is on Jan 31 at 23:00 (previous code could accidentally exclude this from January)
    const firstPaymentDate = new Date(2026, 0, 31, 23, 0, 0);

    const expensesToInsert = buildInstallmentExpenses({
      groupId: 'g-2',
      group: { totalAmount: 10, totalPayments: 3 },
      category: 'טלפון',
      description: 'מכשיר',
      firstPaymentDate,
      now,
      uuid: (() => {
        let n = 0;
        return () => `e-g2-${++n}`;
      })(),
      roundingStrategy: 'distribute_remainder',
    });

    await db.insert(expenses).values(expensesToInsert);

    // Query January
    const jan = new Date(2026, 0, 15);
    const janStart = new Date(jan.getFullYear(), jan.getMonth(), 1);
    const febStart = new Date(jan.getFullYear(), jan.getMonth() + 1, 1);

    const janRows = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, janStart), lt(expenses.date, febStart)))
      .orderBy(desc(expenses.date));

    expect(janRows).toHaveLength(1);
    expect(janRows[0].date).toEqual(firstPaymentDate);
    expect(janRows[0].installmentNumber).toBe(1);

    // Query February
    const feb = new Date(2026, 1, 15);
    const febStart2 = new Date(feb.getFullYear(), feb.getMonth(), 1);
    const marStart = new Date(feb.getFullYear(), feb.getMonth() + 1, 1);

    const febRows = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, febStart2), lt(expenses.date, marStart)))
      .orderBy(desc(expenses.date));

    expect(febRows).toHaveLength(1);
    expect(febRows[0].installmentNumber).toBe(2);
  });
});

