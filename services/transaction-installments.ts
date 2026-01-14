import { addMonths } from 'date-fns';
import { NewExpense } from '@/types/domain';

export type InstallmentGroupLike = {
  totalAmount: number;
  totalPayments: number;
};

export type InstallmentRoundingStrategy = 'adjust_last' | 'distribute_remainder';

export type BuildInstallmentExpensesArgs = {
  groupId: string;
  group: InstallmentGroupLike;
  category: string;
  description: string;
  firstPaymentDate: Date;
  now: Date;
  uuid: () => string;
  roundingStrategy?: InstallmentRoundingStrategy;
};

function splitAmountToPayments(
  totalAmount: number,
  totalPayments: number,
  roundingStrategy: InstallmentRoundingStrategy
): number[] {
  // Work in cents to avoid floating point drift
  const totalCents = Math.round(totalAmount * 100);

  if (totalPayments <= 0) return [];

  if (roundingStrategy === 'distribute_remainder') {
    const base = Math.floor(totalCents / totalPayments);
    const remainder = totalCents % totalPayments;
    // First `remainder` payments get +1 cent
    return Array.from({ length: totalPayments }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
  }

  // adjust_last:
  // First N-1 payments are the same rounded cents (nearest cent), last is adjusted to match total exactly.
  const base = Math.round(totalCents / totalPayments);
  const amounts: number[] = [];
  for (let i = 0; i < totalPayments - 1; i++) amounts.push(base / 100);
  const last = (totalCents - base * (totalPayments - 1)) / 100;
  amounts.push(last);
  return amounts;
}

export function buildInstallmentExpenses({
  groupId,
  group,
  category,
  description,
  firstPaymentDate,
  now,
  uuid,
  roundingStrategy = 'adjust_last',
}: BuildInstallmentExpensesArgs): NewExpense[] {
  const amounts = splitAmountToPayments(group.totalAmount, group.totalPayments, roundingStrategy);

  const expensesToInsert: NewExpense[] = [];
  for (let i = 0; i < group.totalPayments; i++) {
    const paymentDate = addMonths(firstPaymentDate, i);

    expensesToInsert.push({
      id: uuid(),
      amount: amounts[i],
      description: `${description} (${i + 1}/${group.totalPayments})`,
      category,
      date: paymentDate,
      type: 'INSTALLMENT',
      installmentGroupId: groupId,
      installmentNumber: i + 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  return expensesToInsert;
}

