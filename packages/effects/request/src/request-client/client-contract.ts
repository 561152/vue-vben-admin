import type { AxiosInstance } from 'axios';

import type { RequestClientConfig } from './types';

export interface RequestClientLike {
  readonly instance: AxiosInstance;
  getBaseUrl(): string | undefined;
  request?<T = any>(url: string, config: RequestClientConfig): Promise<T>;
  post?<T = any>(
    url: string,
    data?: any,
    config?: RequestClientConfig,
  ): Promise<T>;
  patch?<T = any>(
    url: string,
    data?: any,
    config?: RequestClientConfig,
  ): Promise<T>;
}
