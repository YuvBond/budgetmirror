import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB, useTheme, Card, Divider, List, IconButton } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetWorthStore } from '@/store/net-worth.store';
import { format } from 'date-fns';

export default function AssetsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { 
    assets, 
    liabilities, 
    totalAssets, 
    totalLiabilities, 
    netWorth,
    isLoading, 
    loadData 
  } = useNetWorthStore();
  
  const [fabOpen, setFabOpen] = useState(false);
  const assetColor = theme.dark ? '#81C784' : '#2E7D32';
  const liabilityColor = theme.dark ? '#EF9A9A' : '#C62828';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        <Text variant="headlineMedium" style={styles.header}>
          נכסים והתחייבויות
        </Text>

        {/* Summary Card */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium">שווי נקי כולל</Text>
            <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              ₪{netWorth.toLocaleString()}
            </Text>
            <View style={styles.row}>
              <View>
                <Text variant="bodySmall">סה״כ נכסים</Text>
                <Text variant="titleMedium" style={{ color: assetColor }}>
                  ₪{totalAssets.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text variant="bodySmall">סה״כ התחייבויות</Text>
                <Text variant="titleMedium" style={{ color: liabilityColor }}>
                  ₪{totalLiabilities.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Assets List */}
        <List.Section>
          <List.Subheader style={[styles.subheader, { color: theme.colors.onSurface }]}>נכסים</List.Subheader>
          {assets.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>אין נכסים רשומים</Text>
          ) : (
            assets.map((asset) => (
              <List.Item
                key={asset.id}
                title={asset.name}
                description={format(new Date(asset.updatedAt), 'dd/MM/yyyy')}
                right={() => <Text style={[styles.amountText, { color: theme.colors.onSurface }]}>₪{asset.amount.toLocaleString()}</Text>}
                left={(props) => <List.Icon {...props} icon="bank" color={assetColor} />}
                style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
              />
            ))
          )}
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

        {/* Liabilities List */}
        <List.Section>
          <List.Subheader style={[styles.subheader, { color: theme.colors.onSurface }]}>התחייבויות</List.Subheader>
          {liabilities.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>אין התחייבויות רשומות</Text>
          ) : (
            liabilities.map((liability) => (
              <List.Item
                key={liability.id}
                title={liability.name}
                description={format(new Date(liability.updatedAt), 'dd/MM/yyyy')}
                right={() => <Text style={[styles.amountText, { color: theme.colors.onSurface }]}>₪{liability.amount.toLocaleString()}</Text>}
                left={(props) => <List.Icon {...props} icon="credit-card-outline" color={liabilityColor} />}
                style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
              />
            ))
          )}
        </List.Section>

      </ScrollView>

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'bank-plus',
            label: 'הוסף נכס',
            style: { backgroundColor: theme.colors.secondaryContainer },
            color: theme.colors.onSecondaryContainer,
            onPress: () => router.push('/assets/add-asset'),
          },
          {
            icon: 'credit-card-plus',
            label: 'הוסף התחייבות',
            style: { backgroundColor: theme.colors.errorContainer },
            color: theme.colors.onErrorContainer,
            onPress: () => router.push('/assets/add-liability'),
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  subheader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
    marginBottom: 1,
  },
  amountText: {
    fontWeight: 'bold',
    alignSelf: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
