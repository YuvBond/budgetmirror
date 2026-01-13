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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium">שווי נקי כולל</Text>
            <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              ₪{netWorth.toLocaleString()}
            </Text>
            <View style={styles.row}>
              <View>
                <Text variant="bodySmall">סה״כ נכסים</Text>
                <Text variant="titleMedium" style={{ color: 'green' }}>
                  ₪{totalAssets.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text variant="bodySmall">סה״כ התחייבויות</Text>
                <Text variant="titleMedium" style={{ color: 'red' }}>
                  ₪{totalLiabilities.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Assets List */}
        <List.Section>
          <List.Subheader style={styles.subheader}>נכסים</List.Subheader>
          {assets.length === 0 ? (
            <Text style={styles.emptyText}>אין נכסים רשומים</Text>
          ) : (
            assets.map((asset) => (
              <List.Item
                key={asset.id}
                title={asset.name}
                description={format(new Date(asset.updatedAt), 'dd/MM/yyyy')}
                right={() => <Text style={styles.amountText}>₪{asset.amount.toLocaleString()}</Text>}
                left={(props) => <List.Icon {...props} icon="bank" color="green" />}
                style={styles.listItem}
              />
            ))
          )}
        </List.Section>

        <Divider />

        {/* Liabilities List */}
        <List.Section>
          <List.Subheader style={styles.subheader}>התחייבויות</List.Subheader>
          {liabilities.length === 0 ? (
            <Text style={styles.emptyText}>אין התחייבויות רשומות</Text>
          ) : (
            liabilities.map((liability) => (
              <List.Item
                key={liability.id}
                title={liability.name}
                description={format(new Date(liability.updatedAt), 'dd/MM/yyyy')}
                right={() => <Text style={styles.amountText}>₪{liability.amount.toLocaleString()}</Text>}
                left={(props) => <List.Icon {...props} icon="credit-card-outline" color="red" />}
                style={styles.listItem}
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
            style: { backgroundColor: '#4caf50' },
            onPress: () => router.push('/assets/add-asset'),
          },
          {
            icon: 'credit-card-plus',
            label: 'הוסף התחייבות',
            style: { backgroundColor: '#f44336' },
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  subheader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listItem: {
    backgroundColor: 'white',
    marginBottom: 1,
  },
  amountText: {
    fontWeight: 'bold',
    alignSelf: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 16,
  },
});
