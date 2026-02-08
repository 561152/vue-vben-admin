<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import {
  Card,
  Tabs,
  TabPane,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  message,
} from 'ant-design-vue';
import {
  ApiOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  DisconnectOutlined,
  StarOutlined,
  PlusCircleOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import type { Key } from 'ant-design-vue/es/_util/type';

import {
  StatisticCardRow,
  StatisticsPageLayout,
  type StatisticItem,
} from '#/components/statistics';

// ==================== 状态 ====================

const activeTab = ref('overview');
const loading = ref({
  overview: false,
  type: false,
  interaction: false,
  growth: false,
});

// ==================== 数据 ====================

const overview = ref({
  totalChannels: 0,
  activeChannels: 0,
  followingChannels: 0,
  unfollowedChannels: 0,
  primaryChannels: 0,
  todayNewChannels: 0,
  weekNewChannels: 0,
  monthNewChannels: 0,
});

const typeAnalysis = ref({
  byType: [] as Array<{
    channelType: string;
    count: number;
    activeCount: number;
    followingCount: number;
    percentage: number;
  }>,
  totalTypes: 0,
  mostPopularType: null as string | null,
});

const interaction = ref({
  totalMessages: 0,
  avgMessagesPerChannel: 0,
  avgInteractionScore: 0,
  topInteractingChannels: [] as Array<{
    id: number;
    channelType: string;
    channelUsername: string | null;
    messageCount: number;
    interactionScore: number;
    lastMessageAt: Date | null;
  }>,
});

const growth = ref({
  dailyGrowth: [] as Array<{
    date: string;
    newChannels: number;
    unfollowed: number;
    netGrowth: number;
  }>,
  growthRate: 0,
  avgDailyNewChannels: 0,
  avgDailyUnfollowed: 0,
});

// ==================== 映射 ====================

const channelTypeMap: Record<string, string> = {
  WECOM: '企业微信',
  WECHAT_MP: '微信公众号',
  WECHAT_MINI: '微信小程序',
  DOUYIN: '抖音',
  XIAOHONGSHU: '小红书',
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  SMS: '短信',
  EMAIL: '邮件',
};

const channelTypeColors: Record<string, string> = {
  WECOM: '#07c160',
  WECHAT_MP: '#07c160',
  WECHAT_MINI: '#07c160',
  DOUYIN: '#000000',
  XIAOHONGSHU: '#ff2442',
  WHATSAPP: '#25d366',
  TELEGRAM: '#0088cc',
  SMS: '#1890ff',
  EMAIL: '#faad14',
};

// ==================== 统计卡片配置 ====================

const overviewCards1 = computed<StatisticItem[]>(() => [
  {
    title: '总渠道数',
    value: overview.value.totalChannels,
    prefixIcon: ApiOutlined,
    valueColor: '#1890ff',
  },
  {
    title: '活跃渠道',
    value: overview.value.activeChannels,
    prefixIcon: CheckCircleOutlined,
    valueColor: '#52c41a',
  },
  {
    title: '关注中',
    value: overview.value.followingChannels,
    prefixIcon: HeartOutlined,
    valueColor: '#722ed1',
  },
  {
    title: '取消关注',
    value: overview.value.unfollowedChannels,
    prefixIcon: DisconnectOutlined,
    valueColor: '#ff4d4f',
  },
]);

const overviewCards2 = computed<StatisticItem[]>(() => [
  {
    title: '主渠道数',
    value: overview.value.primaryChannels,
    prefixIcon: StarOutlined,
    valueColor: '#faad14',
  },
  {
    title: '今日新增',
    value: overview.value.todayNewChannels,
    prefixIcon: PlusCircleOutlined,
    valueColor: '#13c2c2',
  },
  {
    title: '本周新增',
    value: overview.value.weekNewChannels,
    prefixIcon: RiseOutlined,
    valueColor: '#2f54eb',
  },
  {
    title: '本月新增',
    value: overview.value.monthNewChannels,
    prefixIcon: CalendarOutlined,
    valueColor: '#eb2f96',
  },
]);

const interactionCards = computed<StatisticItem[]>(() => [
  {
    title: '总消息数',
    value: interaction.value.totalMessages,
    prefixIcon: MessageOutlined,
    valueColor: '#1890ff',
  },
  {
    title: '平均消息数/渠道',
    value: interaction.value.avgMessagesPerChannel,
    valueColor: '#52c41a',
  },
  {
    title: '平均互动分数',
    value: interaction.value.avgInteractionScore,
    valueColor: '#722ed1',
  },
  {
    title: '活跃渠道数',
    value: interaction.value.topInteractingChannels.length,
    valueColor: '#faad14',
  },
]);

const growthCards = computed<StatisticItem[]>(() => [
  {
    title: '30天增长率',
    value: growth.value.growthRate,
    suffix: '%',
    valueColor: growth.value.growthRate >= 0 ? '#52c41a' : '#ff4d4f',
  },
  {
    title: '日均新增',
    value: growth.value.avgDailyNewChannels,
    valueColor: '#1890ff',
  },
  {
    title: '日均取关',
    value: growth.value.avgDailyUnfollowed,
    valueColor: '#ff4d4f',
  },
  {
    title: '净增长',
    value: growth.value.avgDailyNewChannels - growth.value.avgDailyUnfollowed,
    valueColor: '#722ed1',
  },
]);

// ==================== 工具函数 ====================

const getChannelTypeName = (type: string | null) =>
  type ? channelTypeMap[type] || type : '-';
const getChannelTypeColor = (type: string) =>
  channelTypeColors[type] || '#1890ff';

const formatDate = (date: Date | string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const handleTabChange = (key: Key) => {
  activeTab.value = String(key);
  loadTabData(String(key));
};

// ==================== API 调用 ====================

const loadOverview = async () => {
  loading.value.overview = true;
  try {
    overview.value = await requestClient.get(
      '/customer-channels/statistics/overview',
    );
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadTypeAnalysis = async () => {
  loading.value.type = true;
  try {
    typeAnalysis.value = await requestClient.get(
      '/customer-channels/statistics/type-analysis',
    );
  } catch (error) {
    message.error('加载类型分析失败');
  } finally {
    loading.value.type = false;
  }
};

const loadInteraction = async () => {
  loading.value.interaction = true;
  try {
    interaction.value = await requestClient.get(
      '/customer-channels/statistics/interaction',
    );
  } catch (error) {
    message.error('加载互动分析失败');
  } finally {
    loading.value.interaction = false;
  }
};

const loadGrowth = async () => {
  loading.value.growth = true;
  try {
    growth.value = await requestClient.get(
      '/customer-channels/statistics/growth',
    );
  } catch (error) {
    message.error('加载增长分析失败');
  } finally {
    loading.value.growth = false;
  }
};

const loadTabData = (tab: string) => {
  switch (tab) {
    case 'overview':
      loadOverview();
      break;
    case 'type':
      loadTypeAnalysis();
      break;
    case 'interaction':
      loadInteraction();
      break;
    case 'growth':
      loadGrowth();
      break;
  }
};

onMounted(() => {
  loadOverview();
});
</script>

<script lang="ts">
export default {
  name: 'CustomerChannelStatistics',
};
</script>

<template>
  <StatisticsPageLayout title="客户渠道统计" :loading="false">
    <Card :bordered="false">
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 统计概览 -->
        <TabPane key="overview" tab="统计概览">
          <a-spin :spinning="loading.overview">
            <StatisticCardRow :items="overviewCards1" />
            <StatisticCardRow :items="overviewCards2" />
          </a-spin>
        </TabPane>

        <!-- 渠道类型分析 -->
        <TabPane key="type" tab="类型分析">
          <a-spin :spinning="loading.type">
            <Row :gutter="16" class="mb-4">
              <Col :span="8">
                <Card title="渠道类型数">
                  <a-statistic
                    :value="typeAnalysis.totalTypes"
                    suffix="种"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="最热门渠道">
                  <a-statistic
                    :value="getChannelTypeName(typeAnalysis.mostPopularType)"
                    :value-style="{ color: '#52c41a', fontSize: '20px' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="总渠道数">
                  <a-statistic
                    :value="
                      typeAnalysis.byType.reduce((sum, t) => sum + t.count, 0)
                    "
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="各渠道类型分布">
              <Table
                :columns="[
                  {
                    title: '渠道类型',
                    dataIndex: 'channelType',
                    key: 'channelType',
                  },
                  { title: '总数量', dataIndex: 'count', key: 'count' },
                  {
                    title: '活跃数',
                    dataIndex: 'activeCount',
                    key: 'activeCount',
                  },
                  {
                    title: '关注中',
                    dataIndex: 'followingCount',
                    key: 'followingCount',
                  },
                  {
                    title: '占比',
                    dataIndex: 'percentage',
                    key: 'percentage',
                    width: 200,
                  },
                ]"
                :data-source="typeAnalysis.byType"
                :pagination="false"
                row-key="channelType"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'channelType'">
                    <Tag :color="getChannelTypeColor(record.channelType)">
                      {{ getChannelTypeName(record.channelType) }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'percentage'">
                    <Progress
                      :percent="record.percentage"
                      :stroke-color="getChannelTypeColor(record.channelType)"
                      size="small"
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </a-spin>
        </TabPane>

        <!-- 互动分析 -->
        <TabPane key="interaction" tab="互动分析">
          <a-spin :spinning="loading.interaction">
            <StatisticCardRow :items="interactionCards" />

            <Card title="互动最活跃的渠道 TOP 10">
              <Table
                :columns="[
                  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
                  {
                    title: '渠道类型',
                    dataIndex: 'channelType',
                    key: 'channelType',
                  },
                  {
                    title: '用户名',
                    dataIndex: 'channelUsername',
                    key: 'channelUsername',
                  },
                  {
                    title: '消息数',
                    dataIndex: 'messageCount',
                    key: 'messageCount',
                  },
                  {
                    title: '互动分数',
                    dataIndex: 'interactionScore',
                    key: 'interactionScore',
                  },
                  {
                    title: '最后互动',
                    dataIndex: 'lastMessageAt',
                    key: 'lastMessageAt',
                  },
                ]"
                :data-source="interaction.topInteractingChannels"
                :pagination="false"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'channelType'">
                    <Tag :color="getChannelTypeColor(record.channelType)">
                      {{ getChannelTypeName(record.channelType) }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'lastMessageAt'">
                    {{
                      record.lastMessageAt
                        ? formatDate(record.lastMessageAt)
                        : '-'
                    }}
                  </template>
                </template>
              </Table>
            </Card>
          </a-spin>
        </TabPane>

        <!-- 增长分析 -->
        <TabPane key="growth" tab="增长分析">
          <a-spin :spinning="loading.growth">
            <StatisticCardRow :items="growthCards" />

            <Card title="近30天渠道增长趋势">
              <Table
                :columns="[
                  { title: '日期', dataIndex: 'date', key: 'date' },
                  {
                    title: '新增',
                    dataIndex: 'newChannels',
                    key: 'newChannels',
                  },
                  { title: '取关', dataIndex: 'unfollowed', key: 'unfollowed' },
                  { title: '净增长', dataIndex: 'netGrowth', key: 'netGrowth' },
                ]"
                :data-source="growth.dailyGrowth"
                :pagination="{ pageSize: 10 }"
                row-key="date"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'netGrowth'">
                    <span
                      :style="{
                        color: record.netGrowth >= 0 ? '#52c41a' : '#ff4d4f',
                      }"
                    >
                      {{ record.netGrowth >= 0 ? '+' : ''
                      }}{{ record.netGrowth }}
                    </span>
                  </template>
                </template>
              </Table>
            </Card>
          </a-spin>
        </TabPane>
      </Tabs>
    </Card>
  </StatisticsPageLayout>
</template>
