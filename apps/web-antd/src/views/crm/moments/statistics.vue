<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  LikeOutlined,
  CommentOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface MomentStatistics {
  totalTasks: number;
  todayTasks: number;
  weekTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  totalLikes: number;
  totalComments: number;
  byStatus: Array<{ status: string; count: number }>;
  dailyTrend: Array<{
    date: string;
    taskCount: number;
    likeCount: number;
    commentCount: number;
  }>;
}

interface InteractionRecord {
  id: number;
  momentTaskId: number;
  momentTaskName: string;
  externalUserid: string;
  externalName?: string;
  interactionType: string;
  content?: string;
  createdAt: string;
}

interface TopCustomer {
  externalUserid: string;
  likeCount: number;
  commentCount: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const statistics = ref<MomentStatistics | null>(null);
const interactions = ref<InteractionRecord[]>([]);
const interactionsTotal = ref(0);
const interactionsPage = ref(1);
const interactionsLoading = ref(false);
const topCustomers = ref<TopCustomer[]>([]);
const topCustomersLoading = ref(false);

// 筛选
const filterType = ref<string | undefined>(undefined);
const filterDateRange = ref<[string, string] | null>(null);

// ==================== 常量 ====================

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待发送', color: 'default' },
  SUBMITTED: { label: '已提交', color: 'processing' },
  POLLING: { label: '处理中', color: 'processing' },
  PUBLISHED: { label: '已发布', color: 'success' },
  SYNCING: { label: '同步中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
  CANCELLED: { label: '已取消', color: 'default' },
};

const interactionColumns = [
  {
    title: '任务名称',
    dataIndex: 'momentTaskName',
    key: 'momentTaskName',
    width: 200,
  },
  {
    title: '客户ID',
    dataIndex: 'externalUserid',
    key: 'externalUserid',
    width: 150,
  },
  {
    title: '互动类型',
    dataIndex: 'interactionType',
    key: 'interactionType',
    width: 100,
  },
  { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
];

const topCustomerColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '客户ID', dataIndex: 'externalUserid', key: 'externalUserid' },
  { title: '点赞数', dataIndex: 'likeCount', key: 'likeCount', width: 100 },
  {
    title: '评论数',
    dataIndex: 'commentCount',
    key: 'commentCount',
    width: 100,
  },
  { title: '总互动', key: 'total', width: 100 },
];

// ==================== API ====================

async function fetchStatistics() {
  loading.value = true;
  try {
    const res = await requestClient.get<MomentStatistics>(
      '/moments/statistics',
    );
    statistics.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchInteractions() {
  interactionsLoading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: interactionsPage.value,
      pageSize: 10,
    };
    if (filterType.value) {
      params.interactionType = filterType.value;
    }
    if (filterDateRange.value) {
      params.startDate = filterDateRange.value[0];
      params.endDate = filterDateRange.value[1];
    }

    const res = await requestClient.get<{
      items: InteractionRecord[];
      total: number;
    }>('/moments/interactions', { params });

    interactions.value = res.items || [];
    interactionsTotal.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    interactionsLoading.value = false;
  }
}

async function fetchTopCustomers() {
  topCustomersLoading.value = true;
  try {
    const res = await requestClient.get<TopCustomer[]>(
      '/moments/top-customers',
      {
        params: { limit: 10 },
      },
    );
    topCustomers.value = res || [];
  } catch (e) {
    console.error(e);
  } finally {
    topCustomersLoading.value = false;
  }
}

async function handleRetryFailed() {
  try {
    loading.value = true;
    const res = await requestClient.post<{
      total: number;
      succeeded: number;
      failed: number;
    }>('/moments/retry-failed');
    message.success(
      `重试完成：成功 ${res.succeeded} 条，失败 ${res.failed} 条`,
    );
    fetchStatistics();
  } catch (e: any) {
    message.error(e.message || '重试失败');
  } finally {
    loading.value = false;
  }
}

