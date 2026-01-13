import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, SegmentedButtons } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { NetWorthService } from '@/services/net-worth.service';

export default function AddLiabilityScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('LOAN'); // LOAN, MORTGAGE, CREDIT_CARD_DEBT
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !amount || isNaN(Number(amount))) {
      alert('נא להזין שם וסכום');
      return;
    }

    setLoading(true);
    try {
      await NetWorthService.addLiability({
        name,
        amount: Number(amount),
        type: type as any,
      });
      router.back();
    } catch (error) {
      console.error(error);
      alert('שגיאה בשמירת התחייבות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: 'הוספת התחייבות' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            { value: 'LOAN', label: 'הלוואה' },
            { value: 'MORTGAGE', label: 'משכנתא' },
            { value: 'CREDIT_CARD_DEBT', label: 'אשראי' },
          ]}
          style={styles.segmentedButton}
        />

        <TextInput
          label="שם ההתחייבות"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="יתרת חוב (₪)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Affix text="₪" />}
        />

        <Button 
          mode="contained" 
          onPress={handleSave} 
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          שמור התחייבות
        </Button>
      </ScrollView>
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
