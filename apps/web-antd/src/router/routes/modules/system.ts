import type { RouteRecordRaw } from 'vue-router';

/**
 * 系统设置路由
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 999,
      title: '系统设置',
    },
    name: 'System',
    path: '/system',
    redirect: '/system/settings',
    children: [
      {
        name: 'SystemSettings',
        path: 'settings',
        component: () => import('#/views/settings/branding/index.vue'),
        meta: {
          icon: 'lucide:sliders-horizontal',
          title: '通用配置',
        },
      },
      {
        name: 'AiConfig',
        path: 'ai-config',
        component: () => import('#/views/settings/ai-config/index.vue'),
        meta: {
          icon: 'lucide:bot',
          title: 'AI 配置',
          permissions: ['SETTINGS:AI_CONFIG:MANAGE'],
        },
      },
    ],
  },
];

export default routes;
