import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:experiment-outlined',
      order: 6,
      title: 'AI 教师',
      appModule: 'EDUCATION',
    },
    name: 'Education',
    path: '/education',
    redirect: '/education/chat',
    children: [
      {
        name: 'EducationChat',
        path: 'chat',
        component: () => import('#/views/ai-tutor/chat/index.vue'),
        meta: {
          icon: 'ant-design:message-outlined',
          title: '智能辅导',
          appModule: 'EDUCATION',
          permissions: ['EDUCATION:TEACH:USE'],
        },
      },
      {
        name: 'MathCalculator',
        path: 'calculator',
        component: () => import('#/views/ai-tutor/calculator/index.vue'),
        meta: {
          icon: 'ant-design:calculator-outlined',
          title: '数学计算器',
          appModule: 'EDUCATION',
          permissions: ['EDUCATION:TEACH:USE'],
        },
      },
      {
        name: 'EducationProgress',
        path: 'progress',
        component: () => import('#/views/ai-tutor/progress/index.vue'),
        meta: {
          icon: 'ant-design:line-chart-outlined',
          title: '学习进度',
          appModule: 'EDUCATION',
          permissions: ['EDUCATION:ANALYSIS:VIEW'],
        },
      },
      {
        name: 'MistakeBook',
        path: 'mistakes',
        component: () => import('#/views/ai-tutor/mistakes/index.vue'),
        meta: {
          icon: 'ant-design:book-outlined',
          title: '错题本',
          appModule: 'EDUCATION',
          permissions: ['EDUCATION:TEACH:USE'],
        },
      },
      {
        name: 'EducationHomework',
        path: 'homework',
        component: () => import('#/views/ai-tutor/homework/index.vue'),
        meta: {
          icon: 'ant-design:edit-outlined',
          title: '作业管理',
          appModule: 'EDUCATION',
          permissions: ['EDUCATION:HOMEWORK:VIEW'],
        },
      },
    ],
  },
];

export default routes;
