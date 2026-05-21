import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Project, PaginationParams } from '../types';
import { projectApi } from '../api/projects';

interface ProjectState {
  projects: Project[];
  total: number;
  currentPage: number;
  pageSize: number;
  keyword: string;
  selectedProject: Project | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  total: 0,
  currentPage: 1,
  pageSize: 5,
  keyword: '',
  selectedProject: null,
  loading: false,
  submitting: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchList',
  async (params: PaginationParams, { rejectWithValue }) => {
    try {
      return await projectApi.getList(params.page, params.pageSize, params.keyword);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      return await projectApi.create(data);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
    try {
      return await projectApi.update(id, data);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSelectedProject(state, action: PayloadAction<Project | null>) {
      state.selectedProject = action.payload;
    },
    setKeyword(state, action: PayloadAction<string>) {
      state.keyword = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.list;
        state.total = action.payload.total;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.submitting = false;
        state.projects.push(action.payload);
        state.total += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      .addCase(updateProject.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.projects.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.projects[idx] = action.payload;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        state.total -= 1;
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      });
  },
});

export const { setSelectedProject, setKeyword, setPage, clearError } = projectSlice.actions;
export default projectSlice.reducer;
