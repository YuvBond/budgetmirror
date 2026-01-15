import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, useTheme } from 'react-native-paper';

interface Props {
  amount: number;
}

export function NetWorthCard({ amount }: Props) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Icon source="wallet" size={24} color={theme.colors.onSecondaryContainer} />
          <Text
            variant="titleMedium"
            style={{ fontWeight: 'bold', marginLeft: 8, color: theme.colors.onSecondaryContainer }}
          >
            שווי נקי
          </Text>
        </View>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>
          ₪{amount.toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
