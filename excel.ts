import * as XLSX from 'xlsx';
import type { RevenueRecord, MealPeriod } from '../types';
import { MEAL_PERIOD_LABELS } from '../types';

interface ExcelRow {
  '档口名称': string;
  '日期': string;
  '时段': string;
  '金额': number;
  '订单数': number;
  '小时': number;
}

export function exportToExcel(records: RevenueRecord[], filename: string): void {
  const data: ExcelRow[] = records.map(r => ({
    '档口名称': r.stallName,
    '日期': r.date,
    '时段': MEAL_PERIOD_LABELS[r.period],
    '金额': r.amount,
    '订单数': r.orderCount,
    '小时': r.hour,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '营收数据');

  // Set column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 8 },
  ];

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function importFromExcel(file: File): Promise<Omit<RevenueRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        const periodReverseMap: Record<string, MealPeriod> = {};
        Object.entries(MEAL_PERIOD_LABELS).forEach(([key, label]) => {
          periodReverseMap[label] = key as MealPeriod;
        });

        const records: Omit<RevenueRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[] = rows.map((row, idx) => {
          const periodLabel = String(row['时段'] || '');
          const period = periodReverseMap[periodLabel];
          if (!period) {
            throw new Error(`第${idx + 2}行时段"${periodLabel}"无效，有效值：${Object.values(MEAL_PERIOD_LABELS).join('、')}`);
          }

          const amount = Number(row['金额']);
          const orderCount = Number(row['订单数']);
          if (isNaN(amount) || amount < 0) throw new Error(`第${idx + 2}行金额无效`);
          if (isNaN(orderCount) || orderCount < 0) throw new Error(`第${idx + 2}行订单数无效`);

          return {
            stallName: String(row['档口名称'] || ''),
            period,
            amount,
            orderCount,
            date: String(row['日期'] || ''),
            hour: Number(row['小时']) || 0,
          };
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
