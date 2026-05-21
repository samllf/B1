import { apiClient } from './client';
import { mockApi } from './mock';
import type { RevenueRecord, HourlyRevenue, RevenueEntry, ProjectKPIData } from '../types';

export const revenueApi = {
  getHourlyRevenue(projectId: string, date?: string) {
    return apiClient.request<HourlyRevenue[]>(
      `hourlyRevenue-${projectId}`,
      () => mockApi.getHourlyRevenue(projectId, date),
    );
  },

  getProjectKPI(projectId: string) {
    return apiClient.request<ProjectKPIData>(
      `kpi-${projectId}`,
      () => mockApi.getProjectKPI(projectId),
    );
  },

  batchCreateRevenue(projectId: string, entries: RevenueEntry[]) {
    // Transform RevenueEntry[] to the format mock expects
    const transformed = entries.map(entry => {
      const records: Omit<RevenueRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[] = [];
      const periods: { period: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'takeout'; amountKey: string; ordersKey: string }[] = [
        { period: 'breakfast', amountKey: 'breakfastAmount', ordersKey: 'breakfastOrders' },
        { period: 'lunch', amountKey: 'lunchAmount', ordersKey: 'lunchOrders' },
        { period: 'dinner', amountKey: 'dinnerAmount', ordersKey: 'dinnerOrders' },
        { period: 'supper', amountKey: 'supperAmount', ordersKey: 'supperOrders' },
        { period: 'takeout', amountKey: 'takeoutAmount', ordersKey: 'takeoutOrders' },
      ];

      periods.forEach(({ period, amountKey, ordersKey }) => {
        const amount = (entry as Record<string, number>)[amountKey];
        const orders = (entry as Record<string, number>)[ordersKey];
        if (amount > 0 || orders > 0) {
          const now = new Date();
          const hour = period === 'breakfast' ? 8 : period === 'lunch' ? 12 : period === 'dinner' ? 18 : period === 'supper' ? 21 : 13;
          records.push({
            stallName: entry.stallName,
            period,
            amount,
            orderCount: orders,
            date: new Date().toISOString().split('T')[0],
            hour,
          });
        }
      });

      return { stallName: entry.stallName, records };
    });

    return apiClient.request<RevenueRecord[]>(
      'batchCreateRevenue',
      () => mockApi.batchCreateRevenue({ projectId, entries: transformed }),
    );
  },

  importRecords(projectId: string, records: Omit<RevenueRecord, 'id' | 'createdAt' | 'updatedAt'>[], mode: 'overwrite' | 'append') {
    return apiClient.request<{ conflicts: unknown[]; inserted: RevenueRecord[] }>(
      'importRecords',
      () => mockApi.importRecords(projectId, records, mode),
    );
  },

  getByDateRange(projectId: string, startDate: string, endDate: string) {
    return apiClient.request<RevenueRecord[]>(
      'dateRange',
      () => mockApi.getRevenueByDateRange(projectId, startDate, endDate),
    );
  },

  getRecords(projectId: string, date?: string) {
    return apiClient.request<RevenueRecord[]>(
      `records-${projectId}`,
      () => mockApi.getRevenueRecords(projectId, date),
    );
  },

  simulateUpdate(projectId: string) {
    return mockApi.simulateNewRevenue(projectId);
  },
};
