import type { RouteRecordRaw } from 'vue-router';

/**
 * 客户管理模块路由
 *
 * 包含：客户列表、客户标签、客户分组、跟进记录
 *
 * 新路由前缀: /customer
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:user-outlined',
      order: 1,
      title: '客户管理',
      appModule: 'CUSTOMER',
    },
    name: 'Customer',
    path: '/customer',
    redirect: '/customer/list',
    children: [
      {
        name: 'CustomerListNew',
        path: 'list',
        component: () => import('#/views/customer/list/index.vue'),
        meta: {
          icon: 'ant-design:user-outlined',
          title: '客户列表',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:CUSTOMER:LIST', 'CRM:CUSTOMER:LIST'],
        },
      },
      {
        name: 'CustomerStatisticsNew',
        path: 'list/statistics',
        component: () => import('#/views/customer/list/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:CUSTOMER:LIST', 'CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerTagNew',
        path: 'tag',
        component: () => import('#/views/customer/tag/index.vue'),
        meta: {
          icon: 'ant-design:tag-outlined',
          title: '客户标签',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:TAG:LIST', 'CRM:TAG:LIST'],
        },
      },
      {
        name: 'CustomerTagStatisticsNew',
        path: 'tag/statistics',
        component: () => import('#/views/customer/tag/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '标签统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:TAG:LIST', 'CRM:TAG:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerGroupNew',
        path: 'group',
        component: () => import('#/views/customer/group/index.vue'),
        meta: {
          icon: 'ant-design:cluster-outlined',
          title: '客户分组',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:GROUP:LIST', 'CRM:GROUP:LIST'],
        },
      },
      {
        name: 'CustomerGroupStatisticsNew',
        path: 'group/statistics',
        component: () => import('#/views/customer/group/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '分组统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:GROUP:LIST', 'CRM:GROUP:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerFollowUpNew',
        path: 'follow-up',
        component: () => import('#/views/customer/follow-up/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '跟进记录',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:FOLLOW_UP:LIST', 'CRM:FOLLOW_UP:LIST'],
        },
      },
      {
        name: 'CustomerFollowUpStatisticsNew',
        path: 'follow-up/statistics',
        component: () => import('#/views/customer/follow-up/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '跟进统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:FOLLOW_UP:LIST', 'CRM:FOLLOW_UP:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerActivityStatisticsNew',
        path: 'activity/statistics',
        component: () => import('#/views/customer/activity/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户活动统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:ACTIVITY:VIEW', 'CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerChannelStatisticsNew',
        path: 'channel/statistics',
        component: () => import('#/views/customer/channel/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户渠道统计',
          appModule: 'CUSTOMER',
          permissions: ['CUSTOMER:CHANNEL:VIEW', 'CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
