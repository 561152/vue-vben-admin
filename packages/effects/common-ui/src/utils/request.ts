/**
 * 简单的请求工具函数
 * 用于共享组件，不依赖应用层配置
 */

interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

class SimpleRequestClient {
  private getToken(): string {
    // 从 localStorage 读取 token（适配 Vben Admin）
    const storageKey = 'vben-web-antd-5.5.9-dev__access-store__';
    try {
      const storeData = localStorage.getItem(storageKey);
      if (storeData) {
        const parsed = JSON.parse(storeData);
        return parsed.accessToken || '';
      }
    } catch (e) {
      console.error('Failed to get token:', e);
    }
    return '';
  }

  private getApiUrl(): string {
    // 从环境变量或配置中获取 API URL
    if (typeof window !== 'undefined' && (window as any).__VBEN_ADMIN_PRO_APP_CONF__) {
      return (window as any).__VBEN_ADMIN_PRO_APP_CONF__.VITE_GLOB_API_URL || '/api';
    }
    return '/api';
  }

  async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const token = this.getToken();
    const apiUrl = this.getApiUrl();

    // 构建查询参数
    let fullUrl = `${apiUrl}${url}`;
    if (options?.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const paramStr = params.toString();
      if (paramStr) {
        fullUrl += `?${paramStr}`;
      }
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 适配后端响应格式 { code: 0, data: ... }
    if (data.code === 0) {
      return data.data;
    }

    return data;
  }

  async post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const token = this.getToken();
    const apiUrl = this.getApiUrl();

    const response = await fetch(`${apiUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 适配后端响应格式
    if (data.code === 0) {
      return data.data;
    }

    return data;
  }
}

export const request = new SimpleRequestClient();
