import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
}

export function MonthSelector({ date, onNext, onPrev }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Right Arrow (Previous Month in RTL timeline logic?) 
          Actually, let's keep it simple: 
          Right Arrow = Next Month (Future)
          Left Arrow = Previous Month (Past)
          Regardless of RTL, time flows left-to-right on most charts, 
          but usually Right is Forward.
      */}
      
      <IconButton 
        icon="chevron-right" 
        onPress={onNext}
        accessibilityLabel="חודש הבא"
        testID="month-selector-next"
        iconColor={theme.colors.primary}
      />
      
      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
        {format(date, 'MMMM yyyy', { locale: he })}
      </Text>

      <IconButton 
        icon="chevron-left" 
        onPress={onPrev}
        accessibilityLabel="חודש קודם"
        testID="month-selector-prev"
        iconColor={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
    elevation: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
