import { FinancialCalculator } from '@/utils/financial-calculator';

describe('FinancialCalculator', () => {
  it('calculateNetWorth sums assets/liabilities and returns netWorth', () => {
    const assets = [{ amount: 100 }, { amount: 250 }] as any;
    const liabilities = [{ amount: 80 }] as any;

    expect(FinancialCalculator.calculateNetWorth(assets, liabilities)).toEqual({
      totalAssets: 350,
      totalLiabilities: 80,
      netWorth: 270,
    });
  });

  it('calculateMonthlySummary returns totals, balance and savings rate', () => {
    const incomes = [{ amount: 1000 }] as any;
    const expenses = [{ amount: 400 }] as any;

    const summary = FinancialCalculator.calculateMonthlySummary(incomes, expenses);
    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalExpenses).toBe(400);
    expect(summary.balance).toBe(600);
    expect(summary.savingsRate).toBeCloseTo(60, 5);
  });

  it('calculateExpenseRatio treats INSTALLMENT as fixed', () => {
    const expenses = [
      { amount: 100, type: 'FIXED' },
      { amount: 50, type: 'VARIABLE' },
      { amount: 25, type: 'INSTALLMENT' },
    ] as any;

    const ratio = FinancialCalculator.calculateExpenseRatio(expenses);

    expect(ratio.fixed).toBe(125);
    expect(ratio.variable).toBe(50);
    expect(ratio.total).toBe(175);
    expect(ratio.fixedRatio).toBeCloseTo((125 / 175) * 100, 5);
    expect(ratio.variableRatio).toBeCloseTo((50 / 175) * 100, 5);
  });
});

