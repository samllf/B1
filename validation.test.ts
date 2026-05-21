import { describe, it, expect } from 'vitest';
import {
  validateRevenueEntry,
  validateRevenueEntries,
  validateProjectForm,
  formatAmount,
  formatNumber,
} from '../utils/validation';
import type { RevenueEntry } from '../types/index';

describe('validateRevenueEntry', () => {
  it('should return error for empty stall name', () => {
    const entry: RevenueEntry = {
      stallName: '',
      breakfastAmount: 0, breakfastOrders: 0,
      lunchAmount: 0, lunchOrders: 0,
      dinnerAmount: 0, dinnerOrders: 0,
      supperAmount: 0, supperOrders: 0,
      takeoutAmount: 0, takeoutOrders: 0,
    };
    const errors = validateRevenueEntry(entry, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('stallName');
    expect(errors[0].message).toContain('档口名称');
  });

  it('should return error for negative amount', () => {
    const entry: RevenueEntry = {
      stallName: '川味轩',
      breakfastAmount: -100,
      breakfastOrders: 0,
      lunchAmount: 0, lunchOrders: 0,
      dinnerAmount: 0, dinnerOrders: 0,
      supperAmount: 0, supperOrders: 0,
      takeoutAmount: 0, takeoutOrders: 0,
    };
    const errors = validateRevenueEntry(entry, 0);
    expect(errors.some(e => e.field === 'breakfastAmount')).toBe(true);
  });

  it('should pass for valid entry', () => {
    const entry: RevenueEntry = {
      stallName: '川味轩',
      breakfastAmount: 500, breakfastOrders: 20,
      lunchAmount: 800, lunchOrders: 35,
      dinnerAmount: 0, dinnerOrders: 0,
      supperAmount: 0, supperOrders: 0,
      takeoutAmount: 300, takeoutOrders: 15,
    };
    const errors = validateRevenueEntry(entry, 0);
    expect(errors).toHaveLength(0);
  });
});

describe('validateRevenueEntries', () => {
  it('should return error for empty array', () => {
    const errors = validateRevenueEntries([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('至少添加一条');
  });

  it('should return errors for multiple invalid entries', () => {
    const entries: RevenueEntry[] = [
      { stallName: '', breakfastAmount: 0, breakfastOrders: -5, lunchAmount: 0, lunchOrders: 0, dinnerAmount: 0, dinnerOrders: 0, supperAmount: 0, supperOrders: 0, takeoutAmount: 0, takeoutOrders: 0 },
      { stallName: '粤鲜美', breakfastAmount: -10, breakfastOrders: 0, lunchAmount: 0, lunchOrders: 0, dinnerAmount: 0, dinnerOrders: 0, supperAmount: 0, supperOrders: 0, takeoutAmount: 0, takeoutOrders: 0 },
    ];
    const errors = validateRevenueEntries(entries);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateProjectForm', () => {
  it('should return errors for empty fields', () => {
    const errors = validateProjectForm({ name: '', location: '', date: '' });
    expect(errors.name).toBeDefined();
    expect(errors.location).toBeDefined();
    expect(errors.date).toBeDefined();
  });

  it('should return no errors for valid form', () => {
    const errors = validateProjectForm({
      name: '测试项目',
      location: '深圳',
      date: '2026-05-21',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('formatAmount', () => {
  it('should format amount with ¥ symbol', () => {
    expect(formatAmount(1234.5)).toContain('¥');
    expect(formatAmount(0)).toContain('¥');
  });

  it('should include 2 decimal places', () => {
    const result = formatAmount(100);
    expect(result).toContain('.00');
  });
});

describe('formatNumber', () => {
  it('should format large numbers with commas', () => {
    const result = formatNumber(1234567);
    expect(result).toContain(',');
  });
});
