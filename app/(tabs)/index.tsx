import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, FAB, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardStore } from '@/store/dashboard.store';
import { DashboardSummaryCard } from '@/components/DashboardSummaryCard';
import { NetWorthCard } from '@/components/NetWorthCard';
import { AlertsSection } from '@/components/AlertsSection';
import { MonthSelector } from '@/components/MonthSelector';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { 
    currentBalance, 
    monthlyIncome, 
    monthlyExpenses, 
    netWorth, 
    alerts,
    isLoading, 
    selectedDate,
    refreshDashboard,
    nextMonth,
    prevMonth
  } = useDashboardStore();

  const [fabOpen, setFabOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshDashboard} />
        }
      >
        <Text variant="headlineSmall" style={styles.header}>
          תמונת תקציב
        </Text>

        <MonthSelector 
          date={selectedDate}
          onNext={nextMonth}
          onPrev={prevMonth}
        />

        <AlertsSection alerts={alerts} />

        <DashboardSummaryCard 
          balance={currentBalance} 
          income={monthlyIncome} 
          expenses={monthlyExpenses} 
        />

        <NetWorthCard amount={netWorth} />

      </ScrollView>

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'arrow-down',
            label: 'הכנסה',
            style: { backgroundColor: '#4caf50' },
            onPress: () => router.push('/transactions/add-income'),
          },
          {
            icon: 'arrow-up',
            label: 'הוצאה',
            style: { backgroundColor: '#f44336' },
            onPress: () => router.push('/transactions/add-expense'),
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
});
