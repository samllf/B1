import type { Project, RevenueRecord, MealPeriod } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STALL_NAMES = ['川味轩', '粤鲜美', '湘味馆', '鲁菜坊', '苏帮菜', '闽味居', '浙食汇', '徽菜阁', '西餐厅', '日料亭', '韩食屋', '面点王'];
const PROJECT_NAMES = ['科技园A区食堂', '高新区企业餐厅', '大学城美食广场', '金融中心食堂', '产业园区餐厅'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(): number {
  return parseFloat((Math.random() * 5000 + 500).toFixed(2));
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

let projects: Project[] = PROJECT_NAMES.map((name, i) => ({
  id: uuidv4(),
  name,
  location: ['深圳', '广州', '北京', '上海', '杭州'][i],
  date: '2026-03-01',
  status: (['active', 'active', 'active', 'completed', 'paused'] as const)[i],
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
}));

let revenueRecords: RevenueRecord[] = [];

function generateHourlyRecords(projectId: string, date: string): RevenueRecord[] {
  const records: RevenueRecord[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const activeStalls = STALL_NAMES.slice(0, randomInt(3, 8));
    const periods: MealPeriod[] = [];
    if (hour >= 6 && hour <= 9) periods.push('breakfast');
    if (hour >= 11 && hour <= 13) periods.push('lunch');
    if (hour >= 17 && hour <= 19) periods.push('dinner');
    if (hour >= 20 && hour <= 23) periods.push('supper');
    if (hour >= 10 && hour <= 21) periods.push('takeout');

    if (periods.length === 0 && hour >= 3 && hour <= 5) continue;

    activeStalls.forEach(stall => {
      periods.forEach(period => {
        const orders = randomInt(5, 150);
        records.push({
          id: uuidv4(),
          projectId,
          stallName: stall,
          period,
          amount: parseFloat((orders * randomInt(15, 45)).toFixed(2)),
          orderCount: orders,
          date,
          hour,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });
  }
  return records;
}

export function initMockData(): void {
  const today = todayStr();
  projects.forEach(p => {
    if (p.status === 'active') {
      const existing = revenueRecords.filter(r => r.projectId === p.id && r.date === today);
      if (existing.length === 0) {
        revenueRecords.push(...generateHourlyRecords(p.id, today));
      }
    }
  });
}

// Add today's revenue for demo purposes
export function ensureTodayData(projectId: string): void {
  const today = todayStr();
  const hasData = revenueRecords.some(r => r.projectId === projectId && r.date === today);
  if (!hasData) {
    revenueRecords.push(...generateHourlyRecords(projectId, today));
  }
}

// Simulate real-time revenue updates
export function simulateNewRevenue(projectId: string): RevenueRecord | null {
  const now = new Date();
  const hour = now.getHours();
  const stall = STALL_NAMES[randomInt(0, STALL_NAMES.length - 1)];
  const periods: MealPeriod[] = [];
  if (hour >= 6 && hour <= 9) periods.push('breakfast');
  if (hour >= 11 && hour <= 13) periods.push('lunch');
  if (hour >= 17 && hour <= 19) periods.push('dinner');
  if (hour >= 20 && hour <= 23) periods.push('supper');
  if (hour >= 10 && hour <= 21) periods.push('takeout');

  if (periods.length === 0) return null;

  const period = periods[randomInt(0, periods.length - 1)];
  const orders = randomInt(1, 5);
  const record: RevenueRecord = {
    id: uuidv4(),
    projectId,
    stallName: stall,
    period,
    amount: parseFloat((orders * randomInt(15, 45)).toFixed(2)),
    orderCount: orders,
    date: todayStr(),
    hour,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  revenueRecords.push(record);
  return record;
}

// Mock delay
export function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));
}

// Simulated API functions
export const mockApi = {
  // Projects
  async getProjects(page: number, pageSize: number, keyword?: string) {
    await delay();
    let filtered = [...projects];
    if (keyword) {
      filtered = filtered.filter(p => p.name.includes(keyword));
    }
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);
    return { list, total, page, pageSize };
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    await delay(500);
    const project: Project = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);
    return project;
  },

  async updateProject(id: string, data: Partial<Project>) {
    await delay(400);
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('项目不存在');
    projects[idx] = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
    return projects[idx];
  },

  async deleteProject(id: string) {
    await delay(300);
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('项目不存在');
    projects.splice(idx, 1);
    revenueRecords = revenueRecords.filter(r => r.projectId !== id);
  },

  // Revenue Records
  async getRevenueRecords(projectId: string, date?: string) {
    await delay(200);
    let records = revenueRecords.filter(r => r.projectId === projectId);
    if (date) {
      records = records.filter(r => r.date === date);
    }
    return records;
  },

  async getHourlyRevenue(projectId: string, date?: string) {
    await delay(200);
    const targetDate = date || todayStr();
    const records = revenueRecords.filter(r => r.projectId === projectId && r.date === targetDate);

    const hourlyMap = new Map<number, { totalAmount: number; totalOrders: number; stalls: Map<string, { amount: number; orders: number }> }>();

    records.forEach(r => {
      if (!hourlyMap.has(r.hour)) {
        hourlyMap.set(r.hour, { totalAmount: 0, totalOrders: 0, stalls: new Map() });
      }
      const hour = hourlyMap.get(r.hour)!;
      hour.totalAmount += r.amount;
      hour.totalOrders += r.orderCount;

      if (!hour.stalls.has(r.stallName)) {
        hour.stalls.set(r.stallName, { amount: 0, orders: 0 });
      }
      const stall = hour.stalls.get(r.stallName)!;
      stall.amount += r.amount;
      stall.orders += r.orderCount;
    });

    return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      totalAmount: parseFloat(data.totalAmount.toFixed(2)),
      totalOrders: data.totalOrders,
      stalls: Array.from(data.stalls.entries()).map(([stallName, s]) => ({
        stallName,
        amount: parseFloat(s.amount.toFixed(2)),
        orders: s.orders,
      })),
    }));
  },

  async getProjectKPI(projectId: string): Promise<{ todayAmount: number; todayOrders: number; avgOrderValue: number }> {
    await delay(150);
    const today = todayStr();
    const records = revenueRecords.filter(r => r.projectId === projectId && r.date === today);
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const totalOrders = records.reduce((sum, r) => sum + r.orderCount, 0);
    return {
      todayAmount: parseFloat(totalAmount.toFixed(2)),
      todayOrders: totalOrders,
      avgOrderValue: totalOrders > 0 ? parseFloat((totalAmount / totalOrders).toFixed(2)) : 0,
    };
  },

  async batchCreateRevenue(data: { projectId: string; entries: { stallName: string; records: Omit<RevenueRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[] }[] }) {
    await delay(600);
    const newRecords: RevenueRecord[] = [];
    data.entries.forEach(entry => {
      entry.records.forEach(r => {
        newRecords.push({
          ...r,
          id: uuidv4(),
          projectId: data.projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });
    revenueRecords.push(...newRecords);
    return newRecords;
  },

  async importRecords(projectId: string, records: Omit<RevenueRecord, 'id' | 'createdAt' | 'updatedAt'>[], mode: 'overwrite' | 'append') {
    await delay(800);
    if (mode === 'overwrite') {
      const dates = [...new Set(records.map(r => r.date))];
      revenueRecords = revenueRecords.filter(r => !(r.projectId === projectId && dates.includes(r.date)));
    }

    // Check for conflicts
    const conflicts: { stallName: string; date: string; existing: RevenueRecord; incoming: RevenueRecord }[] = [];
    records.forEach(r => {
      const existing = revenueRecords.find(
        er => er.projectId === projectId && er.date === r.date && er.stallName === r.stallName && er.hour === r.hour && er.period === r.period
      );
      if (existing) {
        conflicts.push({
          stallName: r.stallName,
          date: r.date,
          existing,
          incoming: { ...r, id: '', projectId, createdAt: '', updatedAt: '' } as RevenueRecord,
        });
      }
    });

    if (conflicts.length > 0) {
      return { conflicts, inserted: [] as RevenueRecord[] };
    }

    const newRecords: RevenueRecord[] = records.map(r => ({
      ...r,
      id: uuidv4(),
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    revenueRecords.push(...newRecords);
    return { conflicts: [], inserted: newRecords };
  },

  async getRevenueByDateRange(projectId: string, startDate: string, endDate: string) {
    await delay(300);
    return revenueRecords.filter(
      r => r.projectId === projectId && r.date >= startDate && r.date <= endDate
    );
  },
};

// Expose for testing
export function getMockProjects() { return projects; }
export function getMockRecords() { return revenueRecords; }
export function resetMockData() {
  projects = PROJECT_NAMES.map((name, i) => ({
    id: uuidv4(),
    name,
    location: ['深圳', '广州', '北京', '上海', '杭州'][i],
    date: '2026-03-01',
    status: (['active', 'active', 'active', 'completed', 'paused'] as const)[i],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  }));
  revenueRecords = [];
}
