import type { RouteRecordRaw } from 'vue-router';

/**
 * 旧路由兼容重定向
 *
 * CRM模块拆分后的路由重定向，确保旧书签/链接仍然有效
 * 这些路由会在过渡期后删除
 */
const routes: RouteRecordRaw[] = [
  // ===== CRM 客户管理 → 客户管理模块 =====
  {
    path: '/crm/customer',
    redirect: '/customer/list',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/customer/statistics',
    redirect: '/customer/list/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/tag',
    redirect: '/customer/tag',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/tag/statistics',
    redirect: '/customer/tag/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/group',
    redirect: '/customer/group',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/group/statistics',
    redirect: '/customer/group/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/follow-up',
    redirect: '/customer/follow-up',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/follow-up/statistics',
    redirect: '/customer/follow-up/statistics',
    meta: { hideInMenu: true },
  },

  // ===== CRM 营销 → 营销中心模块 =====
  {
    path: '/crm/campaign',
    redirect: '/marketing/campaign',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/campaign/statistics',
    redirect: '/marketing/campaign/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/audience',
    redirect: '/marketing/audience',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/audience/statistics',
    redirect: '/marketing/audience/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/retail',
    redirect: '/marketing/member-analysis',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/member-profile/statistics',
    redirect: '/marketing/member-analysis/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/targeted-marketing',
    redirect: '/marketing/ai-marketing',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/targeted-marketing/statistics',
    redirect: '/marketing/ai-marketing/statistics',
    meta: { hideInMenu: true },
  },

  // ===== CRM 消息 → 消息中心模块 =====
  {
    path: '/crm/direct-message',
    redirect: '/messaging/direct',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/direct-message/statistics',
    redirect: '/messaging/direct/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/scheduled-message',
    redirect: '/messaging/scheduled',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/scheduled-message/statistics',
    redirect: '/messaging/scheduled/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/message-template',
    redirect: '/messaging/template',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/message-template/statistics',
    redirect: '/messaging/template/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/material-library',
    redirect: '/messaging/material',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/material-library/statistics',
    redirect: '/messaging/material/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/moments',
    redirect: '/messaging/moments',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/moments/statistics',
    redirect: '/messaging/moments/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/mass-message',
    redirect: '/messaging/mass-message',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/mass-message/statistics',
    redirect: '/messaging/mass-message/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/mass-message/create',
    redirect: '/messaging/mass-message/create',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/mass-message/tools',
    redirect: '/messaging/tools',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/dify/statistics',
    redirect: '/messaging/dify/statistics',
    meta: { hideInMenu: true },
  },

  // ===== CRM 运营 → 运营管理模块 =====
  {
    path: '/crm/employee-task',
    redirect: '/operations/employee-task',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/employee-task/statistics',
    redirect: '/operations/employee-task/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/anti-harassment',
    redirect: '/operations/anti-harassment',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/anti-harassment/statistics',
    redirect: '/operations/anti-harassment/statistics',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/anti-harassment/whitelist',
    redirect: '/operations/anti-harassment/whitelist',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/anti-harassment/blacklist',
    redirect: '/operations/anti-harassment/blacklist',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/anti-harassment/violations',
    redirect: '/operations/anti-harassment/violations',
    meta: { hideInMenu: true },
  },

  // ===== 零售模块重定向 =====
  {
    path: '/crm/retail/rfm',
    redirect: '/marketing/rfm',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/retail/referral',
    redirect: '/marketing/referral',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/retail/sop',
    redirect: '/marketing/sop',
    meta: { hideInMenu: true },
  },
  {
    path: '/crm/retail/member-sync',
    redirect: '/operations/member-sync',
    meta: { hideInMenu: true },
  },

  // ===== 企微同步重定向 =====
  {
    path: '/crm/wecom-sync',
    redirect: '/operations/wecom-sync',
    meta: { hideInMenu: true },
  },
];

export default routes;
