import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { BudgetService } from '@/services/budget.service';
import { CategorySelector } from '@/components/CategorySelector';
import { INCOME_CATEGORIES } from '@/constants/categories';

export default function AddIncomeBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [note, setNote] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    BudgetService.getIncomeBudgetById(params.id).then((row) => {
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
        await BudgetService.updateIncomeBudget(params.id, {
          category,
          amount: Number(amount),
          dayOfMonth: Number(dayOfMonth),
          note,
        });
      } else {
        await BudgetService.addIncomeBudget({
          category,
          amount: Number(amount),
          dayOfMonth: Number(dayOfMonth),
          note,
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: params.id ? 'עריכת תקציב הכנסה' : 'תקציב הכנסה חדש' }} />
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

        <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>
          שמור
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
});
