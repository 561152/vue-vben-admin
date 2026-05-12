import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import aiDoctorRoutes from './ai-doctor';
import aiTutorRoutes from './ai-tutor';
import approvalRoutes from './approval';
import growthProfileRoutes from './growth-profile';

function flattenRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.flatMap((route) => [
    route,
    ...flattenRoutes(route.children || []),
  ]);
}

const educationRouteGroups = [
  { moduleCode: 'LMS', routes: aiTutorRoutes, title: 'AI 教师' },
  { moduleCode: 'LMS', routes: growthProfileRoutes, title: '成长档案' },
  {
    moduleCode: 'LEARNING_DIAGNOSIS',
    routes: aiDoctorRoutes,
    title: 'AI 学习医生',
  },
  { moduleCode: 'PAPER_GRADING', routes: approvalRoutes, title: '审批中心' },
];

describe('education route access metadata', () => {
  it.each(educationRouteGroups)(
    'requires app module on every $title route',
    ({ moduleCode, routes }) => {
      for (const route of flattenRoutes(routes)) {
        expect(route.meta?.appModule).toBe(moduleCode);
      }
    },
  );

  it.each(educationRouteGroups)(
    'requires permissions on every visible $title child route',
    ({ routes }) => {
      const children = flattenRoutes(routes).filter(
        (route) => !route.children?.length && !route.meta?.hideInMenu,
      );

      for (const route of children) {
        expect(route.meta?.permissions).toEqual(
          expect.arrayContaining([expect.any(String)]),
        );
      }
    },
  );
});
