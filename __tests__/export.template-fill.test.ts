import XLSX from 'xlsx';
import {
  injectExpensesIntoTemplateWorkbook,
  mapCategoriesToRows,
} from '@/services/export-template-fill';

describe('Export template fill helpers', () => {
  function makeWorkbook() {
    // Build minimal sheets with category columns in the expected places:
    // - Fixed sheet: category in Col C (index 2), start row index 2
    // - Variable sheet: category in Col B (index 1), start row index 2
    const fixedAoa = [
      ['h1', 'h2', 'קטגוריה'], // row 0
      ['', '', ''], // row 1
      ['', '', 'שכירות'], // row 2 (start)
      ['', '', 'חשמל'], // row 3
    ];

    const variableAoa = [
      ['h1', 'קטגוריה'], // row 0
      ['', ''], // row 1
      ['', 'אוכל'], // row 2 (start)
      ['', 'דלק'], // row 3
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fixedAoa), 'בקרה קבועות');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(variableAoa), 'בקרה משתנות');
    return wb;
  }

  it('mapCategoriesToRows returns the correct row index by category', () => {
    const wb = makeWorkbook();
    const fixed = mapCategoriesToRows(wb, 'בקרה קבועות', 2, 2);
    expect(fixed.get('שכירות')).toBe(2);
    expect(fixed.get('חשמל')).toBe(3);
  });

  it('injects FIXED expenses into fixed sheet month column (E for January)', () => {
    const wb = makeWorkbook();
    const sheet = wb.Sheets['בקרה קבועות'];

    // Pre-seed the target cell (E row 2) with a number to verify summing.
    // month=0 => colIndex=4 => "E"
    const cellRef = XLSX.utils.encode_cell({ c: 4, r: 2 });
    sheet[cellRef] = { v: 5, t: 'n' } as any;

    injectExpensesIntoTemplateWorkbook(wb, [
      {
        amount: 10,
        category: 'שכירות',
        date: new Date(2026, 0, 3),
        type: 'FIXED',
      },
    ]);

    expect((sheet[cellRef] as any).v).toBe(15);
  });

  it('injects VARIABLE expenses into variable sheet month column (E for January, K for February)', () => {
    const wb = makeWorkbook();
    const sheet = wb.Sheets['בקרה משתנות'];

    // Jan (month=0) => col E (4)
    const janCell = XLSX.utils.encode_cell({ c: 4, r: 2 });
    // Feb (month=1) => col K (10)
    const febCell = XLSX.utils.encode_cell({ c: 10, r: 2 });

    injectExpensesIntoTemplateWorkbook(wb, [
      { amount: 7, category: 'אוכל', date: new Date(2026, 0, 10), type: 'VARIABLE' },
      { amount: 11, category: 'אוכל', date: new Date(2026, 1, 10), type: 'VARIABLE' },
    ]);

    expect((sheet[janCell] as any).v).toBe(7);
    expect((sheet[febCell] as any).v).toBe(11);
  });
});

