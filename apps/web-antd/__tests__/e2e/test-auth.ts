/**
 * 测试专用认证配置
 *
 * 提供测试用的 JWT Token 和认证辅助函数
 */
import jwt from 'jsonwebtoken';

// JWT 密钥 (与后端保持一致)
const JWT_SECRET =
  process.env.JWT_SECRET || 'omnireach-secret-key-change-in-production';

// 测试用户配置
export const TEST_USERS = {
  // 超级管理员
  admin: {
    id: '1',
    tenantId: '1',
    username: 'admin',
  },
  // 普通用户
  user: {
    id: '2',
    tenantId: '1',
    username: 'user',
  },
};

/**
 * 生成测试用 JWT Token
 * @param user 用户信息
 * @param expiresIn Token 有效期 (默认 24 小时)
 */
export function generateTestToken(
  user: { id: string; tenantId: string; username: string },
  expiresIn: string = '24h',
): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}

/**
 * 获取管理员测试 Token
 */
export function getAdminToken(): string {
  return generateTestToken(TEST_USERS.admin);
}

/**
 * 获取普通用户测试 Token
 */
export function getUserToken(): string {
  return generateTestToken(TEST_USERS.user);
}

/**
 * Pinia store 持久化数据格式
 * 用于直接设置 localStorage
 */
export function getPiniaAccessStoreData(token: string) {
  return {
    accessToken: token,
    refreshToken: null,
    accessCodes: [
      // 客户管理模块权限
      'customer:list:view',
      'customer:list:create',
      'customer:list:update',
      'customer:list:delete',
      'customer:tag:view',
      'customer:tag:create',
      'customer:tag:update',
      'customer:tag:delete',
      'customer:group:view',
      'customer:group:create',
      'customer:group:update',
      'customer:group:delete',
      'customer:follow-up:view',
      'customer:follow-up:create',
      'customer:follow-up:update',
      'customer:follow-up:delete',
      // 营销中心模块权限
      'marketing:campaign:view',
      'marketing:campaign:create',
      'marketing:campaign:update',
      'marketing:campaign:delete',
      'marketing:audience:view',
      'marketing:audience:create',
      'marketing:audience:update',
      'marketing:audience:delete',
      'marketing:member-analysis:view',
      // 消息中心模块权限
      'messaging:direct:view',
      'messaging:direct:create',
      'messaging:direct:send',
      'messaging:template:view',
      'messaging:template:create',
      'messaging:template:update',
      'messaging:template:delete',
      'messaging:mass-message:view',
      'messaging:mass-message:create',
      'messaging:mass-message:send',
      'messaging:media:view',
      'messaging:media:upload',
      'messaging:media:delete',
      // 运营管理模块权限
      'operations:employee-task:view',
      'operations:employee-task:create',
      'operations:employee-task:update',
      'operations:employee-task:delete',
      'operations:wecom-sync:view',
      'operations:wecom-sync:sync',
      'operations:anti-harassment:view',
      'operations:anti-harassment:update',
      // 系统模块权限
      'system:user:view',
      'system:user:create',
      'system:user:update',
      'system:user:delete',
      'system:role:view',
      'system:role:create',
      'system:role:update',
      'system:role:delete',
      // 平台模块权限
      'platform:tenant:view',
      'platform:tenant:create',
      'platform:tenant:update',
      'platform:tenant:delete',
      // AI Tutor 权限
      'ai-tutor:homework:view',
      'ai-tutor:chat:view',
      // AI Studio 权限
      'ai-studio:console:view',
      'ai-studio:agent:view',
      'ai-studio:agent:execute',
      'ai-studio:workflow:view',
      'ai-studio:workflow:create',
      'ai-studio:workflow:update',
      'ai-studio:workflow:execute',
      'ai-studio:memory:view',
      'ai-studio:memory:manage',
      'ai-studio:plugin:view',
      'ai-studio:plugin:install',
      'ai-studio:plugin:uninstall',
    ],
    isLockScreen: false,
    lockScreenPassword: undefined,
  };
}

/**
 * 获取用户信息 store 数据
 */
export function getPiniaUserStoreData() {
  return {
    userInfo: {
      id: 1,
      username: 'admin',
      realName: '测试管理员',
      avatar: '',
      tenantId: 1,
      tenant: {
        id: 1,
        name: '测试租户',
        code: 'test',
        logo: '',
        status: 'ACTIVE',
        planType: 'ENTERPRISE',
        subscriptions: [
          {
            appModuleCode: 'CUSTOMER',
            appModuleName: '客户管理',
            appModuleIcon: 'ant-design:user-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'MARKETING',
            appModuleName: '营销中心',
            appModuleIcon: 'ant-design:rocket-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'MESSAGING',
            appModuleName: '消息中心',
            appModuleIcon: 'ant-design:message-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'OPERATIONS',
            appModuleName: '运营管理',
            appModuleIcon: 'ant-design:setting-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'SYSTEM',
            appModuleName: '系统管理',
            appModuleIcon: 'ant-design:setting-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'PLATFORM',
            appModuleName: '平台管理',
            appModuleIcon: 'ant-design:cloud-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'AI_TUTOR',
            appModuleName: 'AI 智能教师',
            appModuleIcon: 'ant-design:robot-outlined',
            status: 'ACTIVE',
          },
          {
            appModuleCode: 'AI_STUDIO',
            appModuleName: 'AI 控制台',
            appModuleIcon: 'ant-design:experiment-outlined',
            status: 'ACTIVE',
          },
        ],
      },
      roles: [
        {
          roleId: 1,
          roleName: '超级管理员',
          roleCode: 'SUPER_ADMIN',
          appModuleCode: '',
          dataScope: 'ALL',
          permissions: [
            'crm:customer:view',
            'crm:customer:create',
            'crm:customer:update',
            'crm:customer:delete',
          ],
        },
      ],
      homePath: '/dashboard',
    },
    userRoles: ['SUPER_ADMIN'],
  };
}
