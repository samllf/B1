import { apiClient } from './client';
import { mockApi } from './mock';
import type { Project, PaginatedData } from '../types';

export const projectApi = {
  getList(page: number, pageSize: number, keyword?: string) {
    return apiClient.request<PaginatedData<Project>>(
      'getProjects',
      (signal) => mockApi.getProjects(page, pageSize, keyword),
    );
  },

  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.request<Project>(
      'createProject',
      () => mockApi.createProject(data),
    );
  },

  update(id: string, data: Partial<Project>) {
    return apiClient.request<Project>(
      `updateProject-${id}`,
      () => mockApi.updateProject(id, data),
    );
  },

  delete(id: string) {
    return apiClient.request<void>(
      `deleteProject-${id}`,
      () => mockApi.deleteProject(id),
    );
  },
};
