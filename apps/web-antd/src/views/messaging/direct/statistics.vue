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
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface DirectMessageStatistics {
  totalMessages: number;
  todaySent: number;
  weekSent: number;
  pendingMessages: number;
  sendingMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  dailyTrend: Array<{
    date: string;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
  }>;
  topSenders: Array<{
    senderId: number;
    senderName: string | null;
    messageCount: number;
  }>;
  successRate: number;
  deliveryRate: number;
}

interface MessageHistory {
  id: number;
  customerId: number;
  customerName: string | null;
  messageType: string;
  status: string;
  textContent: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failReason: string | null;
  createdAt: string;
}

interface SenderRanking {
  senderId: number;
  senderName: string | null;
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  successRate: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const statistics = ref<DirectMessageStatistics | null>(null);
const messageHistory = ref<MessageHistory[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyLoading = ref(false);
const senderRanking = ref<SenderRanking[]>([]);
const senderRankingLoading = ref(false);
const rankingPeriod = ref<'day' | 'week' | 'month'>('week');
const retryLoading = ref(false);
const historyStatusFilter = ref<string | undefined>(undefined);

// ==================== 常量 ====================

const typeLabels: Record<string, string> = {
  SINGLE: '单发消息',
  BATCH: '批量消息',
  EMPLOYEE_BATCH: '员工群发',
  TEST: '测试消息',
  WELCOME: '欢迎语',
};

const statusLabels: Record<string, string> = {
  PENDING: '待发送',
  SENDING: '发送中',
  SENT: '已发送',
  DELIVERED: '已送达',
  FAILED: '失败',
};

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  SENDING: 'processing',
  SENT: 'blue',
  DELIVERED: 'success',
  FAILED: 'error',
};

const trendColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '发送', dataIndex: 'sentCount', key: 'sentCount' },
  { title: '送达', dataIndex: 'deliveredCount', key: 'deliveredCount' },
  { title: '失败', dataIndex: 'failedCount', key: 'failedCount' },
];

const topSendersColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '发送人', dataIndex: 'senderName', key: 'senderName' },
  {
    title: '消息数',
    dataIndex: 'messageCount',
    key: 'messageCount',
    width: 100,
  },
];

const senderRankingColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '发送人', dataIndex: 'senderName', key: 'senderName' },
  {
    title: '总消息',
    dataIndex: 'totalMessages',
    key: 'totalMessages',
    width: 80,
  },
  { title: '成功', dataIndex: 'sentMessages', key: 'sentMessages', width: 80 },
  {
    title: '失败',
    dataIndex: 'failedMessages',
    key: 'failedMessages',
    width: 80,
  },
  { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 100 },
];

