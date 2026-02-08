import type { RouteRecordRaw } from 'vue-router';

/**
 * 运营管理模块路由
 *
 * 包含：员工任务、安全管控、企微同步、会员同步
 * 融入会员同步能力
 *
 * 新路由前缀: /operations
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:setting-outlined',
      order: 4,
      title: '运营管理',
      appModule: 'OPERATIONS',
    },
    name: 'Operations',
    path: '/operations',
    redirect: '/operations/employee-task',
    children: [
      {
        name: 'OperationsEmployeeTask',
        path: 'employee-task',
        component: () => import('#/views/operations/employee-task/index.vue'),
        meta: {
          icon: 'ant-design:solution-outlined',
          title: '员工任务',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:EMPLOYEE_TASK:VIEW', 'CRM:EMPLOYEE_TASK:VIEW'],
        },
      },
      {
        name: 'OperationsEmployeeTaskStatistics',
        path: 'employee-task/statistics',
        component: () => import('#/views/operations/employee-task/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '员工任务统计',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:EMPLOYEE_TASK:VIEW', 'CRM:EMPLOYEE_TASK:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'OperationsAntiHarassment',
        path: 'anti-harassment',
        component: () => import('#/views/operations/anti-harassment/index.vue'),
        meta: {
          icon: 'ant-design:safety-outlined',
          title: '安全管控',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW', 'CRM:ANTI_HARASSMENT:VIEW'],
        },
      },
      {
        name: 'OperationsAntiHarassmentStatistics',
        path: 'anti-harassment/statistics',
        component: () => import('#/views/operations/anti-harassment/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '安全管控统计',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW', 'CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'OperationsAntiHarassmentWhitelist',
        path: 'anti-harassment/whitelist',
        component: () => import('#/views/operations/anti-harassment/whitelist.vue'),
        meta: {
          icon: 'ant-design:safety-outlined',
          title: '白名单管理',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW', 'CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'OperationsAntiHarassmentBlacklist',
        path: 'anti-harassment/blacklist',
        component: () => import('#/views/operations/anti-harassment/blacklist.vue'),
        meta: {
          icon: 'ant-design:stop-outlined',
          title: '黑名单管理',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW', 'CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'OperationsAntiHarassmentViolations',
        path: 'anti-harassment/violations',
        component: () => import('#/views/operations/anti-harassment/violations.vue'),
        meta: {
          icon: 'ant-design:warning-outlined',
          title: '违规记录',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW', 'CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'OperationsWecomSync',
        path: 'wecom-sync',
        component: () => import('#/views/operations/wecom-sync/index.vue'),
        meta: {
          icon: 'ant-design:cloud-sync-outlined',
          title: '企微同步',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:WECOM_SYNC:VIEW', 'CRM:WECOM:VIEW'],
        },
      },
      // 会员同步（原零售模块）
      {
        name: 'OperationsMemberSync',
        path: 'member-sync',
        component: () => import('#/views/operations/member-sync/member-sync.vue'),
        meta: {
          icon: 'ant-design:sync-outlined',
          title: '会员同步',
          appModule: 'OPERATIONS',
          permissions: ['OPERATIONS:MEMBER_SYNC:VIEW', 'CRM:RETAIL:VIEW'],
        },
      },
    ],
  },
];

export default routes;
