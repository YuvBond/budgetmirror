import { db } from '@/db/client';
import * as Crypto from 'expo-crypto';
import { createBudgetService } from '@/services/budget.service.core';

export const BudgetService = createBudgetService({
  db,
  uuid: () => Crypto.randomUUID(),
});
