import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { TextInput, Button, useTheme, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { TransactionService } from '@/services/transaction.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { CategorySelector } from '@/components/CategorySelector';
import {
  FIXED_EXPENSE_CATEGORY_GROUPS,
  VARIABLE_EXPENSE_CATEGORY_GROUPS,
} from '@/constants/categories';

export default function AddExpenseScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [type, setType] = useState('FIXED'); // FIXED, VARIABLE, INSTALLMENT
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  
  // Installment specific
  const [installments, setInstallments] = useState('2');
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categoryGroups = type === 'FIXED' ? FIXED_EXPENSE_CATEGORY_GROUPS : VARIABLE_EXPENSE_CATEGORY_GROUPS;

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || !category) {
      alert('נא להזין סכום וקטגוריה');
      return;
    }

    setLoading(true);
    try {
      if (type === 'INSTALLMENT') {
        const totalAmount = Number(amount);
        const totalPayments = Number(installments);
        
        await TransactionService.addInstallmentExpense(
          {
            name: description || category,
            totalAmount: totalAmount,
            totalPayments: totalPayments,
            startDate: date,
          },
          category,
          description,
          date
        );
      } else {
        await TransactionService.addExpense({
          amount: Number(amount),
          description,
          category,
          date: date,
          type: type,
          installmentGroupId: null,
          installmentNumber: null,
        });
      }
      router.back();
    } catch (error) {
      console.error(error);
      alert('שגיאה בשמירת הוצאה');
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
      <Stack.Screen options={{ title: 'הוספת הוצאה' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <SegmentedButtons
          value={type}
          onValueChange={(val) => {
            setType(val);
            setCategory(''); // Reset category on type change
          }}
          buttons={[
            { value: 'FIXED', label: 'קבועה' },
            { value: 'VARIABLE', label: 'משתנה' },
            { value: 'INSTALLMENT', label: 'תשלומים' },
          ]}
          style={styles.segmentedButton}
        />

        <TextInput
          label={type === 'INSTALLMENT' ? 'סכום כולל (₪)' : 'סכום (₪)'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Affix text="₪" />}
        />

        {type === 'INSTALLMENT' && (
          <TextInput
            label="מספר תשלומים"
            value={installments}
            onChangeText={setInstallments}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
          />
        )}

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

        <Button 
          mode="contained" 
          onPress={handleSave} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          שמור הוצאה
        </Button>
      </ScrollView>

      <CategorySelector
        visible={showCategoryPicker}
        onDismiss={() => setShowCategoryPicker(false)}
        onSelect={setCategory}
        groupedCategories={categoryGroups}
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
  segmentedButton: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
