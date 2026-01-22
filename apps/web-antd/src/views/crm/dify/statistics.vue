<template>
  <div class="p-4">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Dify AI 对话统计</span>
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
                    title="总会话数"
                    :value="overview.totalConversations"
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
                    title="活跃会话"
                    :value="overview.activeConversations"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <SyncOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="已关闭会话"
                    :value="overview.closedConversations"
                    :value-style="{ color: '#faad14' }"
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
                    title="总消息数"
                    :value="overview.totalMessages"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <CommentOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总 Token 消耗"
                    :value="overview.totalTokensUsed"
                    :value-style="{ color: '#eb2f96' }"
                  >
                    <template #prefix>
                      <ThunderboltOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日会话"
                    :value="overview.todayConversations"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <CalendarOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="本周会话"
                    :value="overview.weekConversations"
                    :value-style="{ color: '#2f54eb' }"
                  >
                    <template #prefix>
                      <FieldTimeOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="本月会话"
                    :value="overview.monthConversations"
                    :value-style="{ color: '#f5222d' }"
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

        <!-- 会话分析 -->
        <TabPane key="conversation" tab="会话分析">
          <Spin :spinning="loading.conversation">
            <Row :gutter="16" class="mb-4">
              <Col :span="8">
                <Card title="平均消息数/会话">
                  <Statistic
                    :value="conversation.avgMessagesPerConversation"
                    suffix="条"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="平均 Token/会话">
                  <Statistic
                    :value="conversation.avgTokensPerConversation"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="平均响应延迟">
                  <Statistic
                    :value="conversation.avgResponseLatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#faad14' }"
                  />
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <Card title="会话状态分布">
                  <Table
                    :columns="statusColumns"
                    :data-source="conversation.conversationsByStatus"
                    :pagination="false"
                    row-key="status"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'status'">
                        <Tag :color="getStatusColor(record.status)">
                          {{ getStatusName(record.status) }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          size="small"
                          :stroke-color="getStatusColor(record.status)"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="最活跃用户 TOP 10">
                  <Table
                    :columns="userColumns"
                    :data-source="conversation.topActiveUsers"
                    :pagination="false"
                    row-key="externalUserId"
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- Token 使用分析 -->
        <TabPane key="token" tab="Token 分析">
          <Spin :spinning="loading.token">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总 Token 使用"
                    :value="tokenUsage.totalTokens"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均 Token/消息"
                    :value="tokenUsage.avgTokensPerMessage"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="峰值日期"
                    :value="tokenUsage.peakUsageDay || '-'"
                    :value-style="{ color: '#faad14', fontSize: '18px' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="峰值 Token"
                    :value="tokenUsage.peakUsageTokens"
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="近30天 Token 使用趋势">
              <Table
                :columns="tokenColumns"
                :data-source="tokenUsage.dailyUsage"
                :pagination="{ pageSize: 10 }"
                row-key="date"
                size="small"
              />
            </Card>
          </Spin>
        </TabPane>

        <!-- 性能分析 -->
        <TabPane key="performance" tab="性能分析">
          <Spin :spinning="loading.performance">
            <Row :gutter="16" class="mb-4">
              <Col :span="4">
                <Card>
                  <Statistic
                    title="平均延迟"
                    :value="performance.avgLatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="4">
                <Card>
                  <Statistic
                    title="最小延迟"
                    :value="performance.minLatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="4">
                <Card>
                  <Statistic
                    title="最大延迟"
                    :value="performance.maxLatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#ff4d4f' }"
                  />
                </Card>
              </Col>
              <Col :span="4">
                <Card>
                  <Statistic
                    title="P50 延迟"
                    :value="performance.p50LatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#faad14' }"
                  />
                </Card>
              </Col>
              <Col :span="4">
                <Card>
                  <Statistic
                    title="P95 延迟"
                    :value="performance.p95LatencyMs"
                    suffix="ms"
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
              <Col :span="4">
                <Card>
                  <Statistic
                    title="数据点数"
                    :value="performance.dailyPerformance.length"
                    suffix="天"
                    :value-style="{ color: '#13c2c2' }"
                  />
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <Card title="延迟分布">
                  <Table
                    :columns="distributionColumns"
                    :data-source="performance.latencyDistribution"
                    :pagination="false"
                    row-key="range"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          size="small"
                          :status="getLatencyStatus(record.range)"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="每日性能趋势">
                  <Table
                    :columns="performanceColumns"
                    :data-source="performance.dailyPerformance"
                    :pagination="{ pageSize: 7 }"
                    row-key="date"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'avgLatencyMs'">
                        <span
                          :style="{
                            color: getLatencyColor(record.avgLatencyMs),
                          }"
                        >
                          {{ record.avgLatencyMs }} ms
                        </span>
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>
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
  MessageOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import type { Key } from 'ant-design-vue/es/_util/type';

