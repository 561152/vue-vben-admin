<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Progress,
  Select,
  message,
  Tag,
  Spin,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import {
  campaignStatusOptions,
  campaignTypeOptions,
  findOption,
} from '#/constants/crm-options';
import dayjs from 'dayjs';

const router = useRouter();

// ==================== 类型定义 ====================

interface StatisticsOverview {
  totalCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
  scheduledCampaigns: number;
  draftCampaigns: number;
  pendingApprovalCampaigns: number;
  totalTarget: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  overallDeliveryRate: number;
  overallSuccessRate: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  dailyTrend: Array<{
    date: string;
    createdCount: number;
    completedCount: number;
    sentCount: number;
  }>;
  topCampaigns: Array<{
    id: number;
    name: string;
    totalTarget: number;
    totalDelivered: number;
    deliveryRate: number;
  }>;
}

interface CampaignHistoryRecord {
  id: number;
  name: string;
  type: string;
  status: string;
  audienceName: string | null;
  totalTarget: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface AudiencePerformance {
  audienceId: number;
  audienceName: string;
  campaignCount: number;
  totalTarget: number;
  totalDelivered: number;
  avgDeliveryRate: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<StatisticsOverview | null>(null);
const history = ref<CampaignHistoryRecord[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyPageSize = ref(10);
const audiencePerformance = ref<AudiencePerformance[]>([]);
const performancePeriod = ref<'week' | 'month' | 'quarter'>('month');

// ==================== 表格列定义 ====================

const historyColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '活动名称', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = findOption(campaignTypeOptions, text);
      return h(
        Tag,
        { color: opt?.color || 'default' },
        () => opt?.label || text,
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = findOption(campaignStatusOptions, text);
      return h(
        Tag,
        { color: opt?.color || 'default' },
        () => opt?.label || text,
      );
    },
  },
  {
    title: '人群包',
    dataIndex: 'audienceName',
    key: 'audienceName',
    width: 120,
  },
  {
    title: '目标人数',
    dataIndex: 'totalTarget',
    key: 'totalTarget',
    width: 100,
  },
  { title: '已发送', dataIndex: 'totalSent', key: 'totalSent', width: 80 },
  {
    title: '已送达',
    dataIndex: 'totalDelivered',
    key: 'totalDelivered',
    width: 80,
  },
  {
    title: '送达率',
    dataIndex: 'deliveryRate',
    key: 'deliveryRate',
    width: 100,
    customRender: ({ text }: { text: number }) => `${text}%`,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
  },
];

const topCampaignsColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '活动名称', dataIndex: 'name', key: 'name' },
  {
    title: '目标人数',
    dataIndex: 'totalTarget',
    key: 'totalTarget',
    width: 100,
  },
  {
    title: '已送达',
    dataIndex: 'totalDelivered',
    key: 'totalDelivered',
    width: 100,
  },
  {
    title: '送达率',
    dataIndex: 'deliveryRate',
    key: 'deliveryRate',
    width: 120,
    customRender: ({ text }: { text: number }) => {
      const color = text >= 80 ? '#52c41a' : text >= 50 ? '#faad14' : '#ff4d4f';
      return h(Progress, {
        percent: text,
        size: 'small',
        strokeColor: color,
        format: () => `${text}%`,
      });
    },
  },
];

const audienceColumns = [
  { title: '人群包名称', dataIndex: 'audienceName', key: 'audienceName' },
  {
    title: '活动数',
    dataIndex: 'campaignCount',
    key: 'campaignCount',
    width: 80,
  },
  {
    title: '目标总人数',
    dataIndex: 'totalTarget',
    key: 'totalTarget',
    width: 100,
  },
  {
    title: '送达总人数',
    dataIndex: 'totalDelivered',
    key: 'totalDelivered',
    width: 100,
  },
  {
    title: '平均送达率',
    dataIndex: 'avgDeliveryRate',
    key: 'avgDeliveryRate',
    width: 120,
    customRender: ({ text }: { text: number }) => {
      const color = text >= 80 ? '#52c41a' : text >= 50 ? '#faad14' : '#ff4d4f';
      return h(Progress, {
        percent: text,
        size: 'small',
        strokeColor: color,
        format: () => `${text}%`,
      });
    },
  },
];

// ==================== API 调用 ====================

async function fetchOverview() {
  try {
    loading.value = true;
    overview.value = await requestClient.get<StatisticsOverview>(
      '/marketing/campaign/statistics/overview',
    );
  } catch (error) {
    message.error('获取统计数据失败');
  } finally {
    loading.value = false;
  }
}

async function fetchHistory() {
  try {
    const response = await requestClient.get<{
      items: CampaignHistoryRecord[];
      total: number;
    }>('/marketing/campaign/statistics/history', {
      params: {
        page: historyPage.value,
        pageSize: historyPageSize.value,
      },
    });
    history.value = response.items || [];
    historyTotal.value = response.total || 0;
  } catch (error) {
    message.error('获取历史记录失败');
  }
}

async function fetchAudiencePerformance() {
  try {
    audiencePerformance.value = await requestClient.get<AudiencePerformance[]>(
      '/marketing/campaign/statistics/audience-performance',
      {
        params: { period: performancePeriod.value, limit: 10 },
      },
    );
  } catch (error) {
    message.error('获取人群包效果数据失败');
  }
}

