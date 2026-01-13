import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Button, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExportService } from '@/services/export.service';

export default function SettingsScreen() {
  const theme = useTheme();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await ExportService.exportToExcel();
    setExporting(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.header}>הגדרות</Text>

        <List.Section>
          <List.Subheader>נתונים</List.Subheader>
          
          <List.Item
            title="ייצוא לאקסל"
            description="שמור את כל הנתונים בקובץ Excel"
            left={props => <List.Icon {...props} icon="microsoft-excel" />}
            right={props => (
              <Button 
                mode="outlined" 
                onPress={handleExport}
                loading={exporting}
                disabled={exporting}
              >
                ייצוא
              </Button>
            )}
          />
          
          <Divider />
          
          <List.Item
            title="מחק הכל"
            description="איפוס מלא של האפליקציה (זהירות!)"
            left={props => <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />}
            onPress={() => alert('Not implemented for safety')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>אפליקציה</List.Subheader>
          <List.Item
            title="גרסה"
            description="1.0.0 (Expo)"
            left={props => <List.Icon {...props} icon="information" />}
          />
        </List.Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
});
