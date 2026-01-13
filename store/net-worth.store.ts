import { create } from 'zustand';
import { NetWorthService } from '@/services/net-worth.service';
import { Asset, Liability } from '@/types/domain';

interface NetWorthState {
  assets: Asset[];
  liabilities: Liability[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  isLoading: boolean;
  
  loadData: () => Promise<void>;
}

export const useNetWorthStore = create<NetWorthState>((set, get) => ({
  assets: [],
  liabilities: [],
  totalAssets: 0,
  totalLiabilities: 0,
  netWorth: 0,
  isLoading: true,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [assets, liabilities] = await Promise.all([
        NetWorthService.getAssets(),
        NetWorthService.getLiabilities(),
      ]);

      const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
      const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);

      set({
        assets,
        liabilities,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load net worth data', error);
      set({ isLoading: false });
    }
  },
}));
