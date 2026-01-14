import { MissingInputsService } from '@/services/missing-inputs.service';
import { TransactionService } from '@/services/transaction.service';
import { NetWorthService } from '@/services/net-worth.service';

jest.mock('@/services/transaction.service', () => ({
  TransactionService: {
    getExpensesByMonth: jest.fn(),
    getIncomesByMonth: jest.fn(),
  },
}));

jest.mock('@/services/net-worth.service', () => ({
  NetWorthService: {
    getAssets: jest.fn(),
  },
}));

describe('MissingInputsService.check', () => {
  const getExpensesByMonth = TransactionService.getExpensesByMonth as unknown as jest.Mock;
  const getIncomesByMonth = TransactionService.getIncomesByMonth as unknown as jest.Mock;
  const getAssets = NetWorthService.getAssets as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('alerts when no expenses this week and no income this month', async () => {
    getExpensesByMonth.mockResolvedValue([]);
    getIncomesByMonth.mockResolvedValue([]);
    getAssets.mockResolvedValue([]);

    const alerts = await MissingInputsService.check(new Date(2026, 0, 14));

    expect(alerts).toEqual(['לא עודכנו הוצאות השבוע', 'לא הוגדרה הכנסה החודש']);
  });

  it('does not alert about weekly expenses if there is an expense on startOfWeek or later', async () => {
    // 2026-01-14 is Wednesday. startOfWeek (Sunday) is 2026-01-11.
    const date = new Date(2026, 0, 14);
    const expenseOnSunday = { date: new Date(2026, 0, 11) } as any;

    getExpensesByMonth.mockResolvedValue([expenseOnSunday]);
    getIncomesByMonth.mockResolvedValue([{ id: '1' }]);
    getAssets.mockResolvedValue([]);

    const alerts = await MissingInputsService.check(date);
    expect(alerts).toEqual([]);
  });

  it('alerts about assets if assets exist but none updated this month', async () => {
    getExpensesByMonth.mockResolvedValue([{ date: new Date(2026, 0, 12) }]);
    getIncomesByMonth.mockResolvedValue([{ id: '1' }]);
    getAssets.mockResolvedValue([
      { updatedAt: new Date(2025, 11, 31) }, // previous month/year
    ]);

    const alerts = await MissingInputsService.check(new Date(2026, 0, 14));
    expect(alerts).toEqual(['לא עודכן שווי נכסים החודש']);
  });
});

