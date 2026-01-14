import { db } from '@/db/client';
import * as Crypto from 'expo-crypto';
import { createTransactionService } from '@/services/transaction.service.core';

export const TransactionService = createTransactionService({
  db,
  uuid: () => Crypto.randomUUID(),
});
