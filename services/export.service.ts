import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { Asset } from 'expo-asset';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import {
  injectExpensesIntoTemplateWorkbook,
  TemplateExpenseLike,
} from '@/services/export-template-fill';

export const ExportService = {
  async exportToExcel() {
    try {
      console.log("Starting export (Template mode)...");

      // 1. Load Template
      const asset = Asset.fromModule(require('@/assets/template.xlsx'));
      await asset.downloadAsync(); // Ensure it's available locally
      
      const templateUri = asset.localUri || asset.uri;
      const fileContent = await FileSystem.readAsStringAsync(templateUri, {
        encoding: 'base64'
      });
      
      const workbook = XLSX.read(fileContent, { type: 'base64', cellFormula: true, cellStyles: true });

      // 2. Fetch Data
      const allExpenses = await db.select().from(expenses);

      // 3. Inject Data
      injectExpensesIntoTemplateWorkbook(workbook, allExpenses as unknown as TemplateExpenseLike[]);

      // 6. Write File
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.documentDirectory + "BudgetMirror_Export.xlsx";
      
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: 'base64'
      });

      // 7. Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Budget Data',
          UTI: 'com.microsoft.excel.xlsx'
        });
      } else {
        alert("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Export failed detailed:", error);
      alert(`Export failed: ${error}`);
    }
  }
};
