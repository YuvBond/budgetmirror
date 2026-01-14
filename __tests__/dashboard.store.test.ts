import { useDashboardStore } from '@/store/dashboard.store';
import { TransactionService } from '@/services/transaction.service';
import { NetWorthService } from '@/services/net-worth.service';
import { MissingInputsService } from '@/services/missing-inputs.service';

jest.mock('@/services/transaction.service', () => ({
  TransactionService: {
    getIncomesByMonth: jest.fn(),
    getExpensesByMonth: jest.fn(),
  },
}));

jest.mock('@/services/net-worth.service', () => ({
  NetWorthService: {
    getAssets: jest.fn(),
    getLiabilities: jest.fn(),
  },
}));

jest.mock('@/services/missing-inputs.service', () => ({
  MissingInputsService: {
    check: jest.fn(),
  },
}));

describe('useDashboardStore', () => {
  const getIncomesByMonth = TransactionService.getIncomesByMonth as unknown as jest.Mock;
  const getExpensesByMonth = TransactionService.getExpensesByMonth as unknown as jest.Mock;
  const getAssets = NetWorthService.getAssets as unknown as jest.Mock;
  const getLiabilities = NetWorthService.getLiabilities as unknown as jest.Mock;
  const check = MissingInputsService.check as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to defaults
    useDashboardStore.setState({
      currentBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netWorth: 0,
      alerts: [],
      isLoading: true,
      selectedDate: new Date(2026, 0, 15),
      rawExpenses: [],
      rawIncomes: [],
    });
  });

  it('refreshDashboard populates calculated fields and raw data', async () => {
    getIncomesByMonth.mockResolvedValue([{ amount: 1000 }]);
    getExpensesByMonth.mockResolvedValue([{ amount: 250, type: 'FIXED' }]);
    getAssets.mockResolvedValue([{ amount: 500 }]);
    getLiabilities.mockResolvedValue([{ amount: 200 }]);
    check.mockResolvedValue(['a1']);

    await useDashboardStore.getState().refreshDashboard();

    const state = useDashboardStore.getState();
    expect(state.monthlyIncome).toBe(1000);
    expect(state.monthlyExpenses).toBe(250);
    expect(state.currentBalance).toBe(750);
    expect(state.netWorth).toBe(300);
    expect(state.alerts).toEqual(['a1']);
    expect(state.rawIncomes).toHaveLength(1);
    expect(state.rawExpenses).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('nextMonth and prevMonth update selectedDate and trigger refreshDashboard', async () => {
    getIncomesByMonth.mockResolvedValue([]);
    getExpensesByMonth.mockResolvedValue([]);
    getAssets.mockResolvedValue([]);
    getLiabilities.mockResolvedValue([]);
    check.mockResolvedValue([]);

    const refreshSpy = jest.spyOn(useDashboardStore.getState(), 'refreshDashboard');

    const before = useDashboardStore.getState().selectedDate;
    useDashboardStore.getState().nextMonth();
    const afterNext = useDashboardStore.getState().selectedDate;
    expect(afterNext.getMonth()).toBe(before.getMonth() + 1);

    useDashboardStore.getState().prevMonth();
    const afterPrev = useDashboardStore.getState().selectedDate;
    expect(afterPrev.getMonth()).toBe(before.getMonth());

    // Called twice: nextMonth + prevMonth
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });
});

