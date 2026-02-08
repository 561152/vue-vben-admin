import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:audit-outlined',
      order: 7,
      title: '审批中心',
      appModule: 'PAPER_GRADING',
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
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:APPROVAL:APPROVE'],
        },
      },
    ],
  },
];

export default routes;
