<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  Progress,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SendOutlined,
  MessageOutlined,
  ShareAltOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface ScheduledMessageStatistics {
  totalMessages: number;
  todayScheduled: number;
  weekScheduled: number;
  pendingMessages: number;
  confirmedMessages: number;
  executingMessages: number;
  completedMessages: number;
  failedMessages: number;
  cancelledMessages: number;
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  dailyTrend: Array<{
    date: string;
    scheduledCount: number;
    completedCount: number;
    failedCount: number;
  }>;
  upcomingMessages: Array<{
    id: number;
    name: string;
    messageType: string;
    scheduledAt: string;
    status: string;
  }>;
  successRate: number;
  avgExecutionTime: number | null;
}

interface ExecutionHistory {
  id: number;
  name: string;
  messageType: string;
  status: string;
  scheduledAt: string;
  executedAt: string | null;
  failReason: string | null;
}

interface TypeDistribution {
  type: string;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const statistics = ref<ScheduledMessageStatistics | null>(null);
const executionHistory = ref<ExecutionHistory[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyLoading = ref(false);
const typeDistribution = ref<TypeDistribution[]>([]);
const retryLoading = ref(false);
const historyStatusFilter = ref<string | undefined>(undefined);

// ==================== 常量 ====================

const typeLabels: Record<string, string> = {
  MASS: '群发消息',
  DIRECT: '私信消息',
  MOMENTS: '朋友圈',
};

const typeIcons: Record<string, any> = {
  MASS: SendOutlined,
  DIRECT: MessageOutlined,
  MOMENTS: ShareAltOutlined,
};

const statusLabels: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '待执行',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消',
};

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  EXECUTING: 'processing',
  COMPLETED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

const upcomingColumns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'messageType', key: 'messageType', width: 100 },
  {
    title: '计划时间',
    dataIndex: 'scheduledAt',
    key: 'scheduledAt',
    width: 160,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
];

const historyColumns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'messageType', key: 'messageType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  {
    title: '计划时间',
    dataIndex: 'scheduledAt',
    key: 'scheduledAt',
    width: 160,
  },
  { title: '执行时间', dataIndex: 'executedAt', key: 'executedAt', width: 160 },
  {
    title: '失败原因',
    dataIndex: 'failReason',
    key: 'failReason',
    ellipsis: true,
  },
];

const trendColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '计划任务', dataIndex: 'scheduledCount', key: 'scheduledCount' },
  { title: '完成任务', dataIndex: 'completedCount', key: 'completedCount' },
  { title: '失败任务', dataIndex: 'failedCount', key: 'failedCount' },
];

// ==================== 计算属性 ====================

const waitingCount = computed(() => {
  if (!statistics.value) return 0;
  return statistics.value.pendingMessages + statistics.value.confirmedMessages;
});

// ==================== API ====================

async function fetchStatistics() {
  loading.value = true;
  try {
    const res = await requestClient.get<ScheduledMessageStatistics>(
      '/scheduled-messages/statistics/overview',
    );
    statistics.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchExecutionHistory() {
  historyLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: historyPage.value,
      pageSize: 10,
    };
    if (historyStatusFilter.value) {
      params.status = historyStatusFilter.value;
    }
    const res = await requestClient.get<{
      items: ExecutionHistory[];
      total: number;
    }>('/scheduled-messages/statistics/history', { params });
    executionHistory.value = res.items || [];
    historyTotal.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    historyLoading.value = false;
  }
}

async function fetchTypeDistribution() {
  try {
    const res = await requestClient.get<TypeDistribution[]>(
      '/scheduled-messages/statistics/type-distribution',
    );
    typeDistribution.value = res || [];
  } catch (e) {
    console.error(e);
  }
}

