import type { RouteRecordRaw } from 'vue-router';

/**
 * 成长档案路由 - Phase 1 新增模块
 * 包含 3 个核心功能：
 * 1. 学习进度（从 AI 教师迁移）
 * 2. 荣誉墙（新增）
 * 3. 阶段报告（新增）
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:rise-outlined',
      order: 7,
      title: '成长档案',
      appModule: 'LMS',
    },
    name: 'GrowthProfile',
    path: '/growth-profile',
    redirect: '/growth-profile/progress',
    children: [
      // 1. 学习进度（从 AI 教师迁移）
      {
        name: 'GrowthProgress',
        path: 'progress',
        component: () => import('#/views/growth-profile/progress/index.vue'),
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: '学习进度',
          appModule: 'LMS',
          permissions: ['LMS:GROWTH_PROFILE:PROGRESS'],
        },
      },

      // 2. 荣誉墙（新增）
      {
        name: 'AchievementWall',
        path: 'achievements',
        component: () =>
          import('#/views/growth-profile/achievements/index.vue'),
        meta: {
          icon: 'ant-design:trophy-outlined',
          title: '荣誉墙',
          appModule: 'LMS',
          permissions: ['LMS:GROWTH_PROFILE:ACHIEVEMENT'],
        },
      },

      // 3. 阶段报告（新增）
      {
        name: 'StageReports',
        path: 'reports',
        component: () => import('#/views/growth-profile/reports/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '阶段报告',
          appModule: 'LMS',
          permissions: ['LMS:GROWTH_PROFILE:REPORT'],
        },
      },

      // 周报详情（隐藏菜单）
      {
        name: 'WeeklyReportDetail',
        path: 'reports/weekly/:id',
        component: () =>
          import('#/views/growth-profile/reports/weekly-detail.vue'),
        meta: {
          title: '周报详情',
          appModule: 'LMS',
          permissions: ['LMS:GROWTH_PROFILE:REPORT'],
          hideInMenu: true,
          activeMenu: '/growth-profile/reports',
        },
      },
    ],
  },
];

export default routes;
