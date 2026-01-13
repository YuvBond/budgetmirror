import { Asset, Liability, Income, Expense } from '@/types/domain';

export const FinancialCalculator = {
  /**
   * Calculates Total Net Worth
   */
  calculateNetWorth(assets: Asset[], liabilities: Liability[]) {
    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  },

  /**
   * Calculates Monthly Summary
   */
  calculateMonthlySummary(incomes: Income[], expenses: Expense[]) {
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    };
  },

  /**
   * Calculates Fixed vs Variable Expense Ratio
   */
  calculateExpenseRatio(expenses: Expense[]) {
    const fixed = expenses.filter(e => e.type === 'FIXED').reduce((sum, e) => sum + e.amount, 0);
    const variable = expenses.filter(e => e.type === 'VARIABLE').reduce((sum, e) => sum + e.amount, 0);
    const installments = expenses.filter(e => e.type === 'INSTALLMENT').reduce((sum, e) => sum + e.amount, 0);
    
    const total = fixed + variable + installments;
    
    // Treat installments as Fixed usually, or separate category?
    // For ratio "Fixed vs Variable", usually Installments count as committed/fixed obligations.
    const totalFixed = fixed + installments; 
    
    return {
      fixed: totalFixed,
      variable: variable,
      total: total,
      fixedRatio: total > 0 ? (totalFixed / total) * 100 : 0,
      variableRatio: total > 0 ? (variable / total) * 100 : 0,
    };
  },
};
