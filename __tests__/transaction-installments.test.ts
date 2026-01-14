import { buildInstallmentExpenses } from '@/services/transaction-installments';

describe('buildInstallmentExpenses', () => {
  it('creates N installment expenses with correct dates, amounts, numbering, and descriptions', () => {
    const now = new Date(2026, 0, 14, 12, 0, 0);
    const firstPaymentDate = new Date(2026, 0, 5);

    let counter = 0;
    const uuid = () => `id-${++counter}`;

    const result = buildInstallmentExpenses({
      groupId: 'group-1',
      group: { totalAmount: 1200, totalPayments: 3 },
      category: 'קטגוריה',
      description: 'מחשב',
      firstPaymentDate,
      now,
      uuid,
    });

    expect(result).toHaveLength(3);

    // amount per payment
    expect(result[0].amount).toBe(400);
    expect(result[1].amount).toBe(400);
    expect(result[2].amount).toBe(400);

    // ids and group linkage
    expect(result.map((r) => r.id)).toEqual(['id-1', 'id-2', 'id-3']);
    expect(result.every((r) => r.installmentGroupId === 'group-1')).toBe(true);

    // dates increment monthly
    expect(result[0].date).toEqual(new Date(2026, 0, 5));
    expect(result[1].date).toEqual(new Date(2026, 1, 5));
    expect(result[2].date).toEqual(new Date(2026, 2, 5));

    // numbering and description suffix
    expect(result.map((r) => r.installmentNumber)).toEqual([1, 2, 3]);
    expect(result.map((r) => r.description)).toEqual(['מחשב (1/3)', 'מחשב (2/3)', 'מחשב (3/3)']);

    // timestamps
    expect(result.every((r) => r.createdAt === now)).toBe(true);
    expect(result.every((r) => r.updatedAt === now)).toBe(true);

    // type
    expect(result.every((r) => r.type === 'INSTALLMENT')).toBe(true);
  });

  it('adjust_last: keeps first payments equal and adjusts the last to match total (cents-safe)', () => {
    const now = new Date(2026, 0, 14, 12, 0, 0);
    const firstPaymentDate = new Date(2026, 0, 5);

    const result = buildInstallmentExpenses({
      groupId: 'group-1',
      group: { totalAmount: 100, totalPayments: 3 },
      category: 'קטגוריה',
      description: 'בדיקה',
      firstPaymentDate,
      now,
      uuid: () => 'id',
      roundingStrategy: 'adjust_last',
    });

    const amounts = result.map((r) => r.amount);
    expect(amounts).toEqual([33.33, 33.33, 33.34]);
    expect(amounts.reduce((s, a) => s + a, 0)).toBeCloseTo(100, 10);
  });

  it('distribute_remainder: distributes leftover cents across early payments (sum matches total)', () => {
    const now = new Date(2026, 0, 14, 12, 0, 0);
    const firstPaymentDate = new Date(2026, 0, 5);

    const result = buildInstallmentExpenses({
      groupId: 'group-1',
      group: { totalAmount: 10, totalPayments: 3 },
      category: 'קטגוריה',
      description: 'בדיקה',
      firstPaymentDate,
      now,
      uuid: () => 'id',
      roundingStrategy: 'distribute_remainder',
    });

    const amounts = result.map((r) => r.amount);
    expect(amounts).toEqual([3.34, 3.33, 3.33]);
    expect(amounts.reduce((s, a) => s + a, 0)).toBeCloseTo(10, 10);
  });
});

