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
  Tag,
  Spin,
  Empty,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

const router = useRouter();

// ==================== 类型定义 ====================

interface MassMessageOverview {
  totalMessages: number;
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  messagesThisWeek: number;
  sentThisWeek: number;
  deliveredThisWeek: number;
  messagesToday: number;
  sentToday: number;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  dailyTrend: Array<{
    date: string;
    messageCount: number;
    sentCount: number;
    deliveredCount: number;
  }>;
  topCampaigns: Array<{
    campaignId: number;
    campaignName: string;
    totalSent: number;
    delivered: number;
    deliveryRate: number;
  }>;
}

interface SendAnalysis {
  bySender: Array<{
    sender: string;
    senderName: string | null;
    totalMessages: number;
    totalSent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;
  byChatType: Array<{
    chatType: string;
    count: number;
    percentage: number;
  }>;
  byHour: Array<{
    hour: number;
    count: number;
  }>;
  resultStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

interface CampaignPerformance {
  campaigns: Array<{
    id: number;
    name: string;
    status: string;
    type: string;
    totalTarget: number;
    totalSent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    startedAt: string | null;
    completedAt: string | null;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  avgDeliveryRate: number;
  totalTargetSum: number;
}

// ==================== 状态映射 ====================

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待发送', color: 'default' },
  PROCESSING: { label: '处理中', color: 'processing' },
  FINISHED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
};

const resultStatusMap: Record<string, { label: string; color: string }> = {
  SENT: { label: '已送达', color: 'green' },
  NOT_FRIEND: { label: '非好友', color: 'orange' },
  LIMIT_EXCEED: { label: '超限', color: 'red' },
  PENDING: { label: '待发送', color: 'default' },
};

const chatTypeMap: Record<string, string> = {
  SINGLE: '单聊',
  GROUP: '群聊',
};

const campaignStatusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING: { label: '待审批', color: 'processing' },
  APPROVED: { label: '已审批', color: 'blue' },
  RUNNING: { label: '执行中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
};

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<MassMessageOverview | null>(null);
const sendAnalysis = ref<SendAnalysis | null>(null);
const campaignPerformance = ref<CampaignPerformance | null>(null);

// ==================== 表格列定义 ====================

const topCampaignColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '活动名称', dataIndex: 'campaignName', key: 'campaignName' },
  { title: '发送数', dataIndex: 'totalSent', key: 'totalSent', width: 100 },
  { title: '送达数', dataIndex: 'delivered', key: 'delivered', width: 100 },
  { title: '送达率', key: 'deliveryRate', width: 100 },
];

const senderColumns = [
  { title: '发送者', key: 'sender' },
  { title: '消息数', dataIndex: 'totalMessages', key: 'totalMessages' },
  { title: '发送数', dataIndex: 'totalSent', key: 'totalSent' },
  { title: '送达数', dataIndex: 'delivered', key: 'delivered' },
  { title: '送达率', key: 'deliveryRate' },
];

const campaignColumns = [
  { title: '活动名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '目标数', dataIndex: 'totalTarget', key: 'totalTarget', width: 90 },
  { title: '发送数', dataIndex: 'totalSent', key: 'totalSent', width: 90 },
  { title: '送达数', dataIndex: 'delivered', key: 'delivered', width: 90 },
  { title: '送达率', key: 'deliveryRate', width: 100 },
];

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, analysisRes, performanceRes] = await Promise.all([
      requestClient.get<MassMessageOverview>(
        '/crm/mass-messages/statistics/overview',
      ),
      requestClient.get<SendAnalysis>(
        '/crm/mass-messages/statistics/send-analysis',
      ),
      requestClient.get<CampaignPerformance>(
        '/crm/mass-messages/statistics/campaign-performance',
      ),
    ]);
    overview.value = overviewRes;
    sendAnalysis.value = analysisRes;
    campaignPerformance.value = performanceRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/crm/mass-message');
}

// ==================== 生命周期 ====================

