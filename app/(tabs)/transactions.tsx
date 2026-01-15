import React, { useCallback, useState } from 'react';
import { View, StyleSheet, SectionList, RefreshControl, Alert } from 'react-native';
import { Text, List, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionService } from '@/services/transaction.service';
import { useFocusEffect } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';

export default function TransactionsScreen() {
  const theme = useTheme();
  const [sections, setSections] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const incomeColor = theme.colors.primary;
  const expenseColor = theme.colors.error;

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await TransactionService.getAllTransactions(100);
      
      // Group by Date
      const grouped = data.reduce((acc: any, item) => {
        const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
      }, {});

      const sectionData = Object.keys(grouped).map(dateKey => ({
        title: dateKey,
        data: grouped[dateKey]
      }));

      setSections(sectionData);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = (id: string, isIncome: boolean) => {
    Alert.alert(
      'מחיקת תנועה',
      'האם אתה בטוח שברצונך למחוק תנועה זו?',
      [
        { text: 'ביטול', style: 'cancel' },
        { 
          text: 'מחק', 
          style: 'destructive',
          onPress: async () => {
            await TransactionService.deleteTransaction(id, isIncome);
            loadData();
          }
        }
      ]
    );
  };

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
      title={item.category}
      description={item.description}
      left={props => (
        <List.Icon 
          {...props} 
          icon={item.isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} 
          color={item.isIncome ? incomeColor : expenseColor} 
        />
      )}
      right={props => (
        <View style={styles.rightContainer}>
          <Text 
            variant="bodyMedium" 
            style={{ 
              fontWeight: 'bold', 
              color: item.isIncome ? incomeColor : expenseColor,
              alignSelf: 'center' 
            }}
          >
            {item.isIncome ? '+' : '-'}₪{item.amount.toLocaleString()}
          </Text>
          <IconButton 
            icon="trash-can-outline" 
            size={20} 
            iconColor={theme.colors.error}
            onPress={() => handleDelete(item.id, item.isIncome)}
          />
        </View>
      )}
      style={[styles.item, { backgroundColor: theme.colors.surface }]}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Text variant="headlineMedium" style={styles.title}>היסטוריית תנועות</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    marginBottom: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
