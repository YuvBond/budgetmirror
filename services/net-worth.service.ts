import { db } from '@/db/client';
import { assets, liabilities } from '@/db/schema';
import { NewAsset, NewLiability } from '@/types/domain';
import { eq, desc } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export const NetWorthService = {
  // Assets
  async getAssets() {
    // For MVP, just get all current assets (latest snapshot logic can be added later)
    return await db.select().from(assets).orderBy(desc(assets.updatedAt));
  },

  async addAsset(asset: Omit<NewAsset, 'id' | 'updatedAt'>) {
    const now = new Date();
    const newAsset: NewAsset = {
      ...asset,
      id: Crypto.randomUUID(),
      updatedAt: now,
    };
    return await db.insert(assets).values(newAsset).returning();
  },

  // Liabilities
  async getLiabilities() {
    return await db.select().from(liabilities).orderBy(desc(liabilities.updatedAt));
  },

  async addLiability(liability: Omit<NewLiability, 'id' | 'updatedAt'>) {
    const now = new Date();
    const newLiability: NewLiability = {
      ...liability,
      id: Crypto.randomUUID(),
      updatedAt: now,
    };
    return await db.insert(liabilities).values(newLiability).returning();
  },

  async calculateNetWorth() {
    const allAssets = await this.getAssets();
    const allLiabilities = await this.getLiabilities();

    const totalAssets = allAssets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = allLiabilities.reduce((sum, item) => sum + item.amount, 0);

    return totalAssets - totalLiabilities;
  }
};
