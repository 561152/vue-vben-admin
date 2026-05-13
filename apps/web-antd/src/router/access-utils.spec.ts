import type { RouteRecordRaw } from 'vue-router';
import { describe, expect, it } from 'vitest';

import { filterRoutesByAccess } from './access-utils';

const passthroughComponent = () => null;

describe('filterRoutesByAccess', () => {
  it('should remove parent route when all children lack permissions', () => {
    const hasAppModule = (module: string) => module === 'OPERATIONS';
    const hasPermission = () => false;

    const routes: RouteRecordRaw[] = [
      {
        name: 'Operations',
        path: '/operations',
        redirect: '/operations/employee-task',
        meta: { appModule: 'OPERATIONS', title: '运营工具' },
        children: [
          {
            name: 'OperationsEmployeeTask',
            path: 'employee-task',
            component: passthroughComponent,
            meta: {
              appModule: 'OPERATIONS',
              permissions: ['OPERATIONS:EMPLOYEE_TASK:VIEW'],
              title: '员工任务',
            },
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(0);
  });

  it('should remove education parent route when user has no child permissions', () => {
    const hasAppModule = (module: string) => module === 'LMS';
    const hasPermission = () => false;

    const routes: RouteRecordRaw[] = [
      {
        name: 'AITutor',
        path: '/ai-tutor',
        redirect: '/ai-tutor/quick-grading',
        meta: { appModule: 'LMS', title: 'AI 教师' },
        children: [
          {
            name: 'QuickGrading',
            path: 'quick-grading',
            component: passthroughComponent,
            meta: {
              appModule: 'LMS',
              permissions: ['LMS:TUTOR:USE'],
              title: '拍照批改',
            },
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(0);
  });

  it('should keep parent route when at least one child has permission', () => {
    const hasAppModule = (module: string) => module === 'OPERATIONS';
    const hasPermission = (perm: string) =>
      perm === 'OPERATIONS:EMPLOYEE_TASK:VIEW';

    const routes: RouteRecordRaw[] = [
      {
        name: 'Operations',
        path: '/operations',
        redirect: '/operations/employee-task',
        meta: { appModule: 'OPERATIONS', title: '运营工具' },
        children: [
          {
            name: 'OperationsEmployeeTask',
            path: 'employee-task',
            component: passthroughComponent,
            meta: {
              appModule: 'OPERATIONS',
              permissions: ['OPERATIONS:EMPLOYEE_TASK:VIEW'],
              title: '员工任务',
            },
          },
          {
            name: 'OperationsAntiHarassment',
            path: 'anti-harassment',
            component: passthroughComponent,
            meta: {
              appModule: 'OPERATIONS',
              permissions: ['OPERATIONS:ANTI_HARASSMENT:VIEW'],
              title: '防骚扰',
            },
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(1);
    const [operationsRoute] = result;
    expect(operationsRoute?.name).toBe('Operations');
    expect(operationsRoute?.children).toHaveLength(1);
    expect(operationsRoute?.children?.[0]?.name).toBe('OperationsEmployeeTask');
  });

  it('should always keep routes without appModule (e.g. Dashboard)', () => {
    const hasAppModule = () => false;
    const hasPermission = () => false;

    const routes: RouteRecordRaw[] = [
      {
        name: 'Dashboard',
        path: '/dashboard',
        component: passthroughComponent,
        meta: { title: '首页' },
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Dashboard');
  });

  it('should remove nested empty parent routes recursively', () => {
    const hasAppModule = (module: string) => module === 'CUSTOMER';
    const hasPermission = () => false;

    const routes: RouteRecordRaw[] = [
      {
        name: 'Customer',
        path: '/customer',
        redirect: '/customer/list',
        meta: { appModule: 'CUSTOMER', title: '客户管理' },
        children: [
          {
            name: 'CustomerListNew',
            path: '/customer/list',
            component: passthroughComponent,
            meta: {
              appModule: 'CUSTOMER',
              permissions: ['CUSTOMER:CUSTOMER:LIST'],
              title: '客户列表',
            },
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(0);
  });

  it('should remove unsubscribed module routes entirely', () => {
    const hasAppModule = () => false;
    const hasPermission = () => true;

    const routes: RouteRecordRaw[] = [
      {
        name: 'Marketing',
        path: '/marketing',
        redirect: '/marketing/campaign',
        meta: { appModule: 'MARKETING', title: '营销中心' },
        children: [
          {
            name: 'MarketingCampaign',
            path: '/marketing/campaign',
            component: passthroughComponent,
            meta: {
              appModule: 'MARKETING',
              permissions: ['MARKETING:CAMPAIGN:LIST'],
              title: '营销活动',
            },
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(0);
  });

  it('should handle deeply nested empty routes', () => {
    const hasAppModule = (module: string) => module === 'CRM';
    const hasPermission = () => false;

    const routes: RouteRecordRaw[] = [
      {
        name: 'CrmParent',
        path: '/crm',
        redirect: '/crm/level1',
        meta: { appModule: 'CRM', title: 'CRM' },
        children: [
          {
            name: 'CrmLevel1',
            path: '/crm/level1',
            redirect: '/crm/level1/level2',
            meta: { appModule: 'CRM', title: 'Level1' },
            children: [
              {
                name: 'CrmLevel2',
                path: '/crm/level1/level2',
                component: passthroughComponent,
                meta: {
                  appModule: 'CRM',
                  permissions: ['CRM:LEVEL2:VIEW'],
                  title: 'Level2',
                },
              },
            ],
          },
        ],
      },
    ];

    const result = filterRoutesByAccess(routes, hasAppModule, hasPermission);
    expect(result).toHaveLength(0);
  });
});
