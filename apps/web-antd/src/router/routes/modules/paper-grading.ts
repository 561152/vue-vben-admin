import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:file-text-outlined',
      order: 7,
      title: '试卷批改',
      appModule: 'PAPER_GRADING',
    },
    name: 'PaperGrading',
    path: '/paper-grading',
    redirect: '/paper-grading/upload',
    children: [
      {
        name: 'PaperUpload',
        path: 'upload',
        component: () => import('#/views/ai-tutor/paper/index.vue'),
        meta: {
          icon: 'ant-design:upload-outlined',
          title: '上传试卷',
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:UPLOAD:CREATE'],
        },
      },
      {
        name: 'PaperOcr',
        path: 'ocr',
        component: () => import('#/views/ai-tutor/ocr/index.vue'),
        meta: {
          icon: 'ant-design:scan-outlined',
          title: 'OCR识别',
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:OCR:START'],
        },
      },
      {
        name: 'PaperGrade',
        path: 'grade',
        component: () => import('#/views/ai-tutor/homework/index.vue'),
        meta: {
          icon: 'ant-design:check-circle-outlined',
          title: '智能批改',
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:GRADE:START'],
        },
      },
      {
        name: 'PaperAnalysis',
        path: 'analysis',
        component: () => import('#/views/ai-tutor/paper/index.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '成绩分析',
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:ANALYSIS:VIEW'],
        },
      },
      {
        name: 'PaperGradingHistory',
        path: 'history',
        component: () => import('#/views/ai-tutor/grading-history/index.vue'),
        meta: {
          icon: 'ant-design:history-outlined',
          title: '批改历史',
          appModule: 'PAPER_GRADING',
          permissions: ['PAPER_GRADING:GRADE:VIEW'],
        },
      },
    ],
  },
];

export default routes;
