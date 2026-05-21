export interface Project {
  id: string;
  name: string;
  location: string;
  date: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'takeout';

export const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  supper: '夜宵',
  takeout: '外卖',
};

export interface RevenueRecord {
  id: string;
  projectId: string;
  stallName: string;
  period: MealPeriod;
  amount: number;
  orderCount: number;
  date: string;
  hour: number;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueEntry {
  stallName: string;
  breakfastAmount: number;
  breakfastOrders: number;
  lunchAmount: number;
  lunchOrders: number;
  dinnerAmount: number;
  dinnerOrders: number;
  supperAmount: number;
  supperOrders: number;
  takeoutAmount: number;
  takeoutOrders: number;
}

export interface HourlyRevenue {
  hour: number;
  totalAmount: number;
  totalOrders: number;
  stalls: { stallName: string; amount: number; orders: number }[];
}

export interface DailyRevenueSummary {
  date: string;
  totalAmount: number;
  totalOrders: number;
}

export interface ProjectKPIData {
  todayAmount: number;
  todayOrders: number;
  avgOrderValue: number;
}

export interface ImportMode {
  mode: 'overwrite' | 'append';
  projectId: string;
  data: RevenueRecord[];
  conflicts?: { stallName: string; date: string; existing: RevenueRecord; incoming: RevenueRecord }[];
}

export type PageRoute = 'projects' | 'dashboard' | 'revenue-entry' | 'data-io' | 'big-screen';

export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
