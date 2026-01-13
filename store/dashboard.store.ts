import { create } from 'zustand';
import { TransactionService } from '@/services/transaction.service';
import { NetWorthService } from '@/services/net-worth.service';
import { MissingInputsService } from '@/services/missing-inputs.service';
import { FinancialCalculator } from '@/utils/financial-calculator';
import { addMonths, subMonths } from 'date-fns';
import { Expense, Income } from '@/types/domain';

interface DashboardState {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  alerts: string[];
  isLoading: boolean;
  selectedDate: Date;
  rawExpenses: Expense[];
  rawIncomes: Income[]; // Added
  
  refreshDashboard: () => Promise<void>;
  nextMonth: () => void;
  prevMonth: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  netWorth: 0,
  alerts: [],
  isLoading: true,
  selectedDate: new Date(),
  rawExpenses: [],
  rawIncomes: [], // Added

  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      const { selectedDate } = get();
      
      // Fetch Raw Data
      const [incomes, expenses, assets, liabilities, alerts] = await Promise.all([
        TransactionService.getIncomesByMonth(selectedDate),
        TransactionService.getExpensesByMonth(selectedDate),
        NetWorthService.getAssets(),
        NetWorthService.getLiabilities(),
        MissingInputsService.check(selectedDate),
      ]);

      // Use Calculation Engine
      const monthlySummary = FinancialCalculator.calculateMonthlySummary(incomes, expenses);
      const netWorthSummary = FinancialCalculator.calculateNetWorth(assets, liabilities);

      set({
        monthlyIncome: monthlySummary.totalIncome,
        monthlyExpenses: monthlySummary.totalExpenses,
        currentBalance: monthlySummary.balance,
        netWorth: netWorthSummary.netWorth,
        alerts,
        rawExpenses: expenses,
        rawIncomes: incomes, // Added
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      set({ isLoading: false });
    }
  },

  nextMonth: () => {
    set((state) => ({ selectedDate: addMonths(state.selectedDate, 1) }));
    get().refreshDashboard();
  },

  prevMonth: () => {
    set((state) => ({ selectedDate: subMonths(state.selectedDate, 1) }));
    get().refreshDashboard();
  },
}));
