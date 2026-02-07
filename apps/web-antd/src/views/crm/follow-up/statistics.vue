<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { Card, Row, Col, Table, Progress, Select } from 'ant-design-vue';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

import {
  StatisticCardRow,
  RankingTable,
  TrendBarChart,
  StatisticsPageLayout,
  type StatisticItem,
  type RankingColumn,
  type TrendItem,
} from '#/components/statistics';
import { formatDate } from '#/hooks/useStatistics';

// ==================== 类型定义 ====================

interface FollowUpOverview {
  totalRecords: number;
  todayRecords: number;
  weekRecords: number;
  pendingCount: number;
  overdueCount: number;
  completedCount: number;
  avgRecordsPerDay: number;
  byType: Array<{ type: string; count: number }>;
  dailyTrend: Array<{ date: string; recordCount: number; completedCount: number }>;
  topUsers: Array<{ userId: number; userName: string | null; recordCount: number; completedCount: number }>;
  topCustomers: Array<{ customerId: number; customerName: string | null; recordCount: number; lastFollowUp: string | null }>;
}

interface EfficiencyData {
  completionRate: number;
  overdueRate: number;
  avgCompletionTime: number;
  byUser: Array<{
    userId: number;
    userName: string | null;
    totalRecords: number;
    completedCount: number;
    overdueCount: number;
    completionRate: number;
  }>;
}

interface UserRanking {
  userId: number;
  userName: string | null;
  totalRecords: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<FollowUpOverview | null>(null);
const efficiency = ref<EfficiencyData | null>(null);
const userRanking = ref<UserRanking[]>([]);
const rankingPeriod = ref<string>('week');

// ==================== 映射 ====================

const typeMap: Record<string, string> = {
  PHONE: '电话',
  VISIT: '拜访',
  WECHAT: '微信',
  EMAIL: '邮件',
  MEETING: '会议',
  OTHER: '其他',
};

// ==================== 统计卡片配置 ====================

const overviewCards = computed<StatisticItem[]>(() => [
  { title: '总跟进记录', value: overview.value?.totalRecords || 0, prefixIcon: FileTextOutlined },
  { title: '今日跟进', value: overview.value?.todayRecords || 0, valueColor: '#1890ff' },
  { title: '本周跟进', value: overview.value?.weekRecords || 0, valueColor: '#722ed1' },
  { title: '待办跟进', value: overview.value?.pendingCount || 0, prefixIcon: ClockCircleOutlined, valueColor: '#faad14' },
  { title: '已完成', value: overview.value?.completedCount || 0, prefixIcon: CheckCircleOutlined, valueColor: '#52c41a' },
  { title: '逾期跟进', value: overview.value?.overdueCount || 0, prefixIcon: ExclamationCircleOutlined, valueColor: '#ff4d4f' },
]);

// ==================== 表格列配置 ====================

const topUserColumns: RankingColumn[] = [
  { title: '排名', key: 'rank', width: 60, isRank: true },
  { title: '员工', dataIndex: 'userName', key: 'userName' },
  { title: '跟进数', dataIndex: 'recordCount', key: 'recordCount' },
  { title: '已完成', dataIndex: 'completedCount', key: 'completedCount' },
];

const topCustomerColumns: RankingColumn[] = [
  { title: '排名', key: 'rank', width: 60, isRank: true },
  { title: '客户', dataIndex: 'customerName', key: 'customerName' },
  { title: '跟进次数', dataIndex: 'recordCount', key: 'recordCount' },
];

// ==================== 趋势数据 ====================

const trendData = computed<TrendItem[]>(() =>
  (overview.value?.dailyTrend || []).map((item) => ({
    date: item.date,
    value: item.recordCount,
  })),
);

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, efficiencyRes, rankingRes] = await Promise.all([
      requestClient.get<FollowUpOverview>('/follow-ups/statistics/overview'),
      requestClient.get<EfficiencyData>('/follow-ups/statistics/efficiency'),
      requestClient.get<UserRanking[]>('/follow-ups/statistics/user-ranking', {
        params: { period: rankingPeriod.value, limit: 10 },
      }),
    ]);
    overview.value = overviewRes;
    efficiency.value = efficiencyRes;
    userRanking.value = rankingRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadRanking() {
  try {
    userRanking.value = await requestClient.get<UserRanking[]>(
      '/follow-ups/statistics/user-ranking',
      { params: { period: rankingPeriod.value, limit: 10 } },
    );
  } catch (error) {
    console.error('加载排名数据失败:', error);
  }
}

function handlePeriodChange() {
  loadRanking();
}

// ==================== 生命周期 ====================

onMounted(loadData);
</script>

<script lang="ts">
export default {
  name: 'FollowUpStatistics',
};
</script>

