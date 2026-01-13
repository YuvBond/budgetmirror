import { CategorySelector } from '@/components/CategorySelector';
import { INCOME_CATEGORIES } from '@/constants/categories';
import { TransactionService } from '@/services/transaction.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';

export default function AddIncomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || !category) {
      alert('נא להזין סכום וקטגוריה');
      return;
    }

    setLoading(true);
    try {
      await TransactionService.addIncome({
        amount: Number(amount),
        description,
        category,
        date: date,
        isRecurring: isRecurring,
      });
      router.back();
    } catch (error) {
      console.error(error);
      alert('שגיאה בשמירת הכנסה');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: 'הוספת הכנסה' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          label="סכום (₪)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Affix text="₪" />}
        />

        <Pressable onPress={() => setShowCategoryPicker(true)}>
          <View pointerEvents="none">
            <TextInput
              label="קטגוריה"
              value={category}
              editable={false}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </View>
        </Pressable>

        <TextInput
          label="תיאור (אופציונלי)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
        />

        <Button 
          mode="outlined" 
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          {date.toLocaleDateString('he-IL')}
        </Button>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <View style={styles.switchContainer}>
          <Text variant="bodyLarge">הכנסה קבועה?</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        <Button 
          mode="contained" 
          onPress={handleSave} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          שמור הכנסה
        </Button>
      </ScrollView>

      <CategorySelector
        visible={showCategoryPicker}
        onDismiss={() => setShowCategoryPicker(false)}
        onSelect={setCategory}
        categories={INCOME_CATEGORIES}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
