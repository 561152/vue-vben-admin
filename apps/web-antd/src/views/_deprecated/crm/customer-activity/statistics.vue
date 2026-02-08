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
  Spin,
} from 'ant-design-vue';
import {
  MessageOutlined,
  UserOutlined,
  ShoppingOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface OverviewData {
  totalActivities: number;
  totalCustomersWithActivity: number;
  todayActivities: number;
  yesterdayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  avgActivitiesPerCustomer: number;
  byType: Array<{ activityType: string; count: number; percentage: number }>;
  byChannel: Array<{ channelType: string; count: number; percentage: number }>;
  trends: {
    today: number;
    yesterday: number;
    dayBeforeYesterday: number;
    weekOverWeekGrowth: number;
  };
}

interface TypeAnalysisData {
  messageActivities: {
    received: number;
    sent: number;
    totalMessages: number;
    messageRatio: number;
  };
  engagementActivities: {
    follows: number;
    unfollows: number;
    netFollows: number;
    likes: number;
    comments: number;
    shares: number;
    totalEngagement: number;
  };
  transactionActivities: {
    purchases: number;
    refunds: number;
    ordersCreated: number;
    ordersCompleted: number;
    ordersCancelled: number;
    conversionRate: number;
  };
  managementActivities: {
    tagAdded: number;
    tagRemoved: number;
    stageChanged: number;
    ownerChanged: number;
    profileUpdated: number;
  };
  liveActivities: {
    enters: number;
    comments: number;
    gifts: number;
  };
  recentTrends: Array<{
    activityType: string;
    last7Days: number;
    last30Days: number;
    trend: number;
  }>;
}

interface EngagementData {
  hourlyDistribution: Array<{
    hour: number;
    count: number;
    percentage: number;
  }>;
  dailyDistribution: Array<{
    dayOfWeek: number;
    dayName: string;
    count: number;
    percentage: number;
  }>;
  topActiveCustomers: Array<{
    customerId: number;
    activityCount: number;
    lastActivityAt: string | null;
  }>;
  activityFrequency: {
    highlyActive: number;
    active: number;
    moderate: number;
    low: number;
    inactive: number;
  };
  averageMetrics: {
    avgDailyActivities: number;
    avgWeeklyActivities: number;
    peakHour: number;
    peakDay: string;
  };
}

interface ChannelData {
  byChannel: Array<{
    channelType: string;
    totalActivities: number;
    messagesSent: number;
    messagesReceived: number;
    follows: number;
    unfollows: number;
    engagement: number;
  }>;
  channelEffectiveness: Array<{
    channelType: string;
    responseRate: number;
    engagementRate: number;
    activityScore: number;
  }>;
  crossChannelActivity: {
    singleChannel: number;
    multiChannel: number;
    avgChannelsPerCustomer: number;
  };
}

// ==================== 状态 ====================

const activeTab = ref('overview');
const loading = ref(false);

const overviewData = ref<OverviewData | null>(null);
const typeAnalysisData = ref<TypeAnalysisData | null>(null);
const engagementData = ref<EngagementData | null>(null);
const channelData = ref<ChannelData | null>(null);

// ==================== 活动类型映射 ====================

const activityTypeMap: Record<string, { label: string; color: string }> = {
  MESSAGE_RECEIVED: { label: '收到消息', color: 'blue' },
  MESSAGE_SENT: { label: '发送消息', color: 'cyan' },
  FOLLOW: { label: '关注', color: 'green' },
  UNFOLLOW: { label: '取关', color: 'red' },
  COMMENT: { label: '评论', color: 'orange' },
  LIKE: { label: '点赞', color: 'pink' },
  SHARE: { label: '分享', color: 'purple' },
  PURCHASE: { label: '购买', color: 'gold' },
  REFUND: { label: '退款', color: 'volcano' },
  TAG_ADDED: { label: '添加标签', color: 'lime' },
  TAG_REMOVED: { label: '移除标签', color: 'default' },
  STAGE_CHANGED: { label: '阶段变更', color: 'geekblue' },
  OWNER_CHANGED: { label: '归属变更', color: 'magenta' },
  PROFILE_UPDATED: { label: '资料更新', color: 'cyan' },
  ORDER_CREATED: { label: '创建订单', color: 'blue' },
  ORDER_COMPLETED: { label: '完成订单', color: 'green' },
  ORDER_CANCELLED: { label: '取消订单', color: 'red' },
  LIVE_ENTER: { label: '进入直播', color: 'purple' },
  LIVE_COMMENT: { label: '直播评论', color: 'orange' },
  LIVE_GIFT: { label: '直播打赏', color: 'gold' },
  OTHER: { label: '其他', color: 'default' },
};

const channelTypeMap: Record<string, { label: string; color: string }> = {
  WECOM: { label: '企业微信', color: 'green' },
  WECHAT: { label: '微信', color: 'lime' },
  DOUYIN: { label: '抖音', color: 'pink' },
  XIAOHONGSHU: { label: '小红书', color: 'red' },
  KUAISHOU: { label: '快手', color: 'orange' },
  SMS: { label: '短信', color: 'blue' },
  EMAIL: { label: '邮件', color: 'cyan' },
  PHONE: { label: '电话', color: 'purple' },
  OTHER: { label: '其他', color: 'default' },
};

// ==================== 表格列 ====================

const topCustomersColumns = [
  { title: '客户ID', dataIndex: 'customerId', key: 'customerId', width: 100 },
  {
    title: '活动次数',
    dataIndex: 'activityCount',
    key: 'activityCount',
    width: 100,
  },
  {
    title: '最后活动',
    key: 'lastActivityAt',
    customRender: ({ record }: { record: any }) =>
      record.lastActivityAt
        ? new Date(record.lastActivityAt).toLocaleString()
        : '-',
  },
];

const channelColumns = [
  {
    title: '渠道',
    key: 'channelType',
    customRender: ({ record }: { record: any }) => {
      const channel = channelTypeMap[record.channelType];
      return channel?.label || record.channelType;
    },
  },
  { title: '总活动', dataIndex: 'totalActivities', key: 'totalActivities' },
  { title: '发送消息', dataIndex: 'messagesSent', key: 'messagesSent' },
  { title: '收到消息', dataIndex: 'messagesReceived', key: 'messagesReceived' },
  { title: '关注', dataIndex: 'follows', key: 'follows' },
  { title: '互动', dataIndex: 'engagement', key: 'engagement' },
];

const trendColumns = [
  {
    title: '活动类型',
    key: 'activityType',
    customRender: ({ record }: { record: any }) => {
      const type = activityTypeMap[record.activityType];
      return type?.label || record.activityType;
    },
  },
  { title: '近7天', dataIndex: 'last7Days', key: 'last7Days' },
  { title: '近30天', dataIndex: 'last30Days', key: 'last30Days' },
  {
    title: '趋势',
    key: 'trend',
    customRender: ({ record }: { record: any }) => {
      const trend = record.trend;
      if (trend > 0) {
        return h('span', { style: { color: '#52c41a' } }, [
          h(RiseOutlined),
          ` ${trend.toFixed(1)}%`,
        ]);
      } else if (trend < 0) {
        return h('span', { style: { color: '#ff4d4f' } }, [
          h(FallOutlined),
          ` ${Math.abs(trend).toFixed(1)}%`,
        ]);
      }
      return '-';
    },
  },
];

// ==================== 数据加载 ====================

async function loadOverview() {
  try {
    overviewData.value = await requestClient.get(
      '/crm/customer-activities/statistics/overview',
    );
  } catch (error) {
    console.error('Failed to load overview:', error);
  }
}

async function loadTypeAnalysis() {
  try {
    typeAnalysisData.value = await requestClient.get(
      '/crm/customer-activities/statistics/type-analysis',
    );
  } catch (error) {
    console.error('Failed to load type analysis:', error);
  }
}

async function loadEngagement() {
  try {
    engagementData.value = await requestClient.get(
      '/crm/customer-activities/statistics/engagement',
    );
  } catch (error) {
    console.error('Failed to load engagement:', error);
  }
}

async function loadChannel() {
  try {
    channelData.value = await requestClient.get(
      '/crm/customer-activities/statistics/channel',
    );
  } catch (error) {
    console.error('Failed to load channel:', error);
  }
}

async function loadAllData() {
  loading.value = true;
  await Promise.all([
    loadOverview(),
    loadTypeAnalysis(),
    loadEngagement(),
    loadChannel(),
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
    <Card title="客户活动统计">
      <Spin :spinning="loading">
        <Tabs :active-key="activeTab" @change="handleTabChange">
          <!-- 统计概览 Tab -->
          <Tabs.TabPane key="overview" tab="统计概览">
            <div v-if="overviewData" class="space-y-6">
              <!-- 核心指标 -->
              <div class="grid grid-cols-4 gap-4">
                <Card size="small">
                  <Statistic
                    title="总活动数"
                    :value="overviewData.totalActivities"
                    :prefix="h(MessageOutlined)"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="活跃客户数"
                    :value="overviewData.totalCustomersWithActivity"
                    :prefix="h(UserOutlined)"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="今日活动"
                    :value="overviewData.todayActivities"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
                <Card size="small">
                  <Statistic
                    title="人均活动数"
                    :value="overviewData.avgActivitiesPerCustomer"
                    :precision="1"
                  />
                </Card>
              </div>

              <!-- 趋势对比 -->
              <Card title="趋势对比" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.today }}
                    </div>
                    <div class="text-gray-500">今日</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.trends.yesterday }}
                    </div>
                    <div class="text-gray-500">昨日</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.thisWeekActivities }}
                    </div>
                    <div class="text-gray-500">本周</div>
                    <div
                      v-if="overviewData.trends.weekOverWeekGrowth !== 0"
                      :class="
                        overviewData.trends.weekOverWeekGrowth > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      "
                    >
                      <component
                        :is="
                          overviewData.trends.weekOverWeekGrowth > 0
                            ? RiseOutlined
                            : FallOutlined
                        "
                      />
                      {{
                        Math.abs(
                          overviewData.trends.weekOverWeekGrowth,
                        ).toFixed(1)
                      }}%
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold">
                      {{ overviewData.thisMonthActivities }}
                    </div>
                    <div class="text-gray-500">本月</div>
                  </div>
                </div>
              </Card>

              <!-- 类型分布 & 渠道分布 -->
              <div class="grid grid-cols-2 gap-4">
                <Card title="活动类型分布" size="small">
                  <div class="max-h-64 space-y-2 overflow-y-auto">
                    <div
                      v-for="item in overviewData.byType.slice(0, 10)"
                      :key="item.activityType"
                      class="flex items-center justify-between"
                    >
                      <Tag
                        :color="
                          activityTypeMap[item.activityType]?.color || 'default'
                        "
                      >
                        {{
                          activityTypeMap[item.activityType]?.label ||
                          item.activityType
                        }}
                      </Tag>
                      <div class="flex flex-1 items-center px-4">
                        <Progress
                          :percent="item.percentage"
                          :show-info="false"
                          size="small"
                          class="flex-1"
                        />
                      </div>
                      <span class="w-16 text-right text-sm">
                        {{ item.count }}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card title="渠道分布" size="small">
                  <div class="space-y-2">
                    <div
                      v-for="item in overviewData.byChannel"
                      :key="item.channelType"
                      class="flex items-center justify-between"
                    >
                      <Tag
                        :color="
                          channelTypeMap[item.channelType]?.color || 'default'
                        "
                      >
                        {{
                          channelTypeMap[item.channelType]?.label ||
                          item.channelType
                        }}
                      </Tag>
                      <div class="flex flex-1 items-center px-4">
                        <Progress
                          :percent="item.percentage"
                          :show-info="false"
                          size="small"
                          class="flex-1"
                        />
                      </div>
                      <span class="w-16 text-right text-sm">
                        {{ item.count }}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Tabs.TabPane>

          <!-- 类型分析 Tab -->
          <Tabs.TabPane key="type-analysis" tab="类型分析">
            <div v-if="typeAnalysisData" class="space-y-6">
              <!-- 消息活动 -->
              <Card title="消息活动" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <Statistic
                    title="收到消息"
                    :value="typeAnalysisData.messageActivities.received"
                    :prefix="h(MessageOutlined)"
                  />
                  <Statistic
                    title="发送消息"
                    :value="typeAnalysisData.messageActivities.sent"
                  />
                  <Statistic
                    title="消息总数"
                    :value="typeAnalysisData.messageActivities.totalMessages"
                  />
                  <Statistic
                    title="发送占比"
                    :value="typeAnalysisData.messageActivities.messageRatio"
                    suffix="%"
                    :precision="1"
                  />
                </div>
              </Card>

              <!-- 互动活动 -->
              <Card title="互动活动" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <Statistic
                    title="关注"
                    :value="typeAnalysisData.engagementActivities.follows"
                    :value-style="{ color: '#52c41a' }"
                  />
                  <Statistic
                    title="取关"
                    :value="typeAnalysisData.engagementActivities.unfollows"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                  <Statistic
                    title="净关注"
                    :value="typeAnalysisData.engagementActivities.netFollows"
                    :value-style="{
                      color:
                        typeAnalysisData.engagementActivities.netFollows >= 0
                          ? '#52c41a'
                          : '#ff4d4f',
                    }"
                  />
                  <Statistic
                    title="总互动"
                    :value="
                      typeAnalysisData.engagementActivities.totalEngagement
                    "
                  />
                </div>
                <div class="mt-4 grid grid-cols-3 gap-4">
                  <Statistic
                    title="点赞"
                    :value="typeAnalysisData.engagementActivities.likes"
                  />
                  <Statistic
                    title="评论"
                    :value="typeAnalysisData.engagementActivities.comments"
                  />
                  <Statistic
                    title="分享"
                    :value="typeAnalysisData.engagementActivities.shares"
                  />
                </div>
              </Card>

              <!-- 交易活动 -->
              <Card title="交易活动" size="small">
                <div class="grid grid-cols-3 gap-4">
                  <Statistic
                    title="创建订单"
                    :value="
                      typeAnalysisData.transactionActivities.ordersCreated
                    "
                    :prefix="h(ShoppingOutlined)"
                  />
                  <Statistic
                    title="完成订单"
                    :value="
                      typeAnalysisData.transactionActivities.ordersCompleted
                    "
                    :value-style="{ color: '#52c41a' }"
                  />
                  <Statistic
                    title="转化率"
                    :value="
                      typeAnalysisData.transactionActivities.conversionRate
                    "
                    suffix="%"
                    :precision="1"
                  />
                </div>
              </Card>

              <!-- 近期趋势 -->
              <Card title="近期活动趋势" size="small">
                <Table
                  :columns="trendColumns"
                  :data-source="typeAnalysisData.recentTrends.slice(0, 10)"
                  :pagination="false"
                  size="small"
                  :row-key="(record: any) => record.activityType"
                />
              </Card>
            </div>
          </Tabs.TabPane>

          <!-- 活跃度分析 Tab -->
          <Tabs.TabPane key="engagement" tab="活跃度分析">
            <div v-if="engagementData" class="space-y-6">
              <!-- 平均指标 -->
              <Card title="平均指标" size="small">
                <div class="grid grid-cols-4 gap-4">
                  <Statistic
                    title="日均活动"
                    :value="engagementData.averageMetrics.avgDailyActivities"
                    :precision="1"
                  />
                  <Statistic
                    title="周均活动"
                    :value="engagementData.averageMetrics.avgWeeklyActivities"
                    :precision="1"
                  />
                  <Statistic
                    title="高峰小时"
                    :value="engagementData.averageMetrics.peakHour"
                    suffix="点"
                  />
                  <div class="text-center">
                    <div class="text-sm text-gray-500">高峰日</div>
                    <div class="text-2xl font-medium">
                      {{ engagementData.averageMetrics.peakDay }}
                    </div>
                  </div>
                </div>
              </Card>

              <!-- 活跃度分布 -->
              <Card title="客户活跃度分布" size="small">
                <div class="grid grid-cols-5 gap-4">
                  <div class="rounded border p-4 text-center">
                    <div class="text-2xl font-bold text-green-500">
                      {{ engagementData.activityFrequency.highlyActive }}
                    </div>
                    <div class="text-sm text-gray-500">高度活跃</div>
                    <div class="text-xs text-gray-400">50+ 活动</div>
                  </div>
                  <div class="rounded border p-4 text-center">
                    <div class="text-2xl font-bold text-blue-500">
                      {{ engagementData.activityFrequency.active }}
                    </div>
                    <div class="text-sm text-gray-500">活跃</div>
                    <div class="text-xs text-gray-400">20-49 活动</div>
                  </div>
                  <div class="rounded border p-4 text-center">
                    <div class="text-2xl font-bold text-yellow-500">
                      {{ engagementData.activityFrequency.moderate }}
                    </div>
                    <div class="text-sm text-gray-500">中等</div>
                    <div class="text-xs text-gray-400">10-19 活动</div>
                  </div>
                  <div class="rounded border p-4 text-center">
                    <div class="text-2xl font-bold text-orange-500">
                      {{ engagementData.activityFrequency.low }}
                    </div>
                    <div class="text-sm text-gray-500">低活跃</div>
                    <div class="text-xs text-gray-400">1-9 活动</div>
                  </div>
                  <div class="rounded border p-4 text-center">
                    <div class="text-2xl font-bold text-gray-400">
                      {{ engagementData.activityFrequency.inactive }}
                    </div>
                    <div class="text-sm text-gray-500">沉默</div>
                    <div class="text-xs text-gray-400">0 活动</div>
                  </div>
                </div>
              </Card>

              <!-- 时间分布 -->
              <div class="grid grid-cols-2 gap-4">
                <Card title="每日分布" size="small">
                  <div class="space-y-2">
                    <div
                      v-for="item in engagementData.dailyDistribution"
                      :key="item.dayOfWeek"
                      class="flex items-center justify-between"
                    >
                      <span class="w-12">{{ item.dayName }}</span>
                      <div class="flex flex-1 items-center px-4">
                        <Progress
                          :percent="item.percentage"
                          :show-info="false"
                          size="small"
                          class="flex-1"
                        />
                      </div>
                      <span class="w-16 text-right text-sm">
                        {{ item.count }}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card title="最活跃客户 TOP 10" size="small">
                  <Table
                    :columns="topCustomersColumns"
                    :data-source="engagementData.topActiveCustomers"
                    :pagination="false"
                    size="small"
                    :row-key="(record: any) => record.customerId"
                  />
                </Card>
              </div>
            </div>
          </Tabs.TabPane>

          <!-- 渠道分析 Tab -->
          <Tabs.TabPane key="channel" tab="渠道分析">
            <div v-if="channelData" class="space-y-6">
              <!-- 跨渠道分析 -->
              <Card title="跨渠道分析" size="small">
                <div class="grid grid-cols-3 gap-4">
                  <Statistic
                    title="单渠道客户"
                    :value="channelData.crossChannelActivity.singleChannel"
                  />
                  <Statistic
                    title="多渠道客户"
                    :value="channelData.crossChannelActivity.multiChannel"
                    :value-style="{ color: '#1890ff' }"
                  />
                  <Statistic
                    title="人均渠道数"
                    :value="
                      channelData.crossChannelActivity.avgChannelsPerCustomer
                    "
                    :precision="2"
                  />
                </div>
              </Card>

              <!-- 渠道详情 -->
              <Card title="渠道活动详情" size="small">
                <Table
                  :columns="channelColumns"
                  :data-source="channelData.byChannel"
                  :pagination="false"
                  size="small"
                  :row-key="(record: any) => record.channelType"
                />
              </Card>

              <!-- 渠道效果 -->
              <Card title="渠道效果分析" size="small">
                <div class="grid grid-cols-3 gap-4">
                  <div
                    v-for="item in channelData.channelEffectiveness"
                    :key="item.channelType"
                    class="rounded border p-4"
                  >
                    <Tag
                      :color="
                        channelTypeMap[item.channelType]?.color || 'default'
                      "
                      class="mb-2"
                    >
                      {{
                        channelTypeMap[item.channelType]?.label ||
                        item.channelType
                      }}
                    </Tag>
                    <div class="space-y-2">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">响应率</span>
                        <span>{{ item.responseRate.toFixed(1) }}%</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">互动率</span>
                        <span>{{ item.engagementRate.toFixed(1) }}%</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">活动评分</span>
                        <span class="font-medium">{{
                          item.activityScore
                        }}</span>
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