<template>
  <StatisticsPageLayout title="跟进统计分析" back-path="/crm/follow-up" :loading="loading">
    <!-- 概览统计卡片 -->
    <StatisticCardRow :items="overviewCards" />

    <!-- 效率指标 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card title="完成率">
          <div class="flex items-center justify-center">
            <Progress
              type="circle"
              :percent="Math.round(efficiency?.completionRate || 0)"
              :stroke-color="'#52c41a'"
              :size="120"
            />
          </div>
          <div class="mt-3 text-center text-gray-500">
            日均跟进: {{ (overview?.avgRecordsPerDay || 0).toFixed(1) }} 条
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="逾期率">
          <div class="flex items-center justify-center">
            <Progress
              type="circle"
              :percent="Math.round(efficiency?.overdueRate || 0)"
              :stroke-color="(efficiency?.overdueRate || 0) > 20 ? '#ff4d4f' : '#faad14'"
              :size="120"
            />
          </div>
          <div class="mt-3 text-center text-gray-500">
            平均完成时长: {{ (efficiency?.avgCompletionTime || 0).toFixed(1) }} 小时
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="跟进类型分布">
          <Table
            :columns="[
              { title: '跟进类型', dataIndex: 'type', key: 'type' },
              { title: '记录数', dataIndex: 'count', key: 'count' },
            ]"
            :data-source="(overview?.byType || []).map((item, index) => ({
              ...item,
              key: index,
              type: typeMap[item.type] || item.type,
            }))"
            :pagination="false"
            size="small"
          />
        </Card>
      </Col>
    </Row>

    <!-- 员工排名和客户排名 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <UserOutlined />
              <span>跟进最多员工 TOP5</span>
            </div>
          </template>
          <RankingTable
            title=""
            :data-source="(overview?.topUsers || []).slice(0, 5)"
            :columns="topUserColumns"
          />
        </Card>
      </Col>
      <Col :span="12">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <TeamOutlined />
              <span>跟进最多客户 TOP5</span>
            </div>
          </template>
          <Table
            :columns="[
              { title: '排名', key: 'rank', width: 60 },
              { title: '客户', dataIndex: 'customerName', key: 'customerName' },
              { title: '跟进次数', dataIndex: 'recordCount', key: 'recordCount' },
              { title: '最后跟进', dataIndex: 'lastFollowUp', key: 'lastFollowUp' },
            ]"
            :data-source="(overview?.topCustomers || []).slice(0, 5).map((item, index) => ({
              ...item,
              key: index,
              lastFollowUp: item.lastFollowUp ? formatDate(item.lastFollowUp) : '-',
            }))"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, index }">
              <template v-if="column.key === 'rank'">
                <span :class="{
                  'font-bold text-yellow-500': index === 0,
                  'font-bold text-gray-400': index === 1,
                  'font-bold text-amber-600': index === 2,
                }">{{ index + 1 }}</span>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>

    <!-- 员工效率分析 -->
    <Card title="员工效率分析" class="mb-4">
      <Table
        :columns="[
          { title: '员工', dataIndex: 'userName', key: 'userName' },
          { title: '总记录', dataIndex: 'totalRecords', key: 'totalRecords' },
          { title: '已完成', dataIndex: 'completedCount', key: 'completedCount' },
          { title: '逾期', dataIndex: 'overdueCount', key: 'overdueCount' },
          { title: '完成率', key: 'completionRate' },
        ]"
        :data-source="(efficiency?.byUser || []).map((item, index) => ({ ...item, key: index }))"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'completionRate'">
            <Progress
              :percent="Math.round(record.completionRate)"
              :size="80"
              :stroke-color="record.completionRate >= 80 ? '#52c41a' : record.completionRate >= 50 ? '#faad14' : '#ff4d4f'"
            />
          </template>
        </template>
      </Table>
    </Card>

    <!-- 员工跟进排行榜 -->
    <Card class="mb-4">
      <template #title>
        <div class="flex items-center justify-between">
          <span>员工跟进排行榜</span>
          <Select v-model:value="rankingPeriod" style="width: 120px" @change="handlePeriodChange">
            <Select.Option value="day">今日</Select.Option>
            <Select.Option value="week">本周</Select.Option>
            <Select.Option value="month">本月</Select.Option>
            <Select.Option value="all">全部</Select.Option>
          </Select>
        </div>
      </template>
      <Table
        :columns="[
          { title: '排名', key: 'rank', width: 60 },
          { title: '员工', dataIndex: 'userName', key: 'userName' },
          { title: '总跟进', dataIndex: 'totalRecords', key: 'totalRecords' },
          { title: '已完成', dataIndex: 'completedCount', key: 'completedCount' },
          { title: '待办中', dataIndex: 'pendingCount', key: 'pendingCount' },
          { title: '逾期', dataIndex: 'overdueCount', key: 'overdueCount' },
          { title: '完成率', key: 'completionRate' },
        ]"
        :data-source="userRanking.map((item, index) => ({ ...item, key: index }))"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'rank'">
            <span :class="{
              'font-bold text-yellow-500': index === 0,
              'font-bold text-gray-400': index === 1,
              'font-bold text-amber-600': index === 2,
            }">{{ index + 1 }}</span>
          </template>
          <template v-if="column.key === 'completionRate'">
            <Progress
              :percent="Math.round(record.completionRate)"
              :size="80"
              :stroke-color="record.completionRate >= 80 ? '#52c41a' : record.completionRate >= 50 ? '#faad14' : '#ff4d4f'"
            />
          </template>
        </template>
      </Table>
    </Card>

    <!-- 每日趋势 -->
    <TrendBarChart
      title="近7日跟进趋势"
      :data="trendData"
      label="跟进记录"
      color="#3b82f6"
    />
  </StatisticsPageLayout>
</template>
