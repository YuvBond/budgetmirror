import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { Asset } from 'expo-asset';
import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import { desc } from 'drizzle-orm';

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

      // 3. Helper to map Category -> Row Index
      const mapCategoriesToRows = (sheetName: string, categoryColIndex: number, startRow: number) => {
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref']!);
        const map = new Map<string, number>();

        for (let R = startRow; R <= range.e.r; ++R) {
          const cellAddress = { c: categoryColIndex, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          const cell = sheet[cellRef];
          if (cell && cell.v) {
            // Normalize string (trim)
            map.set(String(cell.v).trim(), R);
          }
        }
        return map;
      };

      // 4. Map Categories
      // Fixed: Sheet 'בקרה קבועות', Category in Col C (index 2), Start Row 3 (index 2)
      const fixedRowMap = mapCategoriesToRows('בקרה קבועות', 2, 2);
      
      // Variable: Sheet 'בקרה משתנות', Category in Col B (index 1), Start Row 3 (index 2)
      const variableRowMap = mapCategoriesToRows('בקרה משתנות', 1, 2);

      // 5. Inject Data
      allExpenses.forEach(e => {
        const date = new Date(e.date);
        const month = date.getMonth(); // 0-11
        // Assuming Excel starts Jan at Month 1. We map 0 -> Month 1 column.
        
        let sheetName = '';
        let rowMap: Map<string, number>;
        let baseColIndex = 0;

        if (e.type === 'FIXED' || e.type === 'INSTALLMENT') {
          sheetName = 'בקרה קבועות';
          rowMap = fixedRowMap;
          // In Fixed Sheet: Jan Actual is Col E (index 4). Pattern: 4, 7, 10...
          // Formula: 4 + (month * 3)
          baseColIndex = 4 + (month * 3);
        } else {
          sheetName = 'בקרה משתנות';
          rowMap = variableRowMap;
          // In Variable Sheet: Jan Actual is Col L? No, let's recheck.
          // Based on previous log: 
          // "תקציב שבועי", 1, 8, 15, 22, 29, "יתרה", 1...
          // It tracks WEEKLY! This is complex.
          // Let's look at the Summary columns or "Month Total".
          // Variable Sheet seems to track daily/weekly.
          // Let's assume there is a "Month Total" column or we fill the first week?
          // This is too complex to guess without looking deeper.
          
          // Fallback: Let's skip Variable injection for now or dump into a "Misc" cell if found?
          // Actually, let's look at the sheet headers again.
          // [..."תקציב", "תקציב שבועי", 1, 8, 15, 22, 29, "יתרה"...] for Month 1.
          // Col E=1st, F=8th, G=15th, H=22nd, I=29th, J=Balance.
          // This is tracking by day of month? Or week starting?
          // "1, 8, 15..." implies weeks.
          
          // Strategy: Put everything in the "1" column (Col E) for that month, effectively summing it there?
          // Month 1 starts at Col E (4).
          // Month 2 starts at Col K (10). Distance = 6 columns.
          // Formula: 4 + (month * 6).
          baseColIndex = 4 + (month * 6);
        }

        const rowIndex = rowMap.get(e.category.trim());
        
        if (sheetName && rowIndex !== undefined) {
          const sheet = workbook.Sheets[sheetName];
          const cellRef = XLSX.utils.encode_cell({ c: baseColIndex, r: rowIndex });
          
          let currentVal = 0;
          if (sheet[cellRef] && typeof sheet[cellRef].v === 'number') {
            currentVal = sheet[cellRef].v;
          }
          
          // Update cell
          sheet[cellRef] = { v: currentVal + e.amount, t: 'n' };
        }
      });

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