const router = useRouter();

// 状态
const activeTab = ref('overview');
const loading = ref({
  overview: false,
  conversation: false,
  token: false,
  performance: false,
});

// 数据
const overview = ref({
  totalConversations: 0,
  activeConversations: 0,
  closedConversations: 0,
  totalMessages: 0,
  totalTokensUsed: 0,
  todayConversations: 0,
  weekConversations: 0,
  monthConversations: 0,
});

const conversation = ref({
  avgMessagesPerConversation: 0,
  avgTokensPerConversation: 0,
  avgResponseLatencyMs: 0,
  topActiveUsers: [] as Array<{
    externalUserId: string;
    conversationCount: number;
    messageCount: number;
  }>,
  conversationsByStatus: [] as Array<{
    status: string;
    count: number;
    percentage: number;
  }>,
});

const tokenUsage = ref({
  totalTokens: 0,
  avgTokensPerMessage: 0,
  dailyUsage: [] as Array<{
    date: string;
    tokens: number;
    messageCount: number;
  }>,
  peakUsageDay: null as string | null,
  peakUsageTokens: 0,
});

const performance = ref({
  avgLatencyMs: 0,
  minLatencyMs: 0,
  maxLatencyMs: 0,
  p50LatencyMs: 0,
  p95LatencyMs: 0,
  latencyDistribution: [] as Array<{
    range: string;
    count: number;
    percentage: number;
  }>,
  dailyPerformance: [] as Array<{
    date: string;
    avgLatencyMs: number;
    messageCount: number;
  }>,
});

// 表格列定义
const statusColumns = [
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const userColumns = [
  {
    title: '用户ID',
    dataIndex: 'externalUserId',
    key: 'externalUserId',
    ellipsis: true,
  },
  { title: '会话数', dataIndex: 'conversationCount', key: 'conversationCount' },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount' },
];

const tokenColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: 'Token 使用', dataIndex: 'tokens', key: 'tokens' },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount' },
];

const distributionColumns = [
  { title: '延迟范围', dataIndex: 'range', key: 'range' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const performanceColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '平均延迟', dataIndex: 'avgLatencyMs', key: 'avgLatencyMs' },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount' },
];

// 状态映射
const statusNameMap: Record<string, string> = {
  ACTIVE: '活跃',
  CLOSED: '已关闭',
  ARCHIVED: '已归档',
};

const statusColorMap: Record<string, string> = {
  ACTIVE: '#52c41a',
  CLOSED: '#faad14',
  ARCHIVED: '#d9d9d9',
};

// 方法
const getStatusName = (status: string) => statusNameMap[status] || status;
const getStatusColor = (status: string) => statusColorMap[status] || '#1890ff';

const getLatencyStatus = (
  range: string,
): 'success' | 'normal' | 'exception' => {
  if (range.includes('0-500') || range.includes('500ms-1s')) return 'success';
  if (range.includes('1-2s') || range.includes('2-5s')) return 'normal';
  return 'exception';
};

const getLatencyColor = (latencyMs: number): string => {
  if (latencyMs < 1000) return '#52c41a';
  if (latencyMs < 2000) return '#faad14';
  return '#ff4d4f';
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
    const res = await requestClient.get('/dify/statistics/overview');
    overview.value = res;
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadConversation = async () => {
  loading.value.conversation = true;
  try {
    const res = await requestClient.get('/dify/statistics/conversation');
    conversation.value = res;
  } catch (error) {
    message.error('加载会话分析失败');
  } finally {
    loading.value.conversation = false;
  }
};

const loadTokenUsage = async () => {
  loading.value.token = true;
  try {
    const res = await requestClient.get('/dify/statistics/token-usage');
    tokenUsage.value = res;
  } catch (error) {
    message.error('加载 Token 分析失败');
  } finally {
    loading.value.token = false;
  }
};

const loadPerformance = async () => {
  loading.value.performance = true;
  try {
    const res = await requestClient.get('/dify/statistics/performance');
    performance.value = res;
  } catch (error) {
    message.error('加载性能分析失败');
  } finally {
    loading.value.performance = false;
  }
};

const loadTabData = (tab: string) => {
  switch (tab) {
    case 'overview':
      loadOverview();
      break;
    case 'conversation':
      loadConversation();
      break;
    case 'token':
      loadTokenUsage();
      break;
    case 'performance':
      loadPerformance();
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
