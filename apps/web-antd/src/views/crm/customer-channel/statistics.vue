<template>
  <div class="p-4">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span>客户渠道统计</span>
          <Button type="link" @click="goBack">
            <ArrowLeftOutlined /> 返回
          </Button>
        </div>
      </template>

      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 统计概览 -->
        <TabPane key="overview" tab="统计概览">
          <Spin :spinning="loading.overview">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总渠道数"
                    :value="overview.totalChannels"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <ApiOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="活跃渠道"
                    :value="overview.activeChannels"
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
                    title="关注中"
                    :value="overview.followingChannels"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <HeartOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="取消关注"
                    :value="overview.unfollowedChannels"
                    :value-style="{ color: '#ff4d4f' }"
                  >
                    <template #prefix>
                      <DisconnectOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="主渠道数"
                    :value="overview.primaryChannels"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <StarOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日新增"
                    :value="overview.todayNewChannels"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <PlusCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="本周新增"
                    :value="overview.weekNewChannels"
                    :value-style="{ color: '#2f54eb' }"
                  >
                    <template #prefix>
                      <RiseOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="本月新增"
                    :value="overview.monthNewChannels"
                    :value-style="{ color: '#eb2f96' }"
                  >
                    <template #prefix>
                      <CalendarOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- 渠道类型分析 -->
        <TabPane key="type" tab="类型分析">
          <Spin :spinning="loading.type">
            <Row :gutter="16" class="mb-4">
              <Col :span="8">
                <Card title="渠道类型数">
                  <Statistic
                    :value="typeAnalysis.totalTypes"
                    suffix="种"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="最热门渠道">
                  <Statistic
                    :value="getChannelTypeName(typeAnalysis.mostPopularType)"
                    :value-style="{ color: '#52c41a', fontSize: '20px' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="总渠道数">
                  <Statistic
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
                :columns="typeColumns"
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
          </Spin>
        </TabPane>

        <!-- 互动分析 -->
        <TabPane key="interaction" tab="互动分析">
          <Spin :spinning="loading.interaction">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总消息数"
                    :value="interaction.totalMessages"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <MessageOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均消息数/渠道"
                    :value="interaction.avgMessagesPerChannel"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均互动分数"
                    :value="interaction.avgInteractionScore"
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="活跃渠道数"
                    :value="interaction.topInteractingChannels.length"
                    :value-style="{ color: '#faad14' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="互动最活跃的渠道 TOP 10">
              <Table
                :columns="interactionColumns"
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
          </Spin>
        </TabPane>

        <!-- 增长分析 -->
        <TabPane key="growth" tab="增长分析">
          <Spin :spinning="loading.growth">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="30天增长率"
                    :value="growth.growthRate"
                    suffix="%"
                    :value-style="{
                      color: growth.growthRate >= 0 ? '#52c41a' : '#ff4d4f',
                    }"
                  >
                    <template #prefix>
                      <component
                        :is="
                          growth.growthRate >= 0 ? RiseOutlined : FallOutlined
                        "
                      />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="日均新增"
                    :value="growth.avgDailyNewChannels"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="日均取关"
                    :value="growth.avgDailyUnfollowed"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="净增长"
                    :value="
                      growth.avgDailyNewChannels - growth.avgDailyUnfollowed
                    "
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="近30天渠道增长趋势">
              <Table
                :columns="growthColumns"
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
          </Spin>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Tabs,
  TabPane,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Spin,
  Button,
  message,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
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

const router = useRouter();

// 状态
const activeTab = ref('overview');
const loading = ref({
  overview: false,
  type: false,
  interaction: false,
  growth: false,
});

// 数据
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
  interactionTrend: [] as Array<{
    date: string;
    messageCount: number;
    activeChannels: number;
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

// 表格列定义
const typeColumns = [
  { title: '渠道类型', dataIndex: 'channelType', key: 'channelType' },
  { title: '总数量', dataIndex: 'count', key: 'count' },
  { title: '活跃数', dataIndex: 'activeCount', key: 'activeCount' },
  { title: '关注中', dataIndex: 'followingCount', key: 'followingCount' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 200 },
];

const interactionColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '渠道类型', dataIndex: 'channelType', key: 'channelType' },
  { title: '用户名', dataIndex: 'channelUsername', key: 'channelUsername' },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount' },
  { title: '互动分数', dataIndex: 'interactionScore', key: 'interactionScore' },
  { title: '最后互动', dataIndex: 'lastMessageAt', key: 'lastMessageAt' },
];

const growthColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '新增', dataIndex: 'newChannels', key: 'newChannels' },
  { title: '取关', dataIndex: 'unfollowed', key: 'unfollowed' },
  { title: '净增长', dataIndex: 'netGrowth', key: 'netGrowth' },
];

// 渠道类型映射
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

// 方法
const getChannelTypeName = (type: string | null) => {
  if (!type) return '-';
  return channelTypeMap[type] || type;
};

const getChannelTypeColor = (type: string) => {
  return channelTypeColors[type] || '#1890ff';
};

const formatDate = (date: Date | string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

const goBack = () => {
  router.back();
};

const handleTabChange = (key: Key) => {
  activeTab.value = String(key);
  loadTabData(String(key));
};

// 加载数据
const loadOverview = async () => {
  loading.value.overview = true;
  try {
    const res = await requestClient.get(
      '/customer-channels/statistics/overview',
    );
    overview.value = res;
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadTypeAnalysis = async () => {
  loading.value.type = true;
  try {
    const res = await requestClient.get(
      '/customer-channels/statistics/type-analysis',
    );
    typeAnalysis.value = res;
  } catch (error) {
    message.error('加载类型分析失败');
  } finally {
    loading.value.type = false;
  }
};

const loadInteraction = async () => {
  loading.value.interaction = true;
  try {
    const res = await requestClient.get(
      '/customer-channels/statistics/interaction',
    );
    interaction.value = res;
  } catch (error) {
    message.error('加载互动分析失败');
  } finally {
    loading.value.interaction = false;
  }
};

const loadGrowth = async () => {
  loading.value.growth = true;
  try {
    const res = await requestClient.get('/customer-channels/statistics/growth');
    growth.value = res;
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

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
