import { combineAndSortTransactions } from '@/services/transaction-combine-sort';

describe('combineAndSortTransactions', () => {
  it('combines incomes + expenses, marks isIncome, and sorts by date desc', () => {
    const incomes = [
      { id: 'i1', date: new Date(2026, 0, 10), amount: 1 },
      { id: 'i2', date: new Date(2026, 0, 12), amount: 2 },
    ];
    const expenses = [
      { id: 'e1', date: new Date(2026, 0, 11), amount: 3 },
      { id: 'e2', date: new Date(2026, 0, 13), amount: 4 },
    ];

    const result = combineAndSortTransactions(incomes, expenses, 100);

    expect(result.map((t) => ({ id: (t as any).id, isIncome: (t as any).isIncome }))).toEqual([
      { id: 'e2', isIncome: false },
      { id: 'i2', isIncome: true },
      { id: 'e1', isIncome: false },
      { id: 'i1', isIncome: true },
    ]);
  });

  it('applies limit after sorting', () => {
    const incomes = [{ id: 'i1', date: new Date(2026, 0, 1) }];
    const expenses = [
      { id: 'e1', date: new Date(2026, 0, 3) },
      { id: 'e2', date: new Date(2026, 0, 2) },
    ];

    const result = combineAndSortTransactions(incomes, expenses, 2);
    expect(result.map((t) => (t as any).id)).toEqual(['e1', 'e2']);
  });
});

