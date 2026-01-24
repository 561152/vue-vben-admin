import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:robot-outlined',
      order: 5,
      title: 'AI 教师',
      appModule: 'LMS',
    },
    name: 'AITutor',
    path: '/ai-tutor',
    redirect: '/ai-tutor/chat',
    children: [
      {
        name: 'AITutorChat',
        path: 'chat',
        component: () => import('#/views/ai-tutor/chat/index.vue'),
        meta: {
          icon: 'ant-design:message-outlined',
          title: '智能辅导',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'MathCalculator',
        path: 'calculator',
        component: () => import('#/views/ai-tutor/calculator/index.vue'),
        meta: {
          icon: 'ant-design:calculator-outlined',
          title: '数学计算器',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'LearningProgress',
        path: 'progress',
        component: () => import('#/views/ai-tutor/progress/index.vue'),
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: '学习进度',
          appModule: 'LMS',
          permissions: ['LMS:STUDENT:VIEW'],
        },
      },
      {
        name: 'MistakeBook',
        path: 'mistakes',
        component: () => import('#/views/ai-tutor/mistakes/index.vue'),
        meta: {
          icon: 'ant-design:book-outlined',
          title: '错题本',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'OcrRecognition',
        path: 'ocr',
        component: () => import('#/views/ai-tutor/ocr/index.vue'),
        meta: {
          icon: 'ant-design:scan-outlined',
          title: '题目识别',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'HomeworkGrading',
        path: 'homework',
        component: () => import('#/views/ai-tutor/homework/index.vue'),
        meta: {
          icon: 'ant-design:edit-outlined',
          title: '作业批改',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'PaperAnalysis',
        path: 'paper',
        component: () => import('#/views/ai-tutor/paper/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '试卷分析',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'GradingHistory',
        path: 'grading-history',
        component: () => import('#/views/ai-tutor/grading-history/index.vue'),
        meta: {
          icon: 'ant-design:history-outlined',
          title: '批改历史',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
        },
      },
      {
        name: 'GradingDetail',
        path: 'grading/:id',
        component: () => import('#/views/ai-tutor/grading-detail/index.vue'),
        meta: {
          title: '批改详情',
          appModule: 'LMS',
          permissions: ['LMS:TUTOR:USE'],
          hideInMenu: true,
          activeMenu: '/ai-tutor/grading-history',
        },
      },
      {
        name: 'MistakeReview',
        path: 'mistake-review',
        meta: {
          icon: 'ant-design:check-circle-outlined',
          title: '错题审核',
          appModule: 'LMS',
          permissions: ['EDUCATION:PAPER:VIEW'],
        },
        children: [
          {
            name: 'MistakeList',
            path: '',
            component: () => import('#/views/ai-tutor/mistake-review/MistakeListPage.vue'),
            meta: {
              title: '错题列表',
              appModule: 'LMS',
              permissions: ['EDUCATION:PAPER:VIEW'],
              hideInMenu: false,
            },
          },
          {
            name: 'MistakeDetail',
            path: ':mistakeId',
            component: () => import('#/views/ai-tutor/mistake-review/MistakeDetailPage.vue'),
            meta: {
              title: '错题详情',
              appModule: 'LMS',
              permissions: ['EDUCATION:PAPER:VIEW'],
              hideInMenu: true,
              activeMenu: '/ai-tutor/mistake-review',
            },
          },
        ],
      },
      {
        name: 'QuestionBankImport',
        path: 'question-import',
        component: () => import('#/views/ai-tutor/mistake-review/QuestionBankImportPage.vue'),
        meta: {
          icon: 'ant-design:database-outlined',
          title: '题库导入',
          appModule: 'LMS',
          permissions: ['EDUCATION:QUESTION:IMPORT'],
        },
      },
    ],
  },
];

export default routes;
