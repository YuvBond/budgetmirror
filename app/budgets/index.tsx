import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, FAB, SegmentedButtons, List, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { addMonths, format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { BudgetService } from '@/services/budget.service';
import { MonthSelector } from '@/components/MonthSelector';

type TabKey = 'FIXED' | 'VARIABLE' | 'INCOME';

export default function BudgetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('FIXED');
  const [loading, setLoading] = useState(false);
  const [fixedBudgets, setFixedBudgets] = useState<any[]>([]);
  const [variableBudgets, setVariableBudgets] = useState<any[]>([]);
  const [incomeBudgets, setIncomeBudgets] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(addMonths(new Date(), 1)));

  const loadData = async () => {
    setLoading(true);
    try {
      const [fixed, variable, income] = await Promise.all([
        BudgetService.getFixedBudgets(),
        BudgetService.getVariableBudgetsByMonth(selectedMonth),
        BudgetService.getIncomeBudgets(),
      ]);
      setFixedBudgets(fixed);
      setVariableBudgets(variable);
      setIncomeBudgets(income);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedMonth])
  );

  const handleDelete = (id: string, kind: TabKey) => {
    Alert.alert('מחיקה', 'למחוק פריט זה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          if (kind === 'FIXED') await BudgetService.deleteFixedBudget(id);
          if (kind === 'VARIABLE') await BudgetService.deleteVariableBudget(id);
          if (kind === 'INCOME') await BudgetService.deleteIncomeBudget(id);
          loadData();
        },
      },
    ]);
  };

  const handleCopyFromPrevMonth = async () => {
    await BudgetService.copyCarryOverBudgetsToMonth(selectedMonth);
    loadData();
  };

  const renderFixed = () => (
    <View style={styles.section}>
      {fixedBudgets.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>אין תקציבי קבועות</Text>
      ) : (
        fixedBudgets.map((item) => (
          <List.Item
            key={item.id}
            title={item.category}
            description={`בכל חודש, יום ${item.dayOfMonth}${item.note ? ` • ${item.note}` : ''}`}
            right={() => (
              <View style={styles.rightRow}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  ₪{item.amount.toLocaleString()}
                </Text>
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDelete(item.id, 'FIXED')}
                />
              </View>
            )}
            onPress={() => router.push({ pathname: '/budgets/add-fixed', params: { id: item.id } })}
            left={(props) => <List.Icon {...props} icon="lock" color={theme.colors.primary} />}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 6 }}
          />
        ))
      )}
    </View>
  );

  const renderVariable = () => (
    <View style={styles.section}>
      <MonthSelector
        date={selectedMonth}
        onNext={() => setSelectedMonth((d) => startOfMonth(addMonths(d, 1)))}
        onPrev={() => setSelectedMonth((d) => startOfMonth(addMonths(d, -1)))}
      />

      <Button mode="outlined" onPress={handleCopyFromPrevMonth} style={{ marginBottom: 12 }}>
        העתק תקציב מהחודש הקודם
      </Button>

      {variableBudgets.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>אין תקציבי משתנות לחודש זה</Text>
      ) : (
        variableBudgets.map((item) => (
          <List.Item
            key={item.id}
            title={item.category}
            description={`${format(new Date(item.month), 'LLLL yyyy', { locale: he })}${
              item.note ? ` • ${item.note}` : ''
            }${item.carryToNextMonth ? ' • נשמר לחודש הבא' : ''}`}
            right={() => (
              <View style={styles.rightRow}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  ₪{item.amount.toLocaleString()}
                </Text>
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDelete(item.id, 'VARIABLE')}
                />
              </View>
            )}
            onPress={() => router.push({ pathname: '/budgets/add-variable', params: { id: item.id } })}
            left={(props) => <List.Icon {...props} icon="repeat" color={theme.colors.secondary} />}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 6 }}
          />
        ))
      )}
    </View>
  );

  const renderIncome = () => (
    <View style={styles.section}>
      {incomeBudgets.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>אין תקציבי הכנסה</Text>
      ) : (
        incomeBudgets.map((item) => (
          <List.Item
            key={item.id}
            title={item.category}
            description={`בכל חודש, יום ${item.dayOfMonth}${item.note ? ` • ${item.note}` : ''}`}
            right={() => (
              <View style={styles.rightRow}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  ₪{item.amount.toLocaleString()}
                </Text>
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDelete(item.id, 'INCOME')}
                />
              </View>
            )}
            onPress={() => router.push({ pathname: '/budgets/add-income', params: { id: item.id } })}
            left={(props) => <List.Icon {...props} icon="cash" color={theme.colors.primary} />}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 6 }}
          />
        ))
      )}
    </View>
  );

  const handleFabPress = () => {
    if (tab === 'FIXED') router.push('/budgets/add-fixed');
    if (tab === 'VARIABLE')
      router.push({
        pathname: '/budgets/add-variable',
        params: { month: selectedMonth.toISOString() },
      });
    if (tab === 'INCOME') router.push('/budgets/add-income');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <Text variant="headlineSmall" style={styles.header}>
          תקציב חודשי
        </Text>

        <SegmentedButtons
          value={tab}
          onValueChange={(value) => setTab(value as TabKey)}
          buttons={[
            { value: 'FIXED', label: 'קבועות' },
            { value: 'VARIABLE', label: 'משתנות' },
            { value: 'INCOME', label: 'הכנסות' },
          ]}
          style={styles.segmented}
        />

        {tab === 'FIXED' && renderFixed()}
        {tab === 'VARIABLE' && renderVariable()}
        {tab === 'INCOME' && renderIncome()}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={handleFabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { textAlign: 'center', marginBottom: 12, fontWeight: 'bold' },
  segmented: { marginBottom: 16 },
  section: { gap: 8 },
  fab: { position: 'absolute', left: 16, bottom: 24 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
