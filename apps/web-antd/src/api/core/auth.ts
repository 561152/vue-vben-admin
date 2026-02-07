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

  /** 租户信息 */
  export interface TenantInfo {
    code: string;
    name: string;
    logo?: string;
  }

  /** 租户列表结果 */
  export interface TenantListResult {
    tenants: TenantInfo[];
  }

  /** 用户会话信息 */
  export interface UserSession {
    id: number;
    deviceInfo: string;
    ipAddress: string;
    loginAt: Date;
    lastActiveAt: Date;
    expiredAt: Date;
    isCurrent: boolean;
  }

  /** 会话列表响应 */
  export interface UserSessionListResult {
    sessions: UserSession[];
  }

  /** 会话操作响应 */
  export interface SessionActionResult {
    message: string;
  }
}

/**
 * 根据用户名查询所属租户列表（智能租户检测）
 */
export async function getTenantsByUsernameApi(
  username: string,
): Promise<AuthApi.TenantListResult> {
  return requestClient.get<AuthApi.TenantListResult>(
    `/auth/tenants-by-username?username=${encodeURIComponent(username)}`,
  );
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

/**
 * 获取活跃会话列表
 */
export async function getSessionsApi(): Promise<AuthApi.UserSessionListResult> {
  return requestClient.get<AuthApi.UserSessionListResult>('/auth/sessions');
}

/**
 * 撤销指定会话（登出其他设备）
 */
export async function revokeSessionApi(
  sessionId: number,
): Promise<AuthApi.SessionActionResult> {
  return requestClient.delete<AuthApi.SessionActionResult>(
    `/auth/sessions/${sessionId}`,
  );
}

/**
 * 撤销所有其他会话（仅保留当前会话）
 */
export async function revokeOtherSessionsApi(): Promise<AuthApi.SessionActionResult> {
  return requestClient.post<AuthApi.SessionActionResult>(
    '/auth/sessions/revoke-others',
  );
}