const historyColumns = [
  { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
  { title: '类型', dataIndex: 'messageType', key: 'messageType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  {
    title: '内容',
    dataIndex: 'textContent',
    key: 'textContent',
    ellipsis: true,
  },
  { title: '发送时间', dataIndex: 'sentAt', key: 'sentAt', width: 160 },
  {
    title: '失败原因',
    dataIndex: 'failReason',
    key: 'failReason',
    ellipsis: true,
  },
];

// ==================== 计算属性 ====================

const inProgressCount = computed(() => {
  if (!statistics.value) return 0;
  return statistics.value.pendingMessages + statistics.value.sendingMessages;
});

// ==================== API ====================

async function fetchStatistics() {
  loading.value = true;
  try {
    const res = await requestClient.get<DirectMessageStatistics>(
      '/messaging/direct/statistics/overview',
    );
    statistics.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchMessageHistory() {
  historyLoading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: historyPage.value,
      pageSize: 10,
    };
    if (historyStatusFilter.value) {
      params.status = historyStatusFilter.value;
    }
    const res = await requestClient.get<{
      items: MessageHistory[];
      total: number;
    }>('/messaging/direct/statistics/history', { params });
    messageHistory.value = res.items || [];
    historyTotal.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    historyLoading.value = false;
  }
}

async function fetchSenderRanking() {
  senderRankingLoading.value = true;
  try {
    const res = await requestClient.get<SenderRanking[]>(
      '/messaging/direct/statistics/sender-ranking',
      { params: { period: rankingPeriod.value, limit: 10 } },
    );
    senderRanking.value = res || [];
  } catch (e) {
    console.error(e);
  } finally {
    senderRankingLoading.value = false;
  }
}

async function handleRetryFailed() {
  retryLoading.value = true;
  try {
    const res = await requestClient.post<{ retried: number; failed: number }>(
      '/messaging/direct/statistics/retry-failed',
    );
    if (res.retried > 0) {
      await Promise.all([fetchStatistics(), fetchMessageHistory()]);
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
  fetchMessageHistory();
}

function handlePeriodChange(value: unknown) {
  rankingPeriod.value = value as 'day' | 'week' | 'month';
  fetchSenderRanking();
}

function handleStatusFilterChange(value: unknown) {
  historyStatusFilter.value = value as string | undefined;
  historyPage.value = 1;
  fetchMessageHistory();
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

// ==================== 生命周期 ====================

onMounted(() => {
  fetchStatistics();
  fetchMessageHistory();
  fetchSenderRanking();
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
        <h2 class="ml-2 text-xl font-bold">消息推送统计</h2>
      </div>
      <Button
        v-if="statistics && statistics.failedMessages > 0"
        type="primary"
        :loading="retryLoading"
        @click="handleRetryFailed"
      >
        <ReloadOutlined /> 重试失败消息
      </Button>
    </div>

    <!-- Overview Statistics -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="4">
        <Card>
          <Statistic title="总消息数" :value="statistics.totalMessages" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="今日发送"
            :value="statistics.todaySent"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="本周发送" :value="statistics.weekSent" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="进行中"
            :value="inProgressCount"
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
            title="已送达"
            :value="statistics.deliveredMessages"
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

    <!-- Success & Delivery Rate -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="8">
        <Card title="发送成功率">
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
        <Card title="送达率">
          <div class="flex items-center justify-center py-4">
            <Progress
              type="circle"
              :percent="statistics.deliveryRate"
              :stroke-color="
                statistics.deliveryRate >= 80
                  ? '#52c41a'
                  : statistics.deliveryRate >= 50
                    ? '#faad14'
                    : '#ff4d4f'
              "
            />
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
              <SendOutlined class="text-gray-500" />
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
          <template v-if="column.key === 'sentCount'">
            <span class="text-blue-500">{{ record.sentCount }}</span>
          </template>
          <template v-if="column.key === 'deliveredCount'">
            <span class="text-green-500">{{ record.deliveredCount }}</span>
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
      <!-- Top Senders -->
      <Col :span="12">
        <Card title="发送人排行 TOP10">
          <Table
            :columns="topSendersColumns"
            :data-source="statistics?.topSenders || []"
            :pagination="false"
            size="small"
            row-key="senderId"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'rank'">
                <span
                  :class="{
                    'font-bold text-yellow-500': index === 0,
                    'font-bold text-gray-400': index === 1,
                    'font-bold text-orange-400': index === 2,
                  }"
                >
                  {{ index + 1 }}
                </span>
              </template>
              <template v-if="column.key === 'senderName'">
                <div class="flex items-center gap-2">
                  <UserOutlined class="text-gray-400" />
                  <span>{{ record.senderName || '未知用户' }}</span>
                </div>
              </template>
            </template>
          </Table>
        </Card>
      </Col>

      <!-- Sender Ranking by Period -->
      <Col :span="12">
        <Card title="发送人详细统计">
          <template #extra>
            <Select
              v-model:value="rankingPeriod"
              size="small"
              style="width: 100px"
              @change="handlePeriodChange"
            >
              <Select.Option value="day">今日</Select.Option>
              <Select.Option value="week">本周</Select.Option>
              <Select.Option value="month">本月</Select.Option>
            </Select>
          </template>
          <Table
            :columns="senderRankingColumns"
            :data-source="senderRanking"
            :loading="senderRankingLoading"
            :pagination="false"
            size="small"
            row-key="senderId"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'rank'">
                <span
                  :class="{
                    'font-bold text-yellow-500': index === 0,
                    'font-bold text-gray-400': index === 1,
                    'font-bold text-orange-400': index === 2,
                  }"
                >
                  {{ index + 1 }}
                </span>
              </template>
              <template v-if="column.key === 'senderName'">
                <div class="flex items-center gap-2">
                  <TeamOutlined class="text-gray-400" />
                  <span>{{ record.senderName || '未知用户' }}</span>
                </div>
              </template>
              <template v-if="column.key === 'sentMessages'">
                <span class="text-green-500">{{ record.sentMessages }}</span>
              </template>
              <template v-if="column.key === 'failedMessages'">
                <span :class="record.failedMessages > 0 ? 'text-red-500' : ''">
                  {{ record.failedMessages }}
                </span>
              </template>
              <template v-if="column.key === 'successRate'">
                <Progress
                  :percent="record.successRate"
                  size="small"
                  :stroke-color="
                    record.successRate >= 90
                      ? '#52c41a'
                      : record.successRate >= 70
                        ? '#faad14'
                        : '#ff4d4f'
                  "
                  :show-info="true"
                />
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>

    <!-- Status Distribution -->
    <Card class="mb-4" title="状态分布" v-if="statistics?.byStatus?.length">
      <div class="grid grid-cols-5 gap-4">
        <div
          v-for="item in statistics.byStatus"
          :key="item.status"
          class="rounded bg-gray-50 p-4 text-center"
        >
          <Tag :color="statusColors[item.status]" class="mb-2">
            {{ statusLabels[item.status] || item.status }}
          </Tag>
          <div class="text-2xl font-bold">{{ item.count }}</div>
        </div>
      </div>
    </Card>

    <!-- Message History -->
    <Card title="消息历史">
      <template #extra>
        <Select
          v-model:value="historyStatusFilter"
          placeholder="筛选状态"
          allow-clear
          style="width: 120px"
          @change="handleStatusFilterChange"
        >
          <Select.Option value="SENT">已发送</Select.Option>
          <Select.Option value="DELIVERED">已送达</Select.Option>
          <Select.Option value="FAILED">失败</Select.Option>
        </Select>
      </template>
      <Table
        :columns="historyColumns"
        :data-source="messageHistory"
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
          <template v-if="column.key === 'customerName'">
            <div class="flex items-center gap-1">
              <UserOutlined class="text-gray-400" />
              <span>{{ record.customerName || '未知客户' }}</span>
            </div>
          </template>
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
          <template v-if="column.key === 'sentAt'">
            {{ formatDate(record.sentAt) }}
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
