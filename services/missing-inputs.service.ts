import { TransactionService } from './transaction.service';
import { NetWorthService } from './net-worth.service';
import { createMissingInputsService } from '@/services/missing-inputs.service.core';

export const MissingInputsService = createMissingInputsService({
  transactionService: TransactionService,
  netWorthService: NetWorthService,
});
