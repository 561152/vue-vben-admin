import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:audit-outlined',
      order: 7,
      title: '审批中心',
      appModule: 'LMS',
    },
    name: 'Approval',
    path: '/approval',
    redirect: '/approval/paper-grading',
    children: [
      {
        name: 'ApprovalPaperGrading',
        path: 'paper-grading',
        component: () => import('#/views/approval/paper-grading/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '试卷批改审批',
          appModule: 'LMS',
          permissions: ['LMS:APPROVAL:PAPER_GRADING:APPROVE'],
        },
      },
    ],
  },
];

export default routes;
