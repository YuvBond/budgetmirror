import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { BudgetService } from '@/services/budget.service';
import { CategorySelector } from '@/components/CategorySelector';
import { VARIABLE_EXPENSE_CATEGORY_GROUPS } from '@/constants/categories';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AddVariableBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [carry, setCarry] = useState(true);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (params.month) {
      setMonth(startOfMonth(new Date(params.month)));
    }
  }, [params.month]);

  useEffect(() => {
    if (!params.id) return;
    BudgetService.getVariableBudgetById(params.id).then((row) => {
      if (!row) return;
      setCategory(row.category);
      setAmount(String(row.amount));
      setNote(row.note ?? '');
      setCarry(Boolean(row.carryToNextMonth));
      setMonth(startOfMonth(new Date(row.month)));
    });
  }, [params.id]);

  const handleSave = async () => {
    if (!category || isNaN(Number(amount))) {
      alert('נא להזין קטגוריה וסכום');
      return;
    }
    setLoading(true);
    try {
      if (params.id) {
        await BudgetService.updateVariableBudget(params.id, {
          category,
          amount: Number(amount),
          note,
          carryToNextMonth: carry,
          month,
        });
      } else {
        await BudgetService.addVariableBudget({
          category,
          amount: Number(amount),
          note,
          carryToNextMonth: carry,
          month,
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: params.id ? 'עריכת תקציב משתנה' : 'תקציב משתנה חדש' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
          חודש: {format(month, 'LLLL yyyy', { locale: he })}
        </Text>

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
          label="הערה (אופציונלי)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.row}>
          <Text>לשמור גם לחודש הבא</Text>
          <Switch value={carry} onValueChange={setCarry} />
        </View>

        <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>
          שמור
        </Button>
      </ScrollView>

      <CategorySelector
        visible={showCategoryPicker}
        onDismiss={() => setShowCategoryPicker(false)}
        onSelect={setCategory}
        groupedCategories={VARIABLE_EXPENSE_CATEGORY_GROUPS}
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