async function handleRetryFailed() {
  retryLoading.value = true;
  try {
    const res = await requestClient.post<{ retried: number; failed: number }>(
      '/scheduled-messages/statistics/retry-failed',
    );
    if (res.retried > 0) {
      // 刷新数据
      await Promise.all([fetchStatistics(), fetchExecutionHistory()]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    retryLoading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleHistoryPageChange(page: number) {
  historyPage.value = page;
  fetchExecutionHistory();
}

function handleStatusFilterChange(value: unknown) {
  historyStatusFilter.value = value as string | undefined;
  historyPage.value = 1;
  fetchExecutionHistory();
}

function goBack() {
  window.history.back();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatExecutionTime(seconds: number | null): string {
  if (seconds === null) return '-';
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  return `${Math.round(seconds / 3600)}小时`;
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchStatistics();
  fetchExecutionHistory();
  fetchTypeDistribution();
});
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center">
        <Button type="text" @click="goBack">
          <ArrowLeftOutlined />
        </Button>
        <h2 class="ml-2 text-xl font-bold">定时消息统计</h2>
      </div>
      <Button
        v-if="statistics && statistics.failedMessages > 0"
        type="primary"
        :loading="retryLoading"
        @click="handleRetryFailed"
      >
        <ReloadOutlined /> 重试失败任务
      </Button>
    </div>

    <!-- Overview Statistics -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="4">
        <Card>
          <Statistic title="总任务数" :value="statistics.totalMessages" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="今日计划"
            :value="statistics.todayScheduled"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="本周计划" :value="statistics.weekScheduled" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="等待执行"
            :value="waitingCount"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="已完成"
            :value="statistics.completedMessages"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="失败"
            :value="statistics.failedMessages"
            :value-style="{ color: '#ff4d4f' }"
          >
            <template #prefix>
              <CloseCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- Success Rate & Execution Time -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="8">
        <Card title="执行成功率">
          <div class="flex items-center justify-center py-4">
            <Progress
              type="circle"
              :percent="statistics.successRate"
              :stroke-color="
                statistics.successRate >= 90
                  ? '#52c41a'
                  : statistics.successRate >= 70
                    ? '#faad14'
                    : '#ff4d4f'
              "
            />
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="平均执行延迟">
          <div class="flex items-center justify-center py-4">
            <Statistic
              :value="statistics.avgExecutionTime ?? 0"
              :formatter="
                () => formatExecutionTime(statistics?.avgExecutionTime ?? null)
              "
            >
              <template #prefix>
                <SyncOutlined class="text-blue-500" />
              </template>
            </Statistic>
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="按类型分布">
          <div class="flex flex-wrap gap-4 py-2">
            <div
              v-for="item in statistics.byType"
              :key="item.type"
              class="flex items-center gap-2"
            >
              <component :is="typeIcons[item.type]" class="text-gray-500" />
              <span>{{ typeLabels[item.type] || item.type }}</span>
              <span class="font-medium">{{ item.count }}</span>
            </div>
            <span v-if="!statistics.byType?.length" class="text-gray-400">
              暂无数据
            </span>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Type Distribution Details -->
    <Card class="mb-4" title="类型执行统计" v-if="typeDistribution.length">
      <Row :gutter="16">
        <Col :span="8" v-for="item in typeDistribution" :key="item.type">
          <Card size="small" :bordered="false" class="bg-gray-50">
            <div class="mb-2 flex items-center gap-2">
              <component :is="typeIcons[item.type]" />
              <span class="font-medium">{{
                typeLabels[item.type] || item.type
              }}</span>
            </div>
            <div class="mb-1 text-sm text-gray-500">
              总计: {{ item.total }} | 完成: {{ item.completed }} | 失败:
              {{ item.failed }}
            </div>
            <Progress
              :percent="item.successRate"
              size="small"
              :stroke-color="
                item.successRate >= 90
                  ? '#52c41a'
                  : item.successRate >= 70
                    ? '#faad14'
                    : '#ff4d4f'
              "
            />
          </Card>
        </Col>
      </Row>
    </Card>

    <!-- Daily Trend -->
    <Card class="mb-4" title="近7天趋势" v-if="statistics?.dailyTrend?.length">
      <Table
        :data-source="statistics.dailyTrend"
        :columns="trendColumns"
        :pagination="false"
        size="small"
        row-key="date"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'completedCount'">
            <span class="text-green-500">{{ record.completedCount }}</span>
          </template>
          <template v-if="column.key === 'failedCount'">
            <span :class="record.failedCount > 0 ? 'text-red-500' : ''">
              {{ record.failedCount }}
            </span>
          </template>
        </template>
      </Table>
    </Card>

    <Row :gutter="16" class="mb-4">
      <!-- Upcoming Messages -->
      <Col :span="12">
        <Card title="即将执行 (24小时内)">
          <Table
            :columns="upcomingColumns"
            :data-source="statistics?.upcomingMessages || []"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'messageType'">
                <Tag>{{
                  typeLabels[record.messageType] || record.messageType
                }}</Tag>
              </template>
              <template v-if="column.key === 'scheduledAt'">
                {{ formatDate(record.scheduledAt) }}
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="statusColors[record.status]">
                  {{ statusLabels[record.status] || record.status }}
                </Tag>
              </template>
            </template>
            <template #emptyText>
              <div class="py-4 text-center text-gray-400">
                <ClockCircleOutlined class="mb-2 text-2xl" />
                <p>暂无即将执行的任务</p>
              </div>
            </template>
          </Table>
        </Card>
      </Col>

      <!-- Status Distribution -->
      <Col :span="12">
        <Card title="状态分布">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="item in statistics?.byStatus"
              :key="item.status"
              class="rounded bg-gray-50 p-3 text-center"
            >
              <Tag :color="statusColors[item.status]" class="mb-2">
                {{ statusLabels[item.status] || item.status }}
              </Tag>
              <div class="text-xl font-bold">{{ item.count }}</div>
            </div>
          </div>
          <div
            v-if="!statistics?.byStatus?.length"
            class="py-4 text-center text-gray-400"
          >
            暂无状态数据
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Execution History -->
    <Card title="执行历史">
      <template #extra>
        <Select
          v-model:value="historyStatusFilter"
          placeholder="筛选状态"
          allow-clear
          style="width: 120px"
          @change="handleStatusFilterChange"
        >
          <Select.Option value="COMPLETED">已完成</Select.Option>
          <Select.Option value="FAILED">失败</Select.Option>
          <Select.Option value="CANCELLED">已取消</Select.Option>
        </Select>
      </template>
      <Table
        :columns="historyColumns"
        :data-source="executionHistory"
        :loading="historyLoading"
        :pagination="{
          current: historyPage,
          pageSize: 10,
          total: historyTotal,
          onChange: handleHistoryPageChange,
          size: 'small',
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'messageType'">
            <Tag>{{
              typeLabels[record.messageType] || record.messageType
            }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColors[record.status]">
              {{ statusLabels[record.status] || record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'scheduledAt'">
            {{ formatDate(record.scheduledAt) }}
          </template>
          <template v-if="column.key === 'executedAt'">
            {{ formatDate(record.executedAt) }}
          </template>
          <template v-if="column.key === 'failReason'">
            <span v-if="record.failReason" class="text-red-500">
              {{ record.failReason }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
