import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, List, useTheme, Button, ProgressBar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BudgetService } from '@/services/budget.service';
import { TransactionService } from '@/services/transaction.service';
import {
  EXPENSE_CATEGORY_GROUP_MAP,
  FIXED_EXPENSE_CATEGORY_GROUPS,
  VARIABLE_EXPENSE_CATEGORY_GROUPS,
} from '@/constants/categories';
import { MonthSelector } from '@/components/MonthSelector';
import { addMonths, startOfMonth } from 'date-fns';

type GroupSummary = {
  title: string;
  categories: string[];
  budget: number;
  actual: number;
};

export default function BudgetStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [selectedGroup, setSelectedGroup] = useState<GroupSummary | null>(null);
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalActual, setTotalActual] = useState(0);
  const [categoryBudgetMap, setCategoryBudgetMap] = useState<Record<string, number>>({});
  const [categoryActualMap, setCategoryActualMap] = useState<Record<string, number>>({});

  const mergedGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    const all = [...FIXED_EXPENSE_CATEGORY_GROUPS, ...VARIABLE_EXPENSE_CATEGORY_GROUPS];
    all.forEach((group) => {
      const existing = map.get(group.title) ?? [];
      map.set(group.title, [...existing, ...group.items]);
    });
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      items: Array.from(new Set(items)),
    }));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fixed, variable, incomes, expenses] = await Promise.all([
        BudgetService.getFixedBudgets(),
        BudgetService.getVariableBudgetsByMonth(selectedMonth),
        BudgetService.getIncomeBudgets(),
        TransactionService.getExpensesByMonth(selectedMonth),
      ]);

      const budgetByCategory: Record<string, number> = {};
      fixed.forEach((b) => {
        budgetByCategory[b.category] = (budgetByCategory[b.category] ?? 0) + b.amount;
      });
      variable.forEach((b) => {
        budgetByCategory[b.category] = (budgetByCategory[b.category] ?? 0) + b.amount;
      });

      const actualByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        actualByCategory[e.category] = (actualByCategory[e.category] ?? 0) + e.amount;
      });

      const summaries: GroupSummary[] = mergedGroups.map((group) => {
        const categories = group.items;
        const budget = categories.reduce((sum, c) => sum + (budgetByCategory[c] ?? 0), 0);
        const actual = categories.reduce((sum, c) => sum + (actualByCategory[c] ?? 0), 0);
        return { title: group.title, categories, budget, actual };
      });

      // Uncategorized categories
      const knownCategories = new Set(Object.keys(EXPENSE_CATEGORY_GROUP_MAP));
      const extraCategories = new Set([
        ...Object.keys(budgetByCategory),
        ...Object.keys(actualByCategory),
      ]);
      const uncategorized = Array.from(extraCategories).filter((c) => !knownCategories.has(c));
      if (uncategorized.length > 0) {
        const budget = uncategorized.reduce((sum, c) => sum + (budgetByCategory[c] ?? 0), 0);
        const actual = uncategorized.reduce((sum, c) => sum + (actualByCategory[c] ?? 0), 0);
        summaries.push({ title: 'לא משויך', categories: uncategorized, budget, actual });
      }

      const totalBudgetValue = summaries.reduce((sum, s) => sum + s.budget, 0);
      const totalActualValue = summaries.reduce((sum, s) => sum + s.actual, 0);
      const incomeSum = incomes.reduce((sum, i) => sum + i.amount, 0);

      setGroupSummaries(summaries);
      setIncomeTotal(incomeSum);
      setTotalBudget(totalBudgetValue);
      setTotalActual(totalActualValue);
      setCategoryBudgetMap(budgetByCategory);
      setCategoryActualMap(actualByCategory);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedMonth])
  );

  const renderSummaryCard = () => {
    const remaining = totalBudget - totalActual;
    const isOver = remaining < 0;
    const ratio = totalBudget > 0 ? Math.min(totalActual / totalBudget, 1) : 0;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          מצב תקציב חודשי
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
          הכנסה מתוכננת: ₪{incomeTotal.toLocaleString()}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.colors.onSurface }}>תקציב</Text>
          <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
            ₪{totalBudget.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.colors.onSurface }}>בוצע</Text>
          <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
            ₪{totalActual.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.colors.onSurface }}>נותר</Text>
          <Text style={{ color: isOver ? theme.colors.error : theme.colors.primary, fontWeight: 'bold' }}>
            ₪{remaining.toLocaleString()}
          </Text>
        </View>
        <ProgressBar
          progress={ratio}
          color={isOver ? theme.colors.error : theme.colors.primary}
          style={styles.progress}
        />
      </View>
    );
  };

  const renderGroupList = () => (
    <View style={styles.section}>
      {groupSummaries.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>אין תקציבים להצגה</Text>
      ) : (
        groupSummaries.map((group) => {
          const remaining = group.budget - group.actual;
          const isOver = remaining < 0;
          const ratio = group.budget > 0 ? Math.min(group.actual / group.budget, 1) : 0;
          return (
            <List.Item
              key={group.title}
              title={group.title}
              description={`תקציב ₪${group.budget.toLocaleString()} • בוצע ₪${group.actual.toLocaleString()}`}
              onPress={() => setSelectedGroup(group)}
              right={() => (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: isOver ? theme.colors.error : theme.colors.primary, fontWeight: 'bold' }}>
                    ₪{remaining.toLocaleString()}
                  </Text>
                </View>
              )}
              left={(props) => <List.Icon {...props} icon="folder" color={theme.colors.primary} />}
              style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            />
          );
        })
      )}
    </View>
  );

  const renderSelectedGroup = () => {
    if (!selectedGroup) return null;
    const categoryRows = selectedGroup.categories
      .map((category) => ({
        category,
        budget: categoryBudgetMap[category] ?? 0,
        actual: categoryActualMap[category] ?? 0,
      }))
      .filter((row) => row.budget > 0 || row.actual > 0);
    return (
      <View style={styles.section}>
        <Button mode="outlined" onPress={() => setSelectedGroup(null)} style={{ marginBottom: 12 }}>
          חזרה לקבוצות
        </Button>
        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
          {selectedGroup.title}
        </Text>
        {categoryRows.length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>אין נתונים בקבוצה זו</Text>
        ) : (
          categoryRows.map((row) => {
            const remaining = row.budget - row.actual;
            const isOver = remaining < 0;
            const ratio = row.budget > 0 ? Math.min(row.actual / row.budget, 1) : 0;
            return (
              <List.Item
                key={row.category}
                title={row.category}
                description={`תקציב ₪${row.budget.toLocaleString()} • בוצע ₪${row.actual.toLocaleString()}`}
                onPress={() =>
                  router.push({
                    pathname: '/budget-status-transactions',
                    params: {
                      category: row.category,
                      month: selectedMonth.toISOString(),
                    },
                  })
                }
                right={() => (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: isOver ? theme.colors.error : theme.colors.primary, fontWeight: 'bold' }}>
                      ₪{remaining.toLocaleString()}
                    </Text>
                    <Text style={{ color: theme.colors.outline }}>
                      {row.budget > 0 ? `${Math.round((row.actual / row.budget) * 100)}%` : ''}
                    </Text>
                  </View>
                )}
                left={(props) => <List.Icon {...props} icon="tag" color={theme.colors.primary} />}
                style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
              />
            );
          })
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <Text variant="headlineSmall" style={styles.header}>
          מצב תקציב
        </Text>

        <MonthSelector
          date={selectedMonth}
          onNext={() => setSelectedMonth((d) => startOfMonth(addMonths(d, 1)))}
          onPrev={() => setSelectedMonth((d) => startOfMonth(addMonths(d, -1)))}
        />

        {renderSummaryCard()}

        <Divider style={{ marginVertical: 12 }} />

        {selectedGroup ? renderSelectedGroup() : renderGroupList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
  summaryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progress: { marginTop: 8, height: 6, borderRadius: 6 },
  section: { gap: 8 },
  listItem: {
    padding: 12,
    borderRadius: 10,
  },
});
