import { db } from '@/db/client';
import * as Crypto from 'expo-crypto';
import { createNetWorthService } from '@/services/net-worth.service.core';

export const NetWorthService = createNetWorthService({
  db,
  uuid: () => Crypto.randomUUID(),
});
