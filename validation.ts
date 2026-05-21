import type { RevenueEntry } from '../types';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function validateRevenueEntry(entry: RevenueEntry, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entry.stallName || entry.stallName.trim() === '') {
    errors.push({ row: rowIndex, field: 'stallName', message: '档口名称不能为空' });
  }

  const fields: { key: keyof RevenueEntry; label: string }[] = [
    { key: 'breakfastAmount', label: '早餐金额' },
    { key: 'breakfastOrders', label: '早餐订单数' },
    { key: 'lunchAmount', label: '午餐金额' },
    { key: 'lunchOrders', label: '午餐订单数' },
    { key: 'dinnerAmount', label: '晚餐金额' },
    { key: 'dinnerOrders', label: '晚餐订单数' },
    { key: 'supperAmount', label: '夜宵金额' },
    { key: 'supperOrders', label: '夜宵订单数' },
    { key: 'takeoutAmount', label: '外卖金额' },
    { key: 'takeoutOrders', label: '外卖订单数' },
  ];

  fields.forEach(({ key, label }) => {
    const value = entry[key];
    if (typeof value === 'number' && (value < 0 || !Number.isFinite(value))) {
      errors.push({ row: rowIndex, field: key, message: `${label}必须为非负有效数字` });
    }
  });

  return errors;
}

export function validateRevenueEntries(entries: RevenueEntry[]): ValidationError[] {
  if (entries.length === 0) {
    return [{ row: -1, field: 'form', message: '请至少添加一条营收录入' }];
  }

  const allErrors: ValidationError[] = [];
  entries.forEach((entry, idx) => {
    const errors = validateRevenueEntry(entry, idx);
    allErrors.push(...errors);
  });

  return allErrors;
}

export function validateProjectForm(values: { name: string; location: string; date: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name || values.name.trim() === '') errors.name = '项目名称不能为空';
  if (!values.location || values.location.trim() === '') errors.location = '地点不能为空';
  if (!values.date) errors.date = '日期不能为空';
  return errors;
}

export function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}
