import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:team-outlined',
      order: 1,
      title: 'CRM',
      // 权限配置：需要订阅 CRM 模块
      appModule: 'CRM',
    },
    name: 'CRM',
    path: '/crm',
    redirect: '/crm/customer',
    children: [
      {
        name: 'CustomerList',
        path: 'customer',
        component: () => import('#/views/crm/customer/index.vue'),
        meta: {
          icon: 'ant-design:user-outlined',
          title: '客户管理',
          appModule: 'CRM',
          permissions: ['CRM:CUSTOMER:LIST'],
        },
      },
      {
        name: 'CampaignList',
        path: 'campaign',
        component: () => import('#/views/crm/campaign/index.vue'),
        meta: {
          icon: 'ant-design:notification-outlined',
          title: '营销活动',
          appModule: 'CRM',
          permissions: ['CRM:CAMPAIGN:LIST'],
        },
      },
      {
        name: 'CustomerTag',
        path: 'tag',
        component: () => import('#/views/crm/tag/index.vue'),
        meta: {
          icon: 'ant-design:tag-outlined',
          title: '客户标签',
          appModule: 'CRM',
          permissions: ['CRM:TAG:LIST'],
        },
      },
      {
        name: 'FollowUp',
        path: 'follow-up',
        component: () => import('#/views/crm/follow-up/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '跟进记录',
          appModule: 'CRM',
          permissions: ['CRM:FOLLOW_UP:LIST'],
        },
      },
      {
        name: 'CustomerGroup',
        path: 'group',
        component: () => import('#/views/crm/group/index.vue'),
        meta: {
          icon: 'ant-design:cluster-outlined',
          title: '客户分组',
          appModule: 'CRM',
          permissions: ['CRM:GROUP:LIST'],
        },
      },
      {
        name: 'DirectMessage',
        path: 'direct-message',
        component: () => import('#/views/crm/direct-message/index.vue'),
        meta: {
          icon: 'ant-design:message-outlined',
          title: '消息推送',
          appModule: 'CRM',
          permissions: ['CRM:DIRECT_MESSAGE:LIST'],
        },
      },
      {
        name: 'MessageTemplate',
        path: 'message-template',
        component: () => import('#/views/crm/message-template/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '消息模板',
          appModule: 'CRM',
          permissions: ['CRM:MESSAGE_TEMPLATE:LIST'],
        },
      },
      {
        name: 'MediaLibrary',
        path: 'media',
        component: () => import('#/views/crm/media/index.vue'),
        meta: {
          icon: 'ant-design:picture-outlined',
          title: '素材库',
          appModule: 'CRM',
          permissions: ['CRM:MEDIA:LIST'],
        },
      },
      {
        name: 'MassMessage',
        path: 'mass-message',
        component: () => import('#/views/crm/mass-message/index.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: '群发消息',
          appModule: 'CRM',
          permissions: ['CRM:MASS_MESSAGE:SEND'],
        },
      },
      {
        name: 'RetailDashboard',
        path: 'retail',
        component: () => import('#/views/crm/retail/index.vue'),
        meta: {
          icon: 'ant-design:gift-outlined',
          title: '零售营销',
          appModule: 'CRM',
          permissions: ['CRM:RETAIL:VIEW'],
        },
      },
      // 群发工具
      {
        name: 'MassMessageTools',
        path: 'mass-message/tools',
        component: () => import('#/views/crm/mass-message/tools.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: '群发工具',
          appModule: 'CRM',
          permissions: ['CRM:MASS_MESSAGE:SEND'],
        },
      },
      {
        name: 'MassMessageCreate',
        path: 'mass-message/create',
        component: () => import('#/views/crm/mass-message/create.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: '新建群发',
          appModule: 'CRM',
          permissions: ['CRM:MASS_MESSAGE:SEND'],
          hideInMenu: true,
        },
      },
      // 防骚扰
      {
        name: 'AntiHarassment',
        path: 'anti-harassment',
        component: () => import('#/views/crm/anti-harassment/index.vue'),
        meta: {
          icon: 'ant-design:safety-outlined',
          title: '安全管控',
          appModule: 'CRM',
          permissions: ['CRM:ANTI_HARASSMENT:VIEW'],
        },
      },
      {
        name: 'AntiHarassmentWhitelist',
        path: 'anti-harassment/whitelist',
        component: () => import('#/views/crm/anti-harassment/whitelist.vue'),
        meta: {
          icon: 'ant-design:safety-outlined',
          title: '白名单管理',
          appModule: 'CRM',
          permissions: ['CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'AntiHarassmentBlacklist',
        path: 'anti-harassment/blacklist',
        component: () => import('#/views/crm/anti-harassment/blacklist.vue'),
        meta: {
          icon: 'ant-design:stop-outlined',
          title: '黑名单管理',
          appModule: 'CRM',
          permissions: ['CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
        },
      },
      // 朋友圈
      {
        name: 'Moments',
        path: 'moments',
        component: () => import('#/views/crm/moments/index.vue'),
        meta: {
          icon: 'ant-design:share-alt-outlined',
          title: '客户朋友圈',
          appModule: 'CRM',
          permissions: ['CRM:MOMENTS:VIEW'],
        },
      },
      // 素材库
      {
        name: 'MaterialLibrary',
        path: 'material-library',
        component: () => import('#/views/crm/material-library/index.vue'),
        meta: {
          icon: 'ant-design:folder-outlined',
          title: '营销素材库',
          appModule: 'CRM',
          permissions: ['CRM:MEDIA:LIST'],
        },
      },
    ],
  },
];

export default routes;