async function handleSyncInteractions() {
  try {
    loading.value = true;
    const res = await requestClient.post<{ synced: number }>(
      '/moments/sync-interactions',
    );
    message.success(`已同步 ${res.synced} 个任务的互动数据`);
    fetchStatistics();
    fetchInteractions();
  } catch (e: any) {
    message.error(e.message || '同步失败');
  } finally {
    loading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleInteractionPageChange(page: number) {
  interactionsPage.value = page;
  fetchInteractions();
}

function handleSearch() {
  interactionsPage.value = 1;
  fetchInteractions();
}

function goBack() {
  window.history.back();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInteractionTypeLabel(type: string): string {
  return type === 'LIKE' ? '点赞' : type === 'COMMENT' ? '评论' : type;
}

function getInteractionTypeColor(type: string): string {
  return type === 'LIKE' ? 'blue' : type === 'COMMENT' ? 'green' : 'default';
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchStatistics();
  fetchInteractions();
  fetchTopCustomers();
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
        <h2 class="ml-2 text-xl font-bold">朋友圈数据统计</h2>
      </div>
      <Space>
        <Button @click="handleSyncInteractions" :loading="loading">
          <SyncOutlined /> 同步互动数据
        </Button>
        <Button
          type="primary"
          @click="handleRetryFailed"
          :loading="loading"
          v-if="statistics?.failedTasks"
          danger
        >
          <ReloadOutlined /> 重试失败任务 ({{ statistics?.failedTasks }})
        </Button>
      </Space>
    </div>

    <!-- Statistics Cards -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="4">
        <Card>
          <Statistic title="总任务数" :value="statistics.totalTasks" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="今日任务"
            :value="statistics.todayTasks"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="本周任务" :value="statistics.weekTasks" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="已完成"
            :value="statistics.completedTasks"
            :value-style="{ color: '#3f8600' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="失败"
            :value="statistics.failedTasks"
            :value-style="{ color: '#cf1322' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="待处理"
            :value="statistics.pendingTasks"
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- Interaction Stats -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="6">
        <Card>
          <div class="flex items-center justify-between">
            <Statistic title="总点赞数" :value="statistics.totalLikes">
              <template #prefix>
                <LikeOutlined class="text-blue-500" />
              </template>
            </Statistic>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <div class="flex items-center justify-between">
            <Statistic title="总评论数" :value="statistics.totalComments">
              <template #prefix>
                <CommentOutlined class="text-green-500" />
              </template>
            </Statistic>
          </div>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="任务状态分布">
          <div class="flex flex-wrap gap-4">
            <div
              v-for="item in statistics.byStatus"
              :key="item.status"
              class="flex items-center gap-2"
            >
              <Tag :color="statusMap[item.status]?.color || 'default'">
                {{ statusMap[item.status]?.label || item.status }}
              </Tag>
              <span class="font-medium">{{ item.count }}</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Daily Trend -->
    <Card class="mb-4" title="近7天趋势" v-if="statistics?.dailyTrend?.length">
      <Table
        :data-source="statistics.dailyTrend"
        :pagination="false"
        size="small"
        row-key="date"
      >
        <Table.Column title="日期" dataIndex="date" key="date" />
        <Table.Column title="任务数" dataIndex="taskCount" key="taskCount" />
        <Table.Column title="点赞数" dataIndex="likeCount" key="likeCount" />
        <Table.Column
          title="评论数"
          dataIndex="commentCount"
          key="commentCount"
        />
      </Table>
    </Card>

    <Row :gutter="16" class="mb-4">
      <!-- Top Customers -->
      <Col :span="12">
        <Card title="活跃客户排行">
          <Table
            :columns="topCustomerColumns"
            :data-source="topCustomers"
            :loading="topCustomersLoading"
            :pagination="false"
            size="small"
            row-key="externalUserid"
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
              <template v-if="column.key === 'total'">
                {{ record.likeCount + record.commentCount }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>

      <!-- Recent Interactions -->
      <Col :span="12">
        <Card title="最近互动记录">
          <!-- Filters -->
          <div class="mb-4">
            <Space wrap>
              <Select
                v-model:value="filterType"
                placeholder="互动类型"
                style="width: 120px"
                allowClear
              >
                <Select.Option value="LIKE">点赞</Select.Option>
                <Select.Option value="COMMENT">评论</Select.Option>
              </Select>
              <DatePicker.RangePicker
                v-model:value="filterDateRange"
                style="width: 240px"
              />
              <Button type="primary" @click="handleSearch">查询</Button>
            </Space>
          </div>

          <Table
            :columns="interactionColumns"
            :data-source="interactions"
            :loading="interactionsLoading"
            :pagination="{
              current: interactionsPage,
              pageSize: 10,
              total: interactionsTotal,
              onChange: handleInteractionPageChange,
              size: 'small',
              showTotal: (t: number) => `共 ${t} 条`,
            }"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'interactionType'">
                <Tag :color="getInteractionTypeColor(record.interactionType)">
                  {{ getInteractionTypeLabel(record.interactionType) }}
                </Tag>
              </template>
              <template v-if="column.key === 'createdAt'">
                {{ formatDate(record.createdAt) }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>
