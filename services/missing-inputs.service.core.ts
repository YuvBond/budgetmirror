import { isSameMonth, subDays, isAfter, startOfDay } from 'date-fns';

type TransactionLike = {
  date: Date;
};

type AssetLike = {
  updatedAt: Date;
};

export function createMissingInputsService(deps: {
  transactionService: {
    getExpensesByMonth: (date: Date) => Promise<TransactionLike[]>;
    getIncomesByMonth: (date: Date) => Promise<any[]>;
  };
  netWorthService: {
    getAssets: () => Promise<AssetLike[]>;
  };
}) {
  const { transactionService, netWorthService } = deps;

  return {
    async check(date: Date = new Date()): Promise<string[]> {
      const alerts: string[] = [];

      // 1. Check for expenses this week (Israel: week starts Sunday)
      const expenses = await transactionService.getExpensesByMonth(date);
      const dayOfWeek = date.getDay(); // 0 = Sunday
      const startOfWeek = subDays(date, dayOfWeek);

      const hasExpensesThisWeek = expenses.some(
        (e) =>
          isAfter(e.date, startOfDay(startOfWeek)) ||
          e.date.getTime() === startOfDay(startOfWeek).getTime()
      );

      if (!hasExpensesThisWeek) {
        alerts.push('לא עודכנו הוצאות השבוע');
      }

      // 2. Check if Income is defined for this month
      const incomes = await transactionService.getIncomesByMonth(date);
      if (incomes.length === 0) {
        alerts.push('לא הוגדרה הכנסה החודש');
      }

      // 3. Check for Asset updates this month
      const assets = await netWorthService.getAssets();
      const hasAssetUpdate = assets.some((a) => isSameMonth(a.updatedAt, date));
      if (assets.length > 0 && !hasAssetUpdate) {
        alerts.push('לא עודכן שווי נכסים החודש');
      }

      return alerts;
    },
  };
}