async function retryFailed() {
  try {
    const result = await requestClient.post<{
      retried: number;
      failed: number;
    }>('/marketing/campaign/statistics/retry-failed');
    if (result.retried > 0) {
      message.success(`已重试 ${result.retried} 个活动`);
      fetchOverview();
      fetchHistory();
    } else {
      message.info('没有需要重试的失败活动');
    }
  } catch (error) {
    message.error('重试失败');
  }
}

function handleHistoryPageChange(page: number, pageSize: number) {
  historyPage.value = page;
  historyPageSize.value = pageSize;
  fetchHistory();
}

function handlePeriodChange() {
  fetchAudiencePerformance();
}

function goBack() {
  router.push('/marketing/campaign');
}

function refresh() {
  fetchOverview();
  fetchHistory();
  fetchAudiencePerformance();
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchOverview();
  fetchHistory();
  fetchAudiencePerformance();
});
</script>

<template>
  <div class="p-5">
    <Spin :spinning="loading">
      <!-- 头部操作栏 -->
      <Card class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button @click="goBack">
              <template #icon><ArrowLeftOutlined /></template>
              返回
            </Button>
            <h2 class="m-0 text-lg font-semibold">营销活动统计</h2>
          </div>
          <div class="flex gap-2">
            <Button @click="retryFailed">重试失败活动</Button>
            <Button type="primary" @click="refresh">
              <template #icon><ReloadOutlined /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="6">
          <Card>
            <Statistic
              title="活动总数"
              :value="overview?.totalCampaigns || 0"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <SendOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="已完成"
              :value="overview?.completedCampaigns || 0"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="运行中"
              :value="overview?.runningCampaigns || 0"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <ClockCircleOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="待审批"
              :value="overview?.pendingApprovalCampaigns || 0"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <TeamOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- 发送统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="6">
          <Card>
            <Statistic
              title="目标总人数"
              :value="overview?.totalTarget || 0"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="已发送"
              :value="overview?.totalSent || 0"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="已送达"
              :value="overview?.totalDelivered || 0"
              :value-style="{ color: '#13c2c2' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="发送失败"
              :value="overview?.totalFailed || 0"
              :value-style="{ color: '#ff4d4f' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 送达率和成功率 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="整体送达率">
            <div class="flex items-center justify-center py-4">
              <Progress
                type="circle"
                :percent="overview?.overallDeliveryRate || 0"
                :width="120"
                :stroke-color="{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }"
              >
                <template #format="percent">
                  <span class="text-2xl font-bold">{{ percent }}%</span>
                </template>
              </Progress>
            </div>
            <div class="mt-4 text-center text-gray-500">
              已送达 {{ overview?.totalDelivered || 0 }} / 已发送
              {{ overview?.totalSent || 0 }}
            </div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="整体成功率">
            <div class="flex items-center justify-center py-4">
              <Progress
                type="circle"
                :percent="overview?.overallSuccessRate || 0"
                :width="120"
                :stroke-color="{
                  '0%': '#faad14',
                  '100%': '#52c41a',
                }"
              >
                <template #format="percent">
                  <span class="text-2xl font-bold">{{ percent }}%</span>
                </template>
              </Progress>
            </div>
            <div class="mt-4 text-center text-gray-500">
              成功发送
              {{ (overview?.totalSent || 0) - (overview?.totalFailed || 0) }} /
              目标 {{ overview?.totalTarget || 0 }}
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 效果排行 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="活动效果排行 TOP 10">
            <Table
              :columns="topCampaignsColumns"
              :data-source="overview?.topCampaigns || []"
              :pagination="false"
              size="small"
              :row-key="(record: any) => record.id"
            >
              <template #bodyCell="{ column, index }">
                <template v-if="column.key === 'rank'">
                  <span
                    :class="{
                      'font-bold text-red-500': index < 3,
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="人群包效果分析">
            <template #extra>
              <Select
                v-model:value="performancePeriod"
                style="width: 100px"
                @change="handlePeriodChange"
              >
                <Select.Option value="week">近一周</Select.Option>
                <Select.Option value="month">近一月</Select.Option>
                <Select.Option value="quarter">近三月</Select.Option>
              </Select>
            </template>
            <Table
              :columns="audienceColumns"
              :data-source="audiencePerformance"
              :pagination="false"
              size="small"
              :row-key="(record: any) => record.audienceId"
            />
          </Card>
        </Col>
      </Row>

      <!-- 每日趋势 -->
      <Card title="近7天活动趋势" class="mb-4">
        <Table
          :columns="[
            { title: '日期', dataIndex: 'date', key: 'date' },
            {
              title: '新建活动数',
              dataIndex: 'createdCount',
              key: 'createdCount',
            },
            {
              title: '完成活动数',
              dataIndex: 'completedCount',
              key: 'completedCount',
            },
            { title: '发送消息数', dataIndex: 'sentCount', key: 'sentCount' },
          ]"
          :data-source="overview?.dailyTrend || []"
          :pagination="false"
          size="small"
          :row-key="(record: any) => record.date"
        />
      </Card>

      <!-- 历史记录 -->
      <Card title="活动历史记录">
        <Table
          :columns="historyColumns"
          :data-source="history"
          :pagination="{
            current: historyPage,
            pageSize: historyPageSize,
            total: historyTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条`,
            onChange: handleHistoryPageChange,
          }"
          :scroll="{ x: 1200 }"
          size="small"
          :row-key="(record: any) => record.id"
        />
      </Card>
    </Spin>
  </div>
</template>
