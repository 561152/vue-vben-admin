import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:medicine-box-outlined',
      order: 6,
      title: 'AI 学习医生',
      appModule: 'AI_DOCTOR',
    },
    name: 'AIDoctor',
    path: '/ai-doctor',
    redirect: '/ai-doctor/diagnosis',
    children: [
      {
        name: 'DiagnosisCenter',
        path: 'diagnosis',
        component: () => import('#/views/ai-doctor/diagnosis/index.vue'),
        meta: {
          icon: 'ant-design:file-search-outlined',
          title: '诊断中心',
          appModule: 'AI_DOCTOR',
          permissions: [
            'AI_DOCTOR:DIAGNOSIS:VIEW',
            'AI_DOCTOR:DIAGNOSIS:CREATE',
          ],
        },
      },
      {
        name: 'PrescriptionList',
        path: 'prescription',
        component: () => import('#/views/ai-doctor/prescription/index.vue'),
        meta: {
          icon: 'ant-design:solution-outlined',
          title: '学习处方',
          appModule: 'AI_DOCTOR',
          permissions: [
            'AI_DOCTOR:PRESCRIPTION:LIST',
            'AI_DOCTOR:PRESCRIPTION:VIEW',
          ],
        },
      },
      {
        name: 'CounselorChat',
        path: 'counselor',
        component: () => import('#/views/ai-doctor/counselor/index.vue'),
        meta: {
          icon: 'ant-design:customer-service-outlined',
          title: 'AI 咨询师',
          appModule: 'AI_DOCTOR',
          permissions: ['AI_DOCTOR:COUNSELOR:SESSION'],
        },
      },
      {
        name: 'FollowUpTracking',
        path: 'follow-up',
        component: () => import('#/views/ai-doctor/follow-up/index.vue'),
        meta: {
          icon: 'ant-design:history-outlined',
          title: '复诊追踪',
          appModule: 'AI_DOCTOR',
          permissions: ['AI_DOCTOR:FOLLOW_UP:VIEW'],
        },
      },
      {
        name: 'ParentReport',
        path: 'parent-report',
        component: () => import('#/views/ai-doctor/parent-report/index.vue'),
        meta: {
          icon: 'ant-design:file-done-outlined',
          title: '家长报告',
          appModule: 'AI_DOCTOR',
          permissions: ['AI_DOCTOR:COUNSELOR:PARENT_REPORT'],
        },
      },
    ],
  },
];

export default routes;
