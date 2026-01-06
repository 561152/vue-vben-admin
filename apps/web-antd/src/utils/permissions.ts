import { getCachedBackendUserInfo } from '#/api/core/user';

/**
 * 三层漏斗权限检查工具
 */

/**
 * 第一层：检查租户是否订阅了指定应用模块
 * @param appModuleCode 应用模块代码（如 'CRM', 'LMS'）
 * @returns 是否已订阅
 */
export function hasAppModule(appModuleCode: string): boolean {
  const userInfo = getCachedBackendUserInfo();
  if (!userInfo) return false;

  return userInfo.tenant.subscriptions.some(
    (sub) =>
      sub.appModuleCode === appModuleCode &&
      (sub.status === 'ACTIVE' || sub.status === 'TRIAL'),
  );
}

/**
 * 第二层：检查用户是否拥有指定权限码
 * @param permissionCode 权限码（如 'CRM:CUSTOMER:LIST'）
 * @returns 是否拥有权限
 */
export function hasPermission(permissionCode: string): boolean {
  const userInfo = getCachedBackendUserInfo();
  if (!userInfo) return false;

  // 检查所有角色的权限
  return userInfo.roles.some((role) =>
    role.permissions.includes(permissionCode),
  );
}

/**
 * 检查用户是否同时拥有多个权限（AND 逻辑）
 * @param permissionCodes 权限码数组
 * @returns 是否全部拥有
 */
export function hasAllPermissions(permissionCodes: string[]): boolean {
  return permissionCodes.every((code) => hasPermission(code));
}

/**
 * 检查用户是否拥有任一权限（OR 逻辑）
 * @param permissionCodes 权限码数组
 * @returns 是否拥有任一权限
 */
export function hasAnyPermission(permissionCodes: string[]): boolean {
  return permissionCodes.some((code) => hasPermission(code));
}

/**
 * 第三层：获取用户在指定应用模块中的数据范围
 * @param appModuleCode 应用模块代码
 * @returns 数据范围（'ALL' | 'DEPT' | 'OWN'），如果没有相关角色则返回 null
 */
export function getDataScope(appModuleCode: string): string | null {
  const userInfo = getCachedBackendUserInfo();
  if (!userInfo) return null;

  // 获取该模块下的所有角色
  const moduleRoles = userInfo.roles.filter(
    (role) => role.appModuleCode === appModuleCode,
  );

  if (moduleRoles.length === 0) return null;

  // 取最大权限（ALL > DEPT > OWN）
  const scopes = moduleRoles.map((role) => role.dataScope);
  if (scopes.includes('ALL')) return 'ALL';
  if (scopes.includes('DEPT')) return 'DEPT';
  return 'OWN';
}

/**
 * 检查用户是否是指定应用模块的管理员（拥有 ALL 数据范围）
 * @param appModuleCode 应用模块代码
 * @returns 是否是管理员
 */
export function isModuleAdmin(appModuleCode: string): boolean {
  return getDataScope(appModuleCode) === 'ALL';
}

/**
 * 完整权限检查：同时检查订阅、权限码和数据范围
 * @param appModuleCode 应用模块代码
 * @param permissionCode 权限码（可选）
 * @returns 权限检查结果
 */
export function checkFullPermission(
  appModuleCode: string,
  permissionCode?: string,
): {
  hasModule: boolean;
  hasPermission: boolean;
  dataScope: string | null;
  allowed: boolean;
} {
  const hasModule = hasAppModule(appModuleCode);
  const hasPerm = permissionCode ? hasPermission(permissionCode) : true;
  const dataScope = getDataScope(appModuleCode);

  return {
    hasModule,
    hasPermission: hasPerm,
    dataScope,
    allowed: hasModule && hasPerm && dataScope !== null,
  };
}

/**
 * 获取用户已订阅的应用模块列表
 * @returns 应用模块代码列表
 */
export function getSubscribedModules(): string[] {
  const userInfo = getCachedBackendUserInfo();
  if (!userInfo) return [];

  return userInfo.tenant.subscriptions
    .filter((sub) => sub.status === 'ACTIVE' || sub.status === 'TRIAL')
    .map((sub) => sub.appModuleCode);
}

/**
 * 获取用户的所有权限码
 * @returns 权限码数组
 */
export function getAllPermissions(): string[] {
  const userInfo = getCachedBackendUserInfo();
  if (!userInfo) return [];

  // 合并所有角色的权限
  const allPerms = userInfo.roles.flatMap((role) => role.permissions);
  return [...new Set(allPerms)];
}