onMounted(loadData);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button @click="goBack">
          <template #icon><ArrowLeftOutlined /></template>
        </Button>
        <h2 class="m-0 text-xl font-bold">群发消息统计</h2>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- 概览统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="4">
          <Card>
            <Statistic
              title="总消息数"
              :value="overview?.totalMessages || 0"
              :prefix="h(SendOutlined)"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总发送数"
              :value="overview?.totalSent || 0"
              :prefix="h(TeamOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="送达数"
              :value="overview?.totalDelivered || 0"
              :prefix="h(CheckCircleOutlined)"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="失败数"
              :value="overview?.totalFailed || 0"
              :prefix="h(CloseCircleOutlined)"
              :value-style="{ color: '#ff4d4f' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总送达率"
              :value="overview?.deliveryRate || 0"
              suffix="%"
              :prefix="h(RiseOutlined)"
              :value-style="{ color: overview?.deliveryRate && overview.deliveryRate >= 80 ? '#52c41a' : '#faad14' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总活动数"
              :value="overview?.totalCampaigns || 0"
              :prefix="h(BarChartOutlined)"
              :value-style="{ color: '#722ed1' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 今日和本周数据 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="今日数据">
            <div class="flex items-center justify-around" style="height: 120px">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-500">
                  {{ overview?.messagesToday || 0 }}
                </div>
                <div class="text-gray-500">新建消息</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">
                  {{ overview?.sentToday || 0 }}
                </div>
                <div class="text-gray-500">发送数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="本周数据">
            <div class="flex items-center justify-around" style="height: 120px">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-500">
                  {{ overview?.messagesThisWeek || 0 }}
                </div>
                <div class="text-gray-500">新建消息</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-500">
                  {{ overview?.sentThisWeek || 0 }}
                </div>
                <div class="text-gray-500">发送数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">
                  {{ overview?.deliveredThisWeek || 0 }}
                </div>
                <div class="text-gray-500">送达数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="平均绩效">
            <div class="flex flex-col items-center justify-center" style="height: 120px">
              <div class="text-4xl font-bold text-blue-500">
                {{ campaignPerformance?.avgDeliveryRate || 0 }}%
              </div>
              <div class="mt-2 text-gray-500">平均送达率</div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 消息状态和发送结果分布 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="消息状态分布">
            <div v-if="overview?.byStatus?.length">
              <div
                v-for="item in overview.byStatus"
                :key="item.status"
                class="mb-3 flex items-center justify-between"
              >
                <Tag :color="statusMap[item.status]?.color || 'default'">
                  {{ statusMap[item.status]?.label || item.status }}
                </Tag>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                    :stroke-color="statusMap[item.status]?.color === 'success' ? '#52c41a' : '#1890ff'"
                  />
                </div>
                <span>{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="发送结果分布">
            <div v-if="sendAnalysis?.resultStatusDistribution?.length">
              <div
                v-for="item in sendAnalysis.resultStatusDistribution"
                :key="item.status"
                class="mb-3 flex items-center justify-between"
              >
                <Tag :color="resultStatusMap[item.status]?.color || 'default'">
                  {{ resultStatusMap[item.status]?.label || item.status }}
                </Tag>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                    :stroke-color="item.status === 'SENT' ? '#52c41a' : '#ff4d4f'"
                  />
                </div>
                <span>{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="聊天类型分布">
            <div v-if="sendAnalysis?.byChatType?.length">
              <div
                v-for="item in sendAnalysis.byChatType"
                :key="item.chatType"
                class="mb-3 flex items-center justify-between"
              >
                <Tag color="blue">
                  {{ chatTypeMap[item.chatType] || item.chatType }}
                </Tag>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                  />
                </div>
                <span>{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 热门活动排行 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="热门活动 TOP10">
            <Table
              :columns="topCampaignColumns"
              :data-source="(overview?.topCampaigns || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'rank'">
                  <span
                    :class="{
                      'font-bold text-yellow-500': index === 0,
                      'font-bold text-gray-400': index === 1,
                      'font-bold text-amber-600': index === 2,
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                </template>
                <template v-if="column.key === 'deliveryRate'">
                  <Progress
                    :percent="record.deliveryRate"
                    :size="60"
                    :stroke-color="record.deliveryRate >= 80 ? '#52c41a' : '#faad14'"
                  />
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="近7日趋势">
            <div v-if="overview?.dailyTrend?.length" class="flex items-end justify-around" style="height: 240px">
              <div
                v-for="(item, index) in overview.dailyTrend"
                :key="index"
                class="flex flex-col items-center"
              >
                <div class="mb-1 text-xs text-green-500">{{ item.deliveredCount }}</div>
                <div
                  class="w-8 rounded-t bg-green-500"
                  :style="{ height: `${Math.max(10, (item.deliveredCount / Math.max(...overview.dailyTrend.map(d => d.deliveredCount), 1)) * 140)}px` }"
                />
                <div
                  class="w-8 bg-blue-500"
                  :style="{ height: `${Math.max(5, (item.sentCount / Math.max(...overview.dailyTrend.map(d => d.sentCount), 1)) * 40)}px` }"
                />
                <div class="mt-2 text-xs text-gray-400">
                  {{ item.date.slice(5) }}
                </div>
              </div>
            </div>
            <div class="mt-2 flex justify-center gap-4 text-xs">
              <span><span class="mr-1 inline-block h-2 w-2 rounded bg-green-500"></span>送达数</span>
              <span><span class="mr-1 inline-block h-2 w-2 rounded bg-blue-500"></span>发送数</span>
            </div>
            <Empty v-if="!overview?.dailyTrend?.length" description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 发送者统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="发送者统计">
            <Table
              :columns="senderColumns"
              :data-source="(sendAnalysis?.bySender || []).slice(0, 10).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sender'">
                  {{ record.senderName || record.sender || '未知' }}
                </template>
                <template v-if="column.key === 'deliveryRate'">
                  <Progress
                    :percent="record.deliveryRate"
                    :size="60"
                    :stroke-color="record.deliveryRate >= 80 ? '#52c41a' : '#faad14'"
                  />
                </template>
              </template>
            </Table>
            <Empty v-if="!sendAnalysis?.bySender?.length" description="暂无数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="发送时段分布">
            <div v-if="sendAnalysis?.byHour?.length" class="flex items-end justify-around" style="height: 200px">
              <div
                v-for="item in sendAnalysis.byHour"
                :key="item.hour"
                class="flex flex-col items-center"
                style="width: 20px"
              >
                <div
                  class="w-3 rounded-t bg-blue-400"
                  :style="{ height: `${Math.max(5, (item.count / Math.max(...sendAnalysis.byHour.map(h => h.count), 1)) * 160)}px` }"
                />
                <div class="mt-1 text-xs text-gray-400">{{ item.hour }}</div>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 活动绩效列表 -->
      <Card title="活动绩效列表">
        <Row :gutter="16" class="mb-4">
          <Col :span="6">
            <Statistic
              title="活动总目标数"
              :value="campaignPerformance?.totalTargetSum || 0"
            />
          </Col>
          <Col :span="18">
            <div class="flex gap-2">
              <Tag
                v-for="item in campaignPerformance?.statusDistribution || []"
                :key="item.status"
                :color="campaignStatusMap[item.status]?.color || 'default'"
              >
                {{ campaignStatusMap[item.status]?.label || item.status }}: {{ item.count }}
              </Tag>
            </div>
          </Col>
        </Row>
        <Table
          :columns="campaignColumns"
          :data-source="(campaignPerformance?.campaigns || []).map((item, index) => ({ ...item, key: index }))"
          :pagination="{ pageSize: 10 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <Tag :color="campaignStatusMap[record.status]?.color || 'default'">
                {{ campaignStatusMap[record.status]?.label || record.status }}
              </Tag>
            </template>
            <template v-if="column.key === 'deliveryRate'">
              <Progress
                :percent="record.deliveryRate"
                :size="60"
                :stroke-color="record.deliveryRate >= 80 ? '#52c41a' : '#faad14'"
              />
            </template>
          </template>
        </Table>
      </Card>
    </Spin>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MassMessageStatistics',
};
</script>
