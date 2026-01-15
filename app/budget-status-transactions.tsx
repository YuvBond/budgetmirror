import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionService } from '@/services/transaction.service';
import { format, isToday, isYesterday } from 'date-fns';

export default function BudgetStatusTransactionsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ category?: string; month?: string }>();
  const category = params.category ?? '';
  const monthDate = useMemo(() => (params.month ? new Date(params.month) : new Date()), [params.month]);
  const [sections, setSections] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const expenses = await TransactionService.getExpensesByMonth(monthDate);
      const filtered = expenses.filter((e) => e.category === category);
      const grouped = filtered.reduce((acc: any, item) => {
        const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {});

      const sectionData = Object.keys(grouped).map((dateKey) => ({
        title: dateKey,
        data: grouped[dateKey],
      }));
      setSections(sectionData);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [category, params.month]);

  const renderHeader = ({ section: { title } }: any) => {
    const date = new Date(title);
    let label = format(date, 'dd/MM/yyyy');
    if (isToday(date)) label = 'היום';
    if (isYesterday(date)) label = 'אתמול';

    return (
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.outline }}>
          {label}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: any) => (
    <List.Item
      title={item.description || item.category}
      description={format(new Date(item.date), 'HH:mm')}
      right={() => (
        <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>
          ₪{item.amount.toLocaleString()}
        </Text>
      )}
      left={(props) => <List.Icon {...props} icon="cash-minus" color={theme.colors.error} />}
      style={[styles.item, { backgroundColor: theme.colors.surface }]}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ title: `תנועות: ${category}` }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 24 }}>
            אין תנועות בקטגוריה זו לחודש הנבחר
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    marginBottom: 1,
  },
});
