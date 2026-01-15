import { fixedBudgets, variableBudgets, incomeBudgets, expenses } from '@/db/schema';
import { NewFixedBudget, NewVariableBudget, NewIncomeBudget } from '@/types/domain';
import { and, eq, desc } from 'drizzle-orm';
import { startOfMonth, addMonths } from 'date-fns';

type DbLike = any;

const toMonthStart = (date: Date) => startOfMonth(date);

export function createBudgetService(deps: { db: DbLike; uuid: () => string }) {
  const { db, uuid } = deps;

  return {
    // Fixed budgets
    async getFixedBudgets() {
      return await db.select().from(fixedBudgets).orderBy(desc(fixedBudgets.updatedAt));
    },

    async getFixedBudgetById(id: string) {
      const rows = await db.select().from(fixedBudgets).where(eq(fixedBudgets.id, id));
      return rows[0] ?? null;
    },

    async addFixedBudget(data: Omit<NewFixedBudget, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date();
      const row: NewFixedBudget = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      return await db.insert(fixedBudgets).values(row).returning();
    },

    async updateFixedBudget(id: string, data: Partial<Omit<NewFixedBudget, 'id' | 'createdAt'>>) {
      return await db
        .update(fixedBudgets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fixedBudgets.id, id))
        .returning();
    },

    async deleteFixedBudget(id: string) {
      await db.delete(fixedBudgets).where(eq(fixedBudgets.id, id));
    },

    // Variable budgets
    async getVariableBudgetsByMonth(month: Date) {
      const monthStart = toMonthStart(month);
      return await db
        .select()
        .from(variableBudgets)
        .where(eq(variableBudgets.month, monthStart))
        .orderBy(desc(variableBudgets.updatedAt));
    },

    async getVariableBudgetById(id: string) {
      const rows = await db.select().from(variableBudgets).where(eq(variableBudgets.id, id));
      return rows[0] ?? null;
    },

    async addVariableBudget(data: Omit<NewVariableBudget, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date();
      const row: NewVariableBudget = {
        ...data,
        month: toMonthStart(new Date(data.month)),
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      return await db.insert(variableBudgets).values(row).returning();
    },

    async updateVariableBudget(id: string, data: Partial<Omit<NewVariableBudget, 'id' | 'createdAt'>>) {
      const next = { ...data } as any;
      if (data.month) next.month = toMonthStart(new Date(data.month));
      return await db
        .update(variableBudgets)
        .set({ ...next, updatedAt: new Date() })
        .where(eq(variableBudgets.id, id))
        .returning();
    },

    async deleteVariableBudget(id: string) {
      await db.delete(variableBudgets).where(eq(variableBudgets.id, id));
    },

    async copyCarryOverBudgetsToMonth(targetMonth: Date) {
      const targetStart = toMonthStart(targetMonth);
      const prevStart = toMonthStart(addMonths(targetStart, -1));

      const [carryOver, existing] = await Promise.all([
        db
          .select()
          .from(variableBudgets)
          .where(and(eq(variableBudgets.month, prevStart), eq(variableBudgets.carryToNextMonth, true))),
        db.select().from(variableBudgets).where(eq(variableBudgets.month, targetStart)),
      ]);

      const existingCategories = new Set(existing.map((b: any) => b.category));
      const toInsert = carryOver.filter((b: any) => !existingCategories.has(b.category));

      if (toInsert.length === 0) return [];

      const now = new Date();
      const rows: NewVariableBudget[] = toInsert.map((b: any) => ({
        id: uuid(),
        category: b.category,
        amount: b.amount,
        month: targetStart,
        carryToNextMonth: b.carryToNextMonth,
        note: b.note,
        createdAt: now,
        updatedAt: now,
      }));

      return await db.insert(variableBudgets).values(rows).returning();
    },

    // Income budgets
    async getIncomeBudgets() {
      return await db.select().from(incomeBudgets).orderBy(desc(incomeBudgets.updatedAt));
    },

    async getIncomeBudgetById(id: string) {
      const rows = await db.select().from(incomeBudgets).where(eq(incomeBudgets.id, id));
      return rows[0] ?? null;
    },

    async addIncomeBudget(data: Omit<NewIncomeBudget, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date();
      const row: NewIncomeBudget = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      };
      return await db.insert(incomeBudgets).values(row).returning();
    },

    async updateIncomeBudget(id: string, data: Partial<Omit<NewIncomeBudget, 'id' | 'createdAt'>>) {
      return await db
        .update(incomeBudgets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(incomeBudgets.id, id))
        .returning();
    },

    async deleteIncomeBudget(id: string) {
      await db.delete(incomeBudgets).where(eq(incomeBudgets.id, id));
    },

    // Optional helper: create an expense from a fixed budget
    async createExpenseFromFixedBudget(params: {
      category: string;
      amount: number;
      date: Date;
      description?: string;
    }) {
      const now = new Date();
      await db.insert(expenses).values({
        id: uuid(),
        amount: params.amount,
        description: params.description ?? null,
        category: params.category,
        date: params.date,
        type: 'FIXED',
        installmentGroupId: null,
        installmentNumber: null,
        createdAt: now,
        updatedAt: now,
      });
    },
  };
}
