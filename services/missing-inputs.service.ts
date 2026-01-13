import { TransactionService } from './transaction.service';
import { NetWorthService } from './net-worth.service';
import { isSameMonth, subDays, isAfter, startOfDay } from 'date-fns';

export const MissingInputsService = {
  async check(date: Date = new Date()): Promise<string[]> {
    const alerts: string[] = [];

    // 1. Check for expenses this week
    // We fetch this month's expenses and check if any are recent
    const expenses = await TransactionService.getExpensesByMonth(date);
    
    // Logic: check if any expense is within the last 7 days? 
    // Or prompt says "No expenses entered this week" (meaning since Sunday?)
    // In Israel, week starts Sunday.
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const startOfWeek = subDays(date, dayOfWeek);
    
    const hasExpensesThisWeek = expenses.some(e => 
      isAfter(e.date, startOfDay(startOfWeek)) || e.date.getTime() === startOfDay(startOfWeek).getTime()
    );

    if (!hasExpensesThisWeek) {
      alerts.push('לא עודכנו הוצאות השבוע');
    }

    // 2. Check if Income is defined for this month
    const incomes = await TransactionService.getIncomesByMonth(date);
    if (incomes.length === 0) {
      alerts.push('לא הוגדרה הכנסה החודש');
    }

    // 3. Check for Asset updates this month
    // We assume "Assets" are updated via snapshots. 
    // We check if any asset in the DB has an 'updatedAt' in the current month.
    const assets = await NetWorthService.getAssets();
    const hasAssetUpdate = assets.some(a => isSameMonth(a.updatedAt, date));
    
    // Only alert if there are assets but none updated? 
    // Or if user has never entered assets?
    // Prompt says: "Asset balance not updated this month"
    if (assets.length > 0 && !hasAssetUpdate) {
      alerts.push('לא עודכן שווי נכסים החודש');
    }

    return alerts;
  }
};
