import { baseRequestClient, requestClient } from '#/api/request';

import { getCachedPermissions } from './user';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    tenantCode?: string;
  }

  /** 后端登录接口返回值 */
  export interface BackendLoginResult {
    access_token: string;
    token_type: string;
    expires_in: number;
  }

  /** 前端使用的登录结果 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(
  data: AuthApi.LoginParams,
): Promise<AuthApi.LoginResult> {
  const result = await requestClient.post<AuthApi.BackendLoginResult>(
    '/auth/login',
    data,
  );
  // 转换后端返回格式为前端需要的格式
  return {
    accessToken: result.access_token,
  };
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 * 注意：使用 baseRequestClient 避免在 token 失效时的无限循环
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout');
}

/**
 * 获取用户权限码 - 从缓存获取（由 getUserInfoApi 填充）
 */
export async function getAccessCodesApi(): Promise<string[]> {
  // 权限码在 getUserInfoApi 调用时已经缓存
  return getCachedPermissions();
}
