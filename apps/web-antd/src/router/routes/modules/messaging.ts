import type { RouteRecordRaw } from 'vue-router';

/**
 * 消息中心模块路由
 *
 * 包含：消息推送、定时消息、消息模板、素材库、朋友圈、群发消息
 * 融入群发能力
 *
 * 新路由前缀: /messaging
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:message-outlined',
      order: 3,
      title: '消息中心',
      appModule: 'MESSAGING',
    },
    name: 'Messaging',
    path: '/messaging',
    redirect: '/messaging/direct',
    children: [
      {
        name: 'MessagingDirect',
        path: 'direct',
        component: () => import('#/views/messaging/direct/index.vue'),
        meta: {
          icon: 'ant-design:message-outlined',
          title: '消息推送',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:DIRECT:LIST', 'CRM:DIRECT_MESSAGE:LIST'],
        },
      },
      {
        name: 'MessagingDirectStatistics',
        path: 'direct/statistics',
        component: () => import('#/views/messaging/direct/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '消息推送统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:DIRECT:LIST', 'CRM:DIRECT_MESSAGE:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingScheduled',
        path: 'scheduled',
        component: () => import('#/views/messaging/scheduled/index.vue'),
        meta: {
          icon: 'ant-design:clock-circle-outlined',
          title: '定时消息',
          appModule: 'MESSAGING',
          permissions: [
            'MESSAGING:SCHEDULED:LIST',
            'CRM:SCHEDULED_MESSAGE:LIST',
          ],
        },
      },
      {
        name: 'MessagingScheduledStatistics',
        path: 'scheduled/statistics',
        component: () => import('#/views/messaging/scheduled/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '定时消息统计',
          appModule: 'MESSAGING',
          permissions: [
            'MESSAGING:SCHEDULED:LIST',
            'CRM:SCHEDULED_MESSAGE:LIST',
          ],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingTemplate',
        path: 'template',
        component: () => import('#/views/messaging/template/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '消息模板',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:TEMPLATE:LIST', 'CRM:MESSAGE_TEMPLATE:LIST'],
        },
      },
      {
        name: 'MessagingTemplateStatistics',
        path: 'template/statistics',
        component: () => import('#/views/messaging/template/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '模板统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:TEMPLATE:LIST', 'CRM:MESSAGE_TEMPLATE:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingMaterial',
        path: 'material',
        component: () => import('#/views/messaging/material/index.vue'),
        meta: {
          icon: 'ant-design:folder-outlined',
          title: '素材库',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MATERIAL:LIST', 'CRM:MATERIAL:VIEW'],
        },
      },
      {
        name: 'MessagingMaterialStatistics',
        path: 'material/statistics',
        component: () => import('#/views/messaging/material/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '素材库统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MATERIAL:LIST', 'CRM:MATERIAL:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingMoments',
        path: 'moments',
        component: () => import('#/views/messaging/moments/index.vue'),
        meta: {
          icon: 'ant-design:share-alt-outlined',
          title: '朋友圈',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MOMENTS:LIST', 'CRM:MOMENTS:VIEW'],
        },
      },
      {
        name: 'MessagingMomentsStatistics',
        path: 'moments/statistics',
        component: () => import('#/views/messaging/moments/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '朋友圈统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MOMENTS:LIST', 'CRM:MOMENTS:VIEW'],
          hideInMenu: true,
        },
      },
      // 群发能力（原营销模块）
      {
        name: 'MessagingMass',
        path: 'mass-message',
        component: () => import('#/views/messaging/mass-message/index.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: '群发消息',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MASS:LIST', 'CRM:MASS_MESSAGE:SEND'],
        },
      },
      {
        name: 'MessagingMassStatistics',
        path: 'mass-message/statistics',
        component: () =>
          import('#/views/messaging/mass-message/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '群发统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MASS:LIST', 'CRM:MASS_MESSAGE:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingMassCreate',
        path: 'mass-message/create',
        component: () => import('#/views/messaging/mass-message/create.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: '新建群发',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MASS:CREATE', 'CRM:MASS_MESSAGE:SEND'],
          hideInMenu: true,
        },
      },
      {
        name: 'MessagingTools',
        path: 'tools',
        component: () => import('#/views/messaging/mass-message/tools.vue'),
        meta: {
          icon: 'ant-design:tool-outlined',
          title: '群发工具',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:MASS:SEND', 'CRM:MASS_MESSAGE:SEND'],
        },
      },
      {
        name: 'MessagingDifyStatistics',
        path: 'dify/statistics',
        component: () => import('#/views/messaging/auto-reply/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: 'AI对话统计',
          appModule: 'MESSAGING',
          permissions: ['MESSAGING:AUTO_REPLY:VIEW', 'CRM:DIFY:VIEW'],
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
