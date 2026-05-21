import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PageRoute } from '../types';

interface UIState {
  activePage: PageRoute;
  isBigScreen: boolean;
  sidebarCollapsed: boolean;
  hasUnsavedChanges: boolean;
  pendingNavigation: string | null;
}

const initialState: UIState = {
  activePage: 'projects',
  isBigScreen: false,
  sidebarCollapsed: false,
  hasUnsavedChanges: false,
  pendingNavigation: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActivePage(state, action: PayloadAction<PageRoute>) {
      state.activePage = action.payload;
    },
    toggleBigScreen(state) {
      state.isBigScreen = !state.isBigScreen;
    },
    setBigScreen(state, action: PayloadAction<boolean>) {
      state.isBigScreen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setHasUnsavedChanges(state, action: PayloadAction<boolean>) {
      state.hasUnsavedChanges = action.payload;
    },
    setPendingNavigation(state, action: PayloadAction<string | null>) {
      state.pendingNavigation = action.payload;
    },
  },
});

export const {
  setActivePage,
  toggleBigScreen,
  setBigScreen,
  toggleSidebar,
  setHasUnsavedChanges,
  setPendingNavigation,
} = uiSlice.actions;
export default uiSlice.reducer;
