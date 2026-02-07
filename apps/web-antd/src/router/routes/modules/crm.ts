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
        name: 'CustomerStatistics',
        path: 'customer/statistics',
        component: () => import('#/views/crm/customer/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户统计',
          appModule: 'CRM',
          permissions: ['CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerActivityStatistics',
        path: 'customer-activity/statistics',
        component: () => import('#/views/crm/customer-activity/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户活动统计',
          appModule: 'CRM',
          permissions: ['CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'CustomerChannelStatistics',
        path: 'customer-channel/statistics',
        component: () => import('#/views/crm/customer-channel/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '客户渠道统计',
          appModule: 'CRM',
          permissions: ['CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'DifyStatistics',
        path: 'dify/statistics',
        component: () => import('#/views/crm/dify/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: 'AI 对话统计',
          appModule: 'CRM',
          permissions: ['CRM:DIFY:VIEW'],
          hideInMenu: true,
        },
      },
      {
        name: 'MemberProfileStatistics',
        path: 'member-profile/statistics',
        component: () => import('#/views/crm/member-profile/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '会员画像统计',
          appModule: 'CRM',
          permissions: ['CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'TargetedMarketingStatistics',
        path: 'targeted-marketing/statistics',
        component: () =>
          import('#/views/crm/targeted-marketing/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: 'AI定向营销统计',
          appModule: 'CRM',
          permissions: ['CRM:CAMPAIGN:LIST'],
          hideInMenu: true,
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
        name: 'CampaignStatistics',
        path: 'campaign/statistics',
        component: () => import('#/views/crm/campaign/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '营销活动统计',
          appModule: 'CRM',
          permissions: ['CRM:CAMPAIGN:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'AudienceStatistics',
        path: 'audience/statistics',
        component: () => import('#/views/crm/audience/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '人群包统计',
          appModule: 'CRM',
          permissions: ['CRM:AUDIENCE:LIST'],
          hideInMenu: true,
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
        name: 'TagStatistics',
        path: 'tag/statistics',
        component: () => import('#/views/crm/tag/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '标签统计',
          appModule: 'CRM',
          permissions: ['CRM:TAG:LIST'],
          hideInMenu: true,
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
        name: 'FollowUpStatistics',
        path: 'follow-up/statistics',
        component: () => import('#/views/crm/follow-up/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '跟进统计',
          appModule: 'CRM',
          permissions: ['CRM:FOLLOW_UP:LIST'],
          hideInMenu: true,
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
        name: 'GroupStatistics',
        path: 'group/statistics',
        component: () => import('#/views/crm/group/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '分组统计',
          appModule: 'CRM',
          permissions: ['CRM:GROUP:LIST'],
          hideInMenu: true,
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
        name: 'DirectMessageStatistics',
        path: 'direct-message/statistics',
        component: () => import('#/views/crm/direct-message/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '消息推送统计',
          appModule: 'CRM',
          permissions: ['CRM:DIRECT_MESSAGE:LIST'],
          hideInMenu: true,
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
        name: 'MessageTemplateStatistics',
        path: 'message-template/statistics',
        component: () => import('#/views/crm/message-template/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '模板统计',
          appModule: 'CRM',
          permissions: ['CRM:MESSAGE_TEMPLATE:LIST'],
          hideInMenu: true,
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
        name: 'MassMessageStatistics',
        path: 'mass-message/statistics',
        component: () => import('#/views/crm/mass-message/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '群发统计',
          appModule: 'CRM',
          permissions: ['CRM:MASS_MESSAGE:LIST'],
          hideInMenu: true,
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
      // 员工任务
      {
        name: 'EmployeeTask',
        path: 'employee-task',
        component: () => import('#/views/crm/employee-task/index.vue'),
        meta: {
          icon: 'ant-design:solution-outlined',
          title: '员工任务',
          appModule: 'CRM',
          permissions: ['CRM:EMPLOYEE_TASK:VIEW'],
        },
      },
      {
        name: 'EmployeeTaskStatistics',
        path: 'employee-task/statistics',
        component: () => import('#/views/crm/employee-task/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '员工任务统计',
          appModule: 'CRM',
          permissions: ['CRM:EMPLOYEE_TASK:VIEW'],
          hideInMenu: true,
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
        name: 'AntiHarassmentStatistics',
        path: 'anti-harassment/statistics',
        component: () => import('#/views/crm/anti-harassment/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '安全管控统计',
          appModule: 'CRM',
          permissions: ['CRM:ANTI_HARASSMENT:VIEW'],
          hideInMenu: true,
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
      {
        name: 'AntiHarassmentViolations',
        path: 'anti-harassment/violations',
        component: () => import('#/views/crm/anti-harassment/violations.vue'),
        meta: {
          icon: 'ant-design:warning-outlined',
          title: '违规记录',
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
      {
        name: 'MomentsStatistics',
        path: 'moments/statistics',
        component: () => import('#/views/crm/moments/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '朋友圈统计',
          appModule: 'CRM',
          permissions: ['CRM:MOMENTS:VIEW'],
          hideInMenu: true,
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
          permissions: ['CRM:MATERIAL:VIEW'],
        },
      },
      {
        name: 'MaterialLibraryStatistics',
        path: 'material-library/statistics',
        component: () => import('#/views/crm/material-library/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '素材库统计',
          appModule: 'CRM',
          permissions: ['CRM:MATERIAL:VIEW'],
          hideInMenu: true,
        },
      },
      // 定时消息
      {
        name: 'ScheduledMessage',
        path: 'scheduled-message',
        component: () => import('#/views/crm/scheduled-message/index.vue'),
        meta: {
          icon: 'ant-design:clock-circle-outlined',
          title: '定时消息',
          appModule: 'CRM',
          permissions: ['CRM:SCHEDULED_MESSAGE:LIST'],
        },
      },
      {
        name: 'ScheduledMessageStatistics',
        path: 'scheduled-message/statistics',
        component: () => import('#/views/crm/scheduled-message/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '定时消息统计',
          appModule: 'CRM',
          permissions: ['CRM:SCHEDULED_MESSAGE:LIST'],
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
