import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';

interface Props {
  alerts: string[];
}

export function AlertsSection({ alerts }: Props) {
  const theme = useTheme();

  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert, index) => (
        <View 
          key={index} 
          style={[
            styles.alertItem, 
            { 
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
            }
          ]}
        >
          <Icon source="alert-circle-outline" size={20} color={theme.colors.error} />
          <Text 
            variant="bodyMedium" 
            style={{ 
              color: theme.colors.onErrorContainer, 
              marginLeft: 8,
              flex: 1 
            }}
          >
            {alert}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
