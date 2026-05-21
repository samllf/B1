/**
 * API Client with AbortController support
 * All API calls go through this layer for consistent error handling and request cancellation.
 */

interface RequestConfig {
  signal?: AbortSignal;
  timeout?: number;
}

class ApiClient {
  private activeControllers = new Map<string, AbortController>();

  createAbortController(key: string): AbortController {
    this.cancelRequest(key);
    const controller = new AbortController();
    this.activeControllers.set(key, controller);
    return controller;
  }

  cancelRequest(key: string): void {
    const existing = this.activeControllers.get(key);
    if (existing) {
      existing.abort();
      this.activeControllers.delete(key);
    }
  }

  cancelAll(): void {
    this.activeControllers.forEach(controller => controller.abort());
    this.activeControllers.clear();
  }

  removeController(key: string): void {
    this.activeControllers.delete(key);
  }

  async request<T>(
    key: string,
    executor: (signal?: AbortSignal) => Promise<T>,
    config?: RequestConfig
  ): Promise<T> {
    const controller = this.createAbortController(key);
    const signal = config?.signal || controller.signal;

    try {
      const result = await executor(signal);
      this.removeController(key);
      return result;
    } catch (error) {
      this.removeController(key);
      if ((error as Error).name === 'AbortError') {
        throw new Error('请求已取消');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
