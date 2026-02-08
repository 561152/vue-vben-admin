import type { RouteRecordRaw } from 'vue-router';

/**
 * 营销中心模块路由
 *
 * 包含：营销活动、人群包、会员分析、RFM分析、推荐营销、SOP管理
 * 融入原零售营销能力
 *
 * 新路由前缀: /marketing
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:notification-outlined',
      order: 2,
      title: '营销中心',
      appModule: 'MARKETING',
    },
    name: 'Marketing',
    path: '/marketing',
    redirect: '/marketing/campaign',
    children: [
      {
        name: 'MarketingCampaign',
        path: 'campaign',
        component: () => import('#/views/marketing/campaign/index.vue'),
        meta: {
          icon: 'ant-design:notification-outlined',
          title: '营销活动',
          appModule: 'MARKETING',
          permissions: ['MARKETING:CAMPAIGN:LIST', 'CRM:CAMPAIGN:LIST'],
        },
      },
      {
        name: 'MarketingCampaignStatistics',
        path: 'campaign/statistics',
        component: () => import('#/views/marketing/campaign/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '营销活动统计',
          appModule: 'MARKETING',
          permissions: ['MARKETING:CAMPAIGN:LIST', 'CRM:CAMPAIGN:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'MarketingAudience',
        path: 'audience',
        component: () => import('#/views/marketing/audience/index.vue'),
        meta: {
          icon: 'ant-design:team-outlined',
          title: '人群包',
          appModule: 'MARKETING',
          permissions: ['MARKETING:AUDIENCE:LIST', 'CRM:AUDIENCE:LIST'],
        },
      },
      {
        name: 'MarketingAudienceStatistics',
        path: 'audience/statistics',
        component: () => import('#/views/marketing/audience/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '人群包统计',
          appModule: 'MARKETING',
          permissions: ['MARKETING:AUDIENCE:LIST', 'CRM:AUDIENCE:LIST'],
          hideInMenu: true,
        },
      },
      // 会员营销能力（原零售模块）
      {
        name: 'MarketingMemberAnalysis',
        path: 'member-analysis',
        component: () => import('#/views/marketing/member-analysis/index.vue'),
        meta: {
          icon: 'ant-design:user-switch-outlined',
          title: '会员分析',
          appModule: 'MARKETING',
          permissions: ['MARKETING:MEMBER_ANALYSIS:VIEW', 'CRM:RETAIL:VIEW'],
        },
      },
      {
        name: 'MarketingMemberProfileStatistics',
        path: 'member-analysis/statistics',
        component: () =>
          import('#/views/marketing/member-profile/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '会员画像统计',
          appModule: 'MARKETING',
          permissions: ['MARKETING:MEMBER_ANALYSIS:VIEW', 'CRM:CUSTOMER:LIST'],
          hideInMenu: true,
        },
      },
      {
        name: 'MarketingRfm',
        path: 'rfm',
        component: () => import('#/views/marketing/member-analysis/rfm.vue'),
        meta: {
          icon: 'ant-design:fund-outlined',
          title: 'RFM分析',
          appModule: 'MARKETING',
          permissions: ['MARKETING:RFM:VIEW', 'CRM:RETAIL:VIEW'],
        },
      },
      {
        name: 'MarketingReferral',
        path: 'referral',
        component: () =>
          import('#/views/marketing/member-analysis/referral.vue'),
        meta: {
          icon: 'ant-design:gift-outlined',
          title: '推荐营销',
          appModule: 'MARKETING',
          permissions: ['MARKETING:REFERRAL:VIEW', 'CRM:RETAIL:VIEW'],
        },
      },
      {
        name: 'MarketingSop',
        path: 'sop',
        component: () => import('#/views/marketing/member-analysis/sop.vue'),
        meta: {
          icon: 'ant-design:apartment-outlined',
          title: 'SOP管理',
          appModule: 'MARKETING',
          permissions: ['MARKETING:SOP:LIST', 'CRM:RETAIL:VIEW'],
        },
      },
      {
        name: 'MarketingAiMarketing',
        path: 'ai-marketing',
        component: () => import('#/views/marketing/ai-marketing/index.vue'),
        meta: {
          icon: 'ant-design:robot-outlined',
          title: 'AI定向营销',
          appModule: 'MARKETING',
          permissions: ['MARKETING:AI_MARKETING:VIEW', 'CRM:CAMPAIGN:LIST'],
        },
      },
      {
        name: 'MarketingAiMarketingStatistics',
        path: 'ai-marketing/statistics',
        component: () =>
          import('#/views/marketing/ai-marketing/statistics.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: 'AI定向营销统计',
          appModule: 'MARKETING',
          permissions: ['MARKETING:AI_MARKETING:VIEW', 'CRM:CAMPAIGN:LIST'],
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
