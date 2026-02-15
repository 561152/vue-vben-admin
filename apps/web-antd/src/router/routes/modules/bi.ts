import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:bar-chart-outlined',
      order: 89,
      title: '数据分析',
      appModule: 'BI',
    },
    name: 'BI',
    path: '/bi',
    redirect: '/bi/crm',
    children: [
      {
        name: 'BiCrm',
        path: 'crm',
        component: () => import('#/views/bi/crm/index.vue'),
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: 'CRM数据分析',
          appModule: 'BI',
          permissions: ['BI:CRM:VIEW'],
        },
      },
    ],
  },
];

export default routes;
