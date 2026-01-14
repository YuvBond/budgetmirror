export type TransactionLike = {
  date: Date;
};

export type IncomeLike = TransactionLike & Record<string, any>;
export type ExpenseLike = TransactionLike & Record<string, any>;

export type CombinedTransaction<TIncome extends IncomeLike, TExpense extends ExpenseLike> =
  | (TIncome & { isIncome: true })
  | (TExpense & { isIncome: false });

export function combineAndSortTransactions<TIncome extends IncomeLike, TExpense extends ExpenseLike>(
  incomes: TIncome[],
  expenses: TExpense[],
  limit = 100
): CombinedTransaction<TIncome, TExpense>[] {
  const combined = [
    ...incomes.map((i) => ({ ...i, isIncome: true as const })),
    ...expenses.map((e) => ({ ...e, isIncome: false as const })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return combined.slice(0, limit);
}

