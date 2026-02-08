<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import type { Key } from 'ant-design-vue/es/_util/type';
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Progress,
  Tag,
  Alert,
  Spin,
} from 'ant-design-vue';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface OverviewData {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  expiredTasks: number;
  cancelledTasks: number;
  totalTargetCount: number;
  totalSuccessCount: number;
  totalFailCount: number;
  overallCompletionRate: number;
  overallSuccessRate: number;
  byStatus: Array<{ status: string; count: number; percentage: number }>;
  byType: Array<{ taskType: string; count: number; percentage: number }>;
  trends: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
  };
}

interface EmployeePerformanceData {
  topPerformers: Array<{
    wecomUserId: string;
    wecomUserName: string | null;
    totalTasks: number;
    completedTasks: number;
    successCount: number;
    failCount: number;
    completionRate: number;
  }>;
  lowPerformers: Array<{
    wecomUserId: string;
    wecomUserName: string | null;
    totalTasks: number;
    completedTasks: number;
    expiredTasks: number;
    completionRate: number;
  }>;
  performanceDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  averageMetrics: {
    avgTasksPerEmployee: number;
    avgCompletionRate: number;
    avgResponseTimeHours: number;
  };
}

interface TaskTypeAnalysisData {
  byType: Array<{
    taskType: string;
    totalTasks: number;
    completedTasks: number;
    expiredTasks: number;
    totalTarget: number;
    totalSuccess: number;
    completionRate: number;
    successRate: number;
  }>;
  typeEfficiency: Array<{
    taskType: string;
    avgSuccessRate: number;
    avgTargetPerTask: number;
  }>;
  recentByType: Array<{
    taskType: string;
    last7Days: number;
    last30Days: number;
  }>;
}

interface TimelinessData {
  completionTimeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  expirationAnalysis: {
    totalExpired: number;
    expirationRate: number;
    expiredByType: Array<{
      taskType: string;
      count: number;
      percentage: number;
    }>;
  };
  responseTimeAnalysis: {
    avgResponseTimeHours: number;
    medianResponseTimeHours: number;
    fastestResponseHours: number;
    slowestResponseHours: number;
  };
  pendingTasksAlert: {
    pendingOver24h: number;
    pendingOver48h: number;
    pendingOver72h: number;
    urgentTasks: Array<{
      id: number;
      wecomUserId: string;
      taskType: string;
      hoursAgo: number;
    }>;
  };
}

// ==================== 状态 ====================

const activeTab = ref('overview');
const loading = ref(false);

const overviewData = ref<OverviewData | null>(null);
const performanceData = ref<EmployeePerformanceData | null>(null);
const typeAnalysisData = ref<TaskTypeAnalysisData | null>(null);
const timelinessData = ref<TimelinessData | null>(null);

// ==================== 任务类型映射 ====================

