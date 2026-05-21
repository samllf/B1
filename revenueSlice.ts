import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { HourlyRevenue, ProjectKPIData, RevenueRecord, RevenueEntry } from '../types';
import { revenueApi } from '../api/revenue';

interface RevenueState {
  hourlyData: HourlyRevenue[];
  kpi: ProjectKPIData | null;
  records: RevenueRecord[];
  loading: boolean;
  submitting: boolean;
  importing: boolean;
  error: string | null;
  polling: boolean;
  pollInterval: number;
}

const initialState: RevenueState = {
  hourlyData: [],
  kpi: null,
  records: [],
  loading: false,
  submitting: false,
  importing: false,
  error: null,
  polling: false,
  pollInterval: 10000,
};

export const fetchHourlyRevenue = createAsyncThunk(
  'revenue/fetchHourly',
  async ({ projectId, date }: { projectId: string; date?: string }, { rejectWithValue }) => {
    try {
      return await revenueApi.getHourlyRevenue(projectId, date);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchProjectKPI = createAsyncThunk(
  'revenue/fetchKPI',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await revenueApi.getProjectKPI(projectId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const batchCreateRevenue = createAsyncThunk(
  'revenue/batchCreate',
  async ({ projectId, entries }: { projectId: string; entries: RevenueEntry[] }, { rejectWithValue }) => {
    try {
      return await revenueApi.batchCreateRevenue(projectId, entries);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const importRecords = createAsyncThunk(
  'revenue/importRecords',
  async ({ projectId, records, mode }: {
    projectId: string;
    records: Omit<RevenueRecord, 'id' | 'createdAt' | 'updatedAt'>[];
    mode: 'overwrite' | 'append';
  }, { rejectWithValue }) => {
    try {
      return await revenueApi.importRecords(projectId, records, mode);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const exportRecords = createAsyncThunk(
  'revenue/exportRecords',
  async ({ projectId, startDate, endDate }: { projectId: string; startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      return await revenueApi.getByDateRange(projectId, startDate, endDate);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const revenueSlice = createSlice({
  name: 'revenue',
  initialState,
  reducers: {
    setPolling(state, action: PayloadAction<boolean>) {
      state.polling = action.payload;
    },
    setPollInterval(state, action: PayloadAction<number>) {
      state.pollInterval = action.payload;
    },
    clearRevenueError(state) {
      state.error = null;
    },
    clearRevenueData(state) {
      state.hourlyData = [];
      state.kpi = null;
      state.records = [];
    },
    addSimulatedRecord(state, action: PayloadAction<RevenueRecord>) {
      const record = action.payload;
      const hourIdx = state.hourlyData.findIndex(h => h.hour === record.hour);
      if (hourIdx !== -1) {
        state.hourlyData[hourIdx].totalAmount += record.amount;
        state.hourlyData[hourIdx].totalOrders += record.orderCount;
      } else {
        state.hourlyData.push({
          hour: record.hour,
          totalAmount: record.amount,
          totalOrders: record.orderCount,
          stalls: [{ stallName: record.stallName, amount: record.amount, orders: record.orderCount }],
        });
      }
      if (state.kpi) {
        state.kpi.todayAmount += record.amount;
        state.kpi.todayOrders += record.orderCount;
        state.kpi.avgOrderValue = state.kpi.todayOrders > 0
          ? parseFloat((state.kpi.todayAmount / state.kpi.todayOrders).toFixed(2))
          : 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHourlyRevenue.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHourlyRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.hourlyData = action.payload;
      })
      .addCase(fetchHourlyRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProjectKPI.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjectKPI.fulfilled, (state, action) => {
        state.loading = false;
        state.kpi = action.payload;
      })
      .addCase(fetchProjectKPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(batchCreateRevenue.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(batchCreateRevenue.fulfilled, (state) => { state.submitting = false; })
      .addCase(batchCreateRevenue.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      .addCase(importRecords.pending, (state) => { state.importing = true; state.error = null; })
      .addCase(importRecords.fulfilled, (state) => { state.importing = false; })
      .addCase(importRecords.rejected, (state, action) => {
        state.importing = false;
        state.error = action.payload as string;
      })
      .addCase(exportRecords.fulfilled, (state, action) => { state.records = action.payload; });
  },
});

export const { setPolling, setPollInterval, clearRevenueError, clearRevenueData, addSimulatedRecord } = revenueSlice.actions;
export default revenueSlice.reducer;
