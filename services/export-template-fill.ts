import XLSX from 'xlsx';

export type TemplateExpenseLike = {
  amount: number;
  category: string;
  date: Date | string;
  type: 'FIXED' | 'VARIABLE' | 'INSTALLMENT' | (string & {});
};

export function mapCategoriesToRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
  categoryColIndex: number,
  startRow: number
) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) return new Map<string, number>();

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const map = new Map<string, number>();

  for (let R = startRow; R <= range.e.r; ++R) {
    const cellRef = XLSX.utils.encode_cell({ c: categoryColIndex, r: R });
    const cell = sheet[cellRef];
    if (cell && (cell as any).v != null) {
      map.set(String((cell as any).v).trim(), R);
    }
  }
  return map;
}

export function injectExpensesIntoTemplateWorkbook(
  workbook: XLSX.WorkBook,
  allExpenses: TemplateExpenseLike[]
) {
  // Fixed: Sheet 'בקרה קבועות', Category in Col C (index 2), Start Row 3 (index 2)
  const fixedRowMap = mapCategoriesToRows(workbook, 'בקרה קבועות', 2, 2);
  // Variable: Sheet 'בקרה משתנות', Category in Col B (index 1), Start Row 3 (index 2)
  const variableRowMap = mapCategoriesToRows(workbook, 'בקרה משתנות', 1, 2);

  allExpenses.forEach((e) => {
    const date = new Date(e.date);
    const month = date.getMonth(); // 0-11

    let sheetName = '';
    let rowMap: Map<string, number>;
    let baseColIndex = 0;

    if (e.type === 'FIXED' || e.type === 'INSTALLMENT') {
      sheetName = 'בקרה קבועות';
      rowMap = fixedRowMap;
      // In Fixed Sheet: Jan Actual is Col E (index 4). Pattern: 4, 7, 10...
      baseColIndex = 4 + month * 3;
    } else {
      sheetName = 'בקרה משתנות';
      rowMap = variableRowMap;
      // Variable sheet is weekly; for MVP we inject into the "1" (first week) column per month.
      // Month 1 starts at Col E (4). Month 2 starts at Col K (10). Distance = 6 columns.
      baseColIndex = 4 + month * 6;
    }

    const rowIndex = rowMap.get(e.category.trim());
    if (!sheetName || rowIndex === undefined) return;

    const sheet = workbook.Sheets[sheetName];
    const cellRef = XLSX.utils.encode_cell({ c: baseColIndex, r: rowIndex });

    let currentVal = 0;
    if (sheet[cellRef] && typeof (sheet[cellRef] as any).v === 'number') {
      currentVal = (sheet[cellRef] as any).v;
    }

    sheet[cellRef] = { v: currentVal + e.amount, t: 'n' } as any;
  });
}

