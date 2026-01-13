import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, useTheme } from 'react-native-paper';

interface Props {
  amount: number;
}

export function NetWorthCard({ amount }: Props) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Icon source="wallet" size={24} color={theme.colors.secondary} />
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginLeft: 8 }}>
            שווי נקי
          </Text>
        </View>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.secondary }}>
          ₪{amount.toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#f0f4f8', // Light blue-ish grey, usually derived from theme
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
