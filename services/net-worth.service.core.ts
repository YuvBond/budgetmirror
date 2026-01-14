import { assets, liabilities } from '@/db/schema';
import { NewAsset, NewLiability } from '@/types/domain';
import { desc } from 'drizzle-orm';

type DbLike = any;

export function createNetWorthService(deps: { db: DbLike; uuid: () => string }) {
  const { db, uuid } = deps;

  return {
    async getAssets() {
      return await db.select().from(assets).orderBy(desc(assets.updatedAt));
    },

    async addAsset(asset: Omit<NewAsset, 'id' | 'updatedAt'> & Partial<Pick<NewAsset, 'date'>>) {
      const now = new Date();
      const newAsset: NewAsset = { ...asset, id: uuid(), updatedAt: now, date: asset.date ?? now } as NewAsset;
      return await db.insert(assets).values(newAsset).returning();
    },

    async getLiabilities() {
      return await db.select().from(liabilities).orderBy(desc(liabilities.updatedAt));
    },

    async addLiability(
      liability: Omit<NewLiability, 'id' | 'updatedAt'> & Partial<Pick<NewLiability, 'date'>>
    ) {
      const now = new Date();
      const newLiability: NewLiability = {
        ...liability,
        id: uuid(),
        updatedAt: now,
        date: liability.date ?? now,
      } as NewLiability;
      return await db.insert(liabilities).values(newLiability).returning();
    },

    async calculateNetWorth() {
      const allAssets = await this.getAssets();
      const allLiabilities = await this.getLiabilities();
      const totalAssets = allAssets.reduce((sum: number, item: any) => sum + item.amount, 0);
      const totalLiabilities = allLiabilities.reduce((sum: number, item: any) => sum + item.amount, 0);
      return totalAssets - totalLiabilities;
    },
  };
}

