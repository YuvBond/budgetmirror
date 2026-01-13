import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Icon } from 'react-native-paper';

interface Props {
  balance: number;
  income: number;
  expenses: number;
}

export function DashboardSummaryCard({ balance, income, expenses }: Props) {
  const theme = useTheme();
  const isPositive = balance >= 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.outline }}>
          מאזן חודשי
        </Text>
        <Text
          variant="displayMedium"
          style={{
            fontWeight: 'bold',
            color: isPositive ? theme.colors.primary : theme.colors.error,
            marginVertical: 8,
          }}
        >
          ₪{balance.toLocaleString()}
        </Text>
        
        <View style={styles.badgeContainer}>
           <View style={[
             styles.badge, 
             { backgroundColor: isPositive ? theme.colors.secondaryContainer : theme.colors.errorContainer }
           ]}>
             <Text style={{ 
               color: isPositive ? theme.colors.onSecondaryContainer : theme.colors.onErrorContainer,
               fontWeight: 'bold'
             }}>
               {isPositive ? 'עודף' : 'גירעון'}
             </Text>
           </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <StatItem
            label="הכנסות"
            amount={income}
            icon="arrow-down"
            color="green"
          />
          <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant }} />
          <StatItem
            label="הוצאות"
            amount={expenses}
            icon="arrow-up"
            color="red"
          />
        </View>
      </Card.Content>
    </Card>
  );
}

function StatItem({ label, amount, icon, color }: { label: string, amount: number, icon: string, color: string }) {
  return (
    <View style={styles.statItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon source={icon} size={16} color={color} />
        <Text variant="bodySmall">{label}</Text>
      </View>
      <Text variant="titleLarge" style={{ fontWeight: 'bold', color }}>
        ₪{amount.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  badgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0', // better to use theme colors usually
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});
