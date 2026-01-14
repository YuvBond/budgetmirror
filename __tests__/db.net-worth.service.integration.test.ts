import { createTestDb } from '@/db/test-db';
import { createNetWorthService } from '@/services/net-worth.service.core';

describe('DB integration: NetWorthService (core)', () => {
  it('add/get assets+liabilities and calculateNetWorth work end-to-end', async () => {
    const { db } = await createTestDb();
    let n = 0;
    const svc = createNetWorthService({ db, uuid: () => `uuid-${++n}` });

    await svc.addAsset({
      name: 'עו״ש',
      amount: 1000,
      type: 'LIQUID',
      date: new Date(2026, 0, 10),
    });

    await svc.addLiability({
      name: 'הלוואה',
      amount: 250,
      type: 'LOAN',
      date: new Date(2026, 0, 11),
    });

    const assets = await svc.getAssets();
    const liabilities = await svc.getLiabilities();

    expect(assets).toHaveLength(1);
    expect(liabilities).toHaveLength(1);

    const netWorth = await svc.calculateNetWorth();
    expect(netWorth).toBe(750);
  });
});

