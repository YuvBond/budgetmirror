import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { BudgetService } from '@/services/budget.service';
import { CategorySelector } from '@/components/CategorySelector';
import { FIXED_EXPENSE_CATEGORY_GROUPS } from '@/constants/categories';

export default function AddFixedBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [note, setNote] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [createExpense, setCreateExpense] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    BudgetService.getFixedBudgetById(params.id).then((row) => {
      if (!row) return;
      setCategory(row.category);
      setAmount(String(row.amount));
      setDayOfMonth(String(row.dayOfMonth));
      setNote(row.note ?? '');
    });
  }, [params.id]);

  const handleSave = async () => {
    if (!category || isNaN(Number(amount)) || !dayOfMonth) {
      alert('נא להזין קטגוריה, סכום ויום בחודש');
      return;
    }
    setLoading(true);
    try {
      if (params.id) {
        await BudgetService.updateFixedBudget(params.id, {
          category,
          amount: Number(amount),
          dayOfMonth: Number(dayOfMonth),
          note,
        });
      } else {
        await BudgetService.addFixedBudget({
          category,
          amount: Number(amount),
          dayOfMonth: Number(dayOfMonth),
          note,
        });
      }

      if (createExpense) {
        await BudgetService.createExpenseFromFixedBudget({
          category,
          amount: Number(amount),
          date: expenseDate,
          description: note || 'תקציב קבוע',
        });
      }

      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || expenseDate;
    setShowDatePicker(Platform.OS === 'ios');
    setExpenseDate(currentDate);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: params.id ? 'עריכת תקציב קבוע' : 'תקציב קבוע חדש' }} />
      <ScrollView contentContainerStyle={styles.container}>
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
          label="סכום חודשי (₪)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Affix text="₪" />}
        />

        <TextInput
          label="יום בחודש (1-31)"
          value={dayOfMonth}
          onChangeText={setDayOfMonth}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="הערה (אופציונלי)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.row}>
          <Text>צור הוצאה עכשיו</Text>
          <Switch value={createExpense} onValueChange={setCreateExpense} />
        </View>

        {createExpense && (
          <>
            <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.input}>
              {expenseDate.toLocaleDateString('he-IL')}
            </Button>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={expenseDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </>
        )}

        <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>
          שמור
        </Button>
      </ScrollView>

      <CategorySelector
        visible={showCategoryPicker}
        onDismiss={() => setShowCategoryPicker(false)}
        onSelect={setCategory}
        groupedCategories={FIXED_EXPENSE_CATEGORY_GROUPS}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
