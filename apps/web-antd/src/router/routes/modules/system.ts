import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 999,
      title: '系统设置',
    },
    name: 'System',
    path: '/system',
    redirect: '/system/wecom-config',
    children: [
      {
        name: 'WecomConfig',
        path: 'wecom-config',
        component: () => import('#/views/system/wecom-config/index.vue'),
        meta: {
          icon: 'lucide:badge-check',
          title: '企业微信配置',
        },
      },
      {
        name: 'WecomSync',
        path: 'wecom-sync',
        component: () => import('#/views/system/wecom-sync/index.vue'),
        meta: {
          icon: 'lucide:refresh-cw',
          title: '数据同步',
        },
      },
      {
        name: 'WecomUsers',
        path: 'wecom-users',
        component: () => import('#/views/system/wecom-users/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '员工管理',
        },
      },
    ],
  },
];

export default routes;
