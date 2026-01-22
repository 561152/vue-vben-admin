import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:experiment-outlined',
      order: 7,
      title: 'AI 工作室',
      appModule: 'AI_STUDIO',
    },
    name: 'AIStudio',
    path: '/ai-studio',
    redirect: '/ai-studio/pipeline',
    children: [
      {
        name: 'AIPipeline',
        path: 'pipeline',
        component: () => import('#/views/ai-studio/pipeline/index.vue'),
        meta: {
          icon: 'ant-design:apartment-outlined',
          title: '流程管理',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:PIPELINE:LIST'],
        },
      },
      {
        name: 'AIPipelineEdit',
        path: 'pipeline/edit/:key',
        component: () => import('#/views/ai-studio/pipeline/edit.vue'),
        meta: {
          hideInMenu: true,
          title: '设计流程',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:PIPELINE:EDIT'],
        },
      },
      {
        name: 'AIComponent',
        path: 'component',
        component: () => import('#/views/ai-studio/component/index.vue'),
        meta: {
          icon: 'ant-design:appstore-outlined',
          title: '组件管理',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:COMPONENT:LIST'],
        },
      },
      {
        name: 'AIExecution',
        path: 'execution',
        component: () => import('#/views/ai-studio/execution/index.vue'),
        meta: {
          icon: 'ant-design:play-circle-outlined',
          title: '执行管理',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:EXECUTION:LIST'],
        },
      },
      {
        name: 'AIMetrics',
        path: 'metrics',
        component: () => import('#/views/ai-studio/metrics/index.vue'),
        meta: {
          icon: 'ant-design:dashboard-outlined',
          title: '性能指标',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:METRICS:DASHBOARD'],
        },
      },
      {
        name: 'AICost',
        path: 'cost',
        component: () => import('#/views/ai-studio/cost/index.vue'),
        meta: {
          icon: 'ant-design:dollar-outlined',
          title: '成本看板',
          appModule: 'AI_STUDIO',
          permissions: ['AI_STUDIO:COST:VIEW'],
        },
      },
    ],
  },
];

export default routes;
