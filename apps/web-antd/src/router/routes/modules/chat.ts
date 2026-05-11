import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'ChatHome',
    path: '/chat',
    component: () => import('#/views/chat/index.vue'),
    meta: {
      affixTab: true,
      activePath: '/chat',
      fullPathKey: false,
      icon: 'ant-design:message-outlined',
      order: -2,
      title: '新建会话',
    },
  },
  {
    name: 'ChatSession',
    path: '/chat/:sessionId',
    component: () => import('#/views/chat/index.vue'),
    meta: {
      activePath: '/chat',
      activeMenu: '/chat',
      fullPathKey: false,
      hideInMenu: true,
      icon: 'ant-design:message-outlined',
      title: '会话',
    },
  },
];

export default routes;