const taskTypeMap: Record<string, { label: string; color: string }> = {
  MASS_SEND: { label: '群发消息', color: 'blue' },
  MOMENT_PUBLISH: { label: '朋友圈发布', color: 'green' },
  FOLLOW_UP: { label: '跟进任务', color: 'orange' },
  SURVEY: { label: '问卷调查', color: 'purple' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'default' },
  NOTIFIED: { label: '已通知', color: 'processing' },
  IN_PROGRESS: { label: '进行中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  EXPIRED: { label: '已过期', color: 'error' },
  CANCELLED: { label: '已取消', color: 'default' },
};

// ==================== 表格列 ====================

const topPerformersColumns = [
  {
    title: '员工',
    key: 'employee',
    customRender: ({ record }: { record: any }) =>
      record.wecomUserName || record.wecomUserId,
  },
  { title: '总任务', dataIndex: 'totalTasks', key: 'totalTasks' },
  { title: '已完成', dataIndex: 'completedTasks', key: 'completedTasks' },
  { title: '成功数', dataIndex: 'successCount', key: 'successCount' },
  {
    title: '完成率',
    key: 'completionRate',
    customRender: ({ record }: { record: any }) =>
      `${record.completionRate.toFixed(1)}%`,
  },
];

const lowPerformersColumns = [
  {
    title: '员工',
    key: 'employee',
    customRender: ({ record }: { record: any }) =>
      record.wecomUserName || record.wecomUserId,
  },
  { title: '总任务', dataIndex: 'totalTasks', key: 'totalTasks' },
  { title: '已完成', dataIndex: 'completedTasks', key: 'completedTasks' },
  { title: '已过期', dataIndex: 'expiredTasks', key: 'expiredTasks' },
  {
    title: '完成率',
    key: 'completionRate',
    customRender: ({ record }: { record: any }) =>
      `${record.completionRate.toFixed(1)}%`,
  },
];

const typeAnalysisColumns = [
  {
    title: '任务类型',
    key: 'taskType',
    customRender: ({ record }: { record: any }) =>
      taskTypeMap[record.taskType]?.label || record.taskType,
  },
  { title: '总任务', dataIndex: 'totalTasks', key: 'totalTasks' },
  { title: '已完成', dataIndex: 'completedTasks', key: 'completedTasks' },
  { title: '已过期', dataIndex: 'expiredTasks', key: 'expiredTasks' },
  { title: '目标总数', dataIndex: 'totalTarget', key: 'totalTarget' },
  { title: '成功数', dataIndex: 'totalSuccess', key: 'totalSuccess' },
  {
    title: '完成率',
    key: 'completionRate',
    customRender: ({ record }: { record: any }) =>
      `${record.completionRate.toFixed(1)}%`,
  },
  {
    title: '成功率',
    key: 'successRate',
    customRender: ({ record }: { record: any }) =>
      `${record.successRate.toFixed(1)}%`,
  },
];

const urgentTasksColumns = [
  { title: '任务ID', dataIndex: 'id', key: 'id' },
  { title: '员工ID', dataIndex: 'wecomUserId', key: 'wecomUserId' },
  {
    title: '任务类型',
    key: 'taskType',
    customRender: ({ record }: { record: any }) =>
      taskTypeMap[record.taskType]?.label || record.taskType,
  },
  {
    title: '等待时间',
    key: 'hoursAgo',
    customRender: ({ record }: { record: any }) =>
      `${record.hoursAgo.toFixed(1)} 小时`,
  },
];

// ==================== 数据加载 ====================

async function loadOverview() {
  try {
    overviewData.value = await requestClient.get(
      '/operations/employee-task/statistics/overview',
    );
  } catch (error) {
    console.error('Failed to load overview:', error);
  }
}

async function loadPerformance() {
  try {
    performanceData.value = await requestClient.get(
      '/operations/employee-task/statistics/employee-performance',
    );
  } catch (error) {
    console.error('Failed to load performance:', error);
  }
}

async function loadTypeAnalysis() {
  try {
    typeAnalysisData.value = await requestClient.get(
      '/operations/employee-task/statistics/task-type-analysis',
    );
  } catch (error) {
    console.error('Failed to load type analysis:', error);
  }
}

async function loadTimeliness() {
  try {
    timelinessData.value = await requestClient.get(
      '/operations/employee-task/statistics/timeliness',
    );
  } catch (error) {
    console.error('Failed to load timeliness:', error);
  }
}

async function loadAllData() {
  loading.value = true;
  await Promise.all([
    loadOverview(),
    loadPerformance(),
    loadTypeAnalysis(),
    loadTimeliness(),
  ]);
  loading.value = false;
}

function handleTabChange(key: Key) {
  activeTab.value = String(key);
}

onMounted(loadAllData);
</script>

<template>
  <div class="p-5">
    <Card title="员工任务统计">
      <Spin :spinning="loading">
        <Tabs :active-key="activeTab" @change="handleTabChange">
          <!-- 统计概览 Tab -->
          <Tabs.TabPane key="overview" tab="统计概览">
            <div v-if="overviewData" class="space-y-6">
              <!-- 核心指标 -->
              <div class="grid grid-cols-5 gap-4">
                <Card size="small">
                  <Statistic
                    title="总任务数"
                    :value="overviewData.totalTasks"
                    :prefix="h(TeamOutlined)"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="进行中"
                    :value="overviewData.activeTasks"
                    :prefix="h(ClockCircleOutlined)"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="已完成"
                    :value="overviewData.completedTasks"
                    :prefix="h(CheckCircleOutlined)"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="已过期"
                    :value="overviewData.expiredTasks"
                    :prefix="h(WarningOutlined)"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="完成率"
                    :value="overviewData.overallCompletionRate"
                    suffix="%"
                    :precision="1"
                  />
                </Card>
              </div>

              <!-- 触达数据 -->
              <Card title="触达数据" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <Statistic
                    title="目标总数"
                    :value="overviewData.totalTargetCount"
                  />
                  <Statistic
                    title="成功数"
                    :value="overviewData.totalSuccessCount"
                    :value-style="{ color: '#52c41a' }"
                  />
                  <Statistic
                    title="失败数"
                    :value="overviewData.totalFailCount"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                  <Statistic
                    title="成功率"
                    :value="overviewData.overallSuccessRate"
                    suffix="%"
                    :precision="1"
                  />
                </div>
              </Card>

              <!-- 趋势对比 -->
              <Card title="趋势对比" size="small">
                <div class="grid grid-cols-5 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.today }}
                    </div>
                    <div class="text-gray-500">今日创建</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.yesterday }}
                    </div>
                    <div class="text-gray-500">昨日创建</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.thisWeek }}
                    </div>
                    <div class="text-gray-500">本周创建</div>
                    <div
                      v-if="overviewData.trends.lastWeek > 0"
                      :class="
                        overviewData.trends.thisWeek >=
                        overviewData.trends.lastWeek
                          ? 'text-green-500'
                          : 'text-red-500'
                      "
                    >
                      <component
                        :is="
                          overviewData.trends.thisWeek >=
                          overviewData.trends.lastWeek
                            ? RiseOutlined
                            : FallOutlined
                        "
                      />
                      {{
                        (
                          ((overviewData.trends.thisWeek -
                            overviewData.trends.lastWeek) /
                            overviewData.trends.lastWeek) *
                          100
                        ).toFixed(0)
                      }}%
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.lastWeek }}
                    </div>
                    <div class="text-gray-500">上周创建</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.thisMonth }}
                    </div>
                    <div class="text-gray-500">本月创建</div>
                  </div>
                </div>
              </Card>

              <!-- 状态分布 & 类型分布 -->
              <div class="grid grid-cols-2 gap-4">
                <Card title="状态分布" size="small">
                  <div class="space-y-3">
                    <div
                      v-for="item in overviewData.byStatus"
                      :key="item.status"
                      class="flex items-center justify-between"
                    >
                      <Tag :color="statusMap[item.status]?.color || 'default'">
                        {{ statusMap[item.status]?.label || item.status }}
                      </Tag>
                      <div class="flex flex-1 items-center px-4">
                        <Progress
                          :percent="item.percentage"
                          :show-info="false"
                          size="small"
                          class="flex-1"
                        />
                      </div>
                      <span class="w-20 text-right">
                        {{ item.count }} ({{ item.percentage.toFixed(1) }}%)
                      </span>
                    </div>
                  </div>
                </Card>

                <Card title="类型分布" size="small">
                  <div class="space-y-3">
                    <div
                      v-for="item in overviewData.byType"
                      :key="item.taskType"
                      class="flex items-center justify-between"
                    >
                      <Tag
                        :color="taskTypeMap[item.taskType]?.color || 'default'"
                      >
                        {{ taskTypeMap[item.taskType]?.label || item.taskType }}
                      </Tag>
                      <div class="flex flex-1 items-center px-4">
                        <Progress
                          :percent="item.percentage"
                          :show-info="false"
                          size="small"
                          class="flex-1"
                        />
                      </div>
                      <span class="w-20 text-right">
                        {{ item.count }} ({{ item.percentage.toFixed(1) }}%)
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Tabs.TabPane>

          <!-- 员工绩效 Tab -->
          <Tabs.TabPane key="performance" tab="员工绩效">
            <div v-if="performanceData" class="space-y-6">
              <!-- 平均指标 -->
              <Card title="平均指标" size="small">
                <div class="grid grid-cols-3 gap-4">
                  <Statistic
                    title="人均任务数"
                    :value="performanceData.averageMetrics.avgTasksPerEmployee"
                    :precision="1"
                  />
                  <Statistic
                    title="平均完成率"
                    :value="performanceData.averageMetrics.avgCompletionRate"
                    suffix="%"
                    :precision="1"
                  />
                  <Statistic
                    title="平均响应时间"
                    :value="
                      performanceData.averageMetrics.avgResponseTimeHours || 0
                    "
                    suffix="小时"
                    :precision="1"
                  />
                </div>
              </Card>

              <!-- 完成率分布 -->
              <Card title="完成率分布" size="small">
                <div class="space-y-3">
                  <div
                    v-for="item in performanceData.performanceDistribution"
                    :key="item.range"
                    class="flex items-center justify-between"
                  >
                    <span class="w-24">{{ item.range }}</span>
                    <div class="flex flex-1 items-center px-4">
                      <Progress
                        :percent="item.percentage"
                        :show-info="false"
                        size="small"
                        class="flex-1"
                      />
                    </div>
                    <span class="w-20 text-right">
                      {{ item.count }} 人 ({{ item.percentage.toFixed(1) }}%)
                    </span>
                  </div>
                </div>
              </Card>

              <!-- 绩效排行 -->
              <div class="grid grid-cols-2 gap-4">
                <Card title="表现最佳员工 TOP 10" size="small">
                  <Table
                    :columns="topPerformersColumns"
                    :data-source="performanceData.topPerformers"
                    :pagination="false"
                    size="small"
                    :row-key="(record: any) => record.wecomUserId"
                  />
                </Card>

                <Card title="待改进员工" size="small">
                  <Table
                    :columns="lowPerformersColumns"
                    :data-source="performanceData.lowPerformers"
                    :pagination="false"
                    size="small"
                    :row-key="(record: any) => record.wecomUserId"
                  />
                </Card>
              </div>
            </div>
          </Tabs.TabPane>

          <!-- 类型分析 Tab -->
          <Tabs.TabPane key="type-analysis" tab="类型分析">
            <div v-if="typeAnalysisData" class="space-y-6">
              <!-- 按类型统计 -->
              <Card title="任务类型统计" size="small">
                <Table
                  :columns="typeAnalysisColumns"
                  :data-source="typeAnalysisData.byType"
                  :pagination="false"
                  size="small"
                  :row-key="(record: any) => record.taskType"
                />
              </Card>

              <!-- 近期趋势 -->
              <Card title="近期任务创建趋势" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <div
                    v-for="item in typeAnalysisData.recentByType"
                    :key="item.taskType"
                    class="rounded-lg border p-4"
                  >
                    <div class="mb-2">
                      <Tag
                        :color="taskTypeMap[item.taskType]?.color || 'default'"
                      >
                        {{ taskTypeMap[item.taskType]?.label || item.taskType }}
                      </Tag>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">近7天:</span>
                      <span class="font-medium">{{ item.last7Days }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">近30天:</span>
                      <span class="font-medium">{{ item.last30Days }}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <!-- 效率分析 -->
              <Card title="类型效率分析" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <div
                    v-for="item in typeAnalysisData.typeEfficiency"
                    :key="item.taskType"
                    class="rounded-lg border p-4"
                  >
                    <div class="mb-2">
                      <Tag
                        :color="taskTypeMap[item.taskType]?.color || 'default'"
                      >
                        {{ taskTypeMap[item.taskType]?.label || item.taskType }}
                      </Tag>
                    </div>
                    <Statistic
                      title="平均成功率"
                      :value="item.avgSuccessRate"
                      suffix="%"
                      :precision="1"
                    />
                    <div class="mt-2 text-sm text-gray-500">
                      人均目标: {{ item.avgTargetPerTask.toFixed(0) }}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Tabs.TabPane>

          <!-- 时效性分析 Tab -->
          <Tabs.TabPane key="timeliness" tab="时效性分析">
            <div v-if="timelinessData" class="space-y-6">
              <!-- 紧急告警 -->
              <Alert
                v-if="timelinessData.pendingTasksAlert.pendingOver24h > 0"
                type="warning"
                show-icon
                :message="`有 ${timelinessData.pendingTasksAlert.pendingOver24h} 个任务等待超过24小时未处理`"
              />

              <!-- 待处理任务告警 -->
              <Card title="待处理任务告警" size="small">
                <div class="mb-4 grid grid-cols-3 gap-4">
                  <Statistic
                    title="超过24小时"
                    :value="timelinessData.pendingTasksAlert.pendingOver24h"
                    :value-style="{ color: '#faad14' }"
                  />
                  <Statistic
                    title="超过48小时"
                    :value="timelinessData.pendingTasksAlert.pendingOver48h"
                    :value-style="{ color: '#ff7a45' }"
                  />
                  <Statistic
                    title="超过72小时"
                    :value="timelinessData.pendingTasksAlert.pendingOver72h"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                </div>

                <div
                  v-if="timelinessData.pendingTasksAlert.urgentTasks.length > 0"
                >
                  <div class="mb-2 font-medium">紧急任务列表：</div>
                  <Table
                    :columns="urgentTasksColumns"
                    :data-source="timelinessData.pendingTasksAlert.urgentTasks"
                    :pagination="false"
                    size="small"
                    :row-key="(record: any) => record.id"
                  />
                </div>
              </Card>

              <!-- 完成时间分布 -->
              <Card title="任务完成时间分布" size="small">
                <div class="space-y-3">
                  <div
                    v-for="item in timelinessData.completionTimeDistribution"
                    :key="item.range"
                    class="flex items-center justify-between"
                  >
                    <span class="w-24">{{ item.range }}</span>
                    <div class="flex flex-1 items-center px-4">
                      <Progress
                        :percent="item.percentage"
                        :show-info="false"
                        size="small"
                        class="flex-1"
                        :stroke-color="
                          item.range.includes('小时') ? '#52c41a' : '#faad14'
                        "
                      />
                    </div>
                    <span class="w-20 text-right">
                      {{ item.count }} ({{ item.percentage.toFixed(1) }}%)
                    </span>
                  </div>
                </div>
              </Card>

              <!-- 响应时间分析 -->
              <Card title="响应时间分析" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <Statistic
                    title="平均响应时间"
                    :value="
                      timelinessData.responseTimeAnalysis.avgResponseTimeHours
                    "
                    suffix="小时"
                    :precision="1"
                  />
                  <Statistic
                    title="中位响应时间"
                    :value="
                      timelinessData.responseTimeAnalysis
                        .medianResponseTimeHours
                    "
                    suffix="小时"
                    :precision="1"
                  />
                  <Statistic
                    title="最快响应"
                    :value="
                      timelinessData.responseTimeAnalysis.fastestResponseHours
                    "
                    suffix="小时"
                    :precision="1"
                    :value-style="{ color: '#52c41a' }"
                  />
                  <Statistic
                    title="最慢响应"
                    :value="
                      timelinessData.responseTimeAnalysis.slowestResponseHours
                    "
                    suffix="小时"
                    :precision="1"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                </div>
              </Card>

              <!-- 过期分析 -->
              <Card title="任务过期分析" size="small">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Statistic
                      title="总过期任务"
                      :value="timelinessData.expirationAnalysis.totalExpired"
                      :value-style="{ color: '#ff4d4f' }"
                    />
                    <div class="mt-2">
                      <span class="text-gray-500">过期率：</span>
                      <span class="font-medium">
                        {{
                          timelinessData.expirationAnalysis.expirationRate.toFixed(
                            1,
                          )
                        }}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div class="mb-2 font-medium">按类型分布：</div>
                    <div class="space-y-2">
                      <div
                        v-for="item in timelinessData.expirationAnalysis
                          .expiredByType"
                        :key="item.taskType"
                        class="flex justify-between"
                      >
                        <Tag
                          :color="
                            taskTypeMap[item.taskType]?.color || 'default'
                          "
                        >
                          {{
                            taskTypeMap[item.taskType]?.label || item.taskType
                          }}
                        </Tag>
                        <span>
                          {{ item.count }} ({{ item.percentage.toFixed(1) }}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Spin>
    </Card>
  </div>
</template>
