<template>
  <div class="p-4">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span>AI 定向营销统计</span>
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
                    title="AI活动总数"
                    :value="overview.totalAiCampaigns"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <RocketOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="活跃活动"
                    :value="overview.activeCampaigns"
                    :value-style="{ color: '#52c41a' }"
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
                    title="个性化文案"
                    :value="overview.totalPersonalizedCopies"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <FileTextOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="已发送文案"
                    :value="overview.sentCopies"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <SendOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="匹配人群"
                    :value="overview.totalMatchedAudience"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <TeamOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日新建"
                    :value="overview.todayNewCampaigns"
                    :value-style="{ color: '#2f54eb' }"
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
                    title="本周新建"
                    :value="overview.weekNewCampaigns"
                    :value-style="{ color: '#eb2f96' }"
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
                    title="文案生成率"
                    :value="overview.copyGenerationRate"
                    suffix="%"
                    :value-style="{
                      color:
                        overview.copyGenerationRate >= 80
                          ? '#52c41a'
                          : '#faad14',
                    }"
                  >
                    <template #prefix>
                      <PercentageOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- 活动分析 -->
        <TabPane key="campaigns" tab="活动分析">
          <Spin :spinning="loading.campaigns">
            <Row :gutter="16" class="mb-4">
              <Col :span="12">
                <Card title="按状态分布">
                  <Table
                    :columns="statusColumns"
                    :data-source="campaignAnalysis.byStatus"
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
                          :stroke-color="getStatusColor(record.status)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="按类型分布">
                  <Table
                    :columns="typeColumns"
                    :data-source="campaignAnalysis.byType"
                    :pagination="false"
                    row-key="type"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'type'">
                        <Tag :color="getTypeColor(record.type)">
                          {{ getTypeName(record.type) }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getTypeColor(record.type)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>

            <Card title="最近活动 TOP 10">
              <Table
                :columns="recentCampaignColumns"
                :data-source="campaignAnalysis.recentCampaigns"
                :pagination="false"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <Tag :color="getStatusColor(record.status)">
                      {{ getStatusName(record.status) }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'createdAt'">
                    {{ formatDate(record.createdAt) }}
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>

        <!-- 人群匹配 -->
        <TabPane key="audience" tab="人群匹配">
          <Spin :spinning="loading.audience">
            <Row :gutter="16" class="mb-4">
              <Col :span="8">
                <Card>
                  <Statistic
                    title="总匹配次数"
                    :value="audienceAnalysis.totalMatches"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <AimOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="8">
                <Card>
                  <Statistic
                    title="平均匹配人数"
                    :value="audienceAnalysis.avgMatchedCount"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="8">
                <Card>
                  <Statistic
                    title="分群数"
                    :value="audienceAnalysis.bySegment.length"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <ClusterOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <Card title="按分群统计">
                  <Table
                    :columns="segmentColumns"
                    :data-source="audienceAnalysis.bySegment"
                    :pagination="false"
                    row-key="segmentId"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'segmentName'">
                        <Tag color="blue">{{ record.segmentName }}</Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          stroke-color="#1890ff"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="RFM 分布">
                  <Table
                    :columns="rfmColumns"
                    :data-source="audienceAnalysis.rfmDistribution"
                    :pagination="false"
                    row-key="rfmSegment"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'rfmSegment'">
                        <Tag :color="getRfmColor(record.rfmSegment)">
                          {{ record.rfmSegment }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getRfmColor(record.rfmSegment)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- 文案效果 -->
        <TabPane key="copies" tab="文案效果">
          <Spin :spinning="loading.copies">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总文案数"
                    :value="copyPerformance.totalCopies"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <FileTextOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="分群数"
                    :value="copyPerformance.bySegment.length"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <ClusterOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="状态种类"
                    :value="copyPerformance.byStatus.length"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <TagOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="长度分布"
                    :value="copyPerformance.lengthDistribution.length"
                    suffix="种"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <BarChartOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16" class="mb-4">
              <Col :span="12">
                <Card title="按状态分布">
                  <Table
                    :columns="copyStatusColumns"
                    :data-source="copyPerformance.byStatus"
                    :pagination="false"
                    row-key="status"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'status'">
                        <Tag :color="getCopyStatusColor(record.status)">
                          {{ getCopyStatusName(record.status) }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getCopyStatusColor(record.status)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="文案长度分布">
                  <Table
                    :columns="lengthColumns"
                    :data-source="copyPerformance.lengthDistribution"
                    :pagination="false"
                    row-key="range"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          stroke-color="#1890ff"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>

            <Card title="分群文案统计">
              <Table
                :columns="segmentCopyColumns"
                :data-source="copyPerformance.bySegment"
                :pagination="false"
                row-key="segmentId"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'segmentName'">
                    <Tag color="blue">{{ record.segmentName }}</Tag>
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
  RocketOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  SendOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  CalendarOutlined,
  PercentageOutlined,
  AimOutlined,
  UserOutlined,
  ClusterOutlined,
  TagOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import type { Key } from 'ant-design-vue/es/_util/type';

const router = useRouter();

// 状态
const activeTab = ref('overview');
const loading = ref({
  overview: false,
  campaigns: false,
  audience: false,
  copies: false,
});

// 数据
const overview = ref({
  totalAiCampaigns: 0,
  activeCampaigns: 0,
  totalPersonalizedCopies: 0,
  sentCopies: 0,
  totalMatchedAudience: 0,
  todayNewCampaigns: 0,
  weekNewCampaigns: 0,
  copyGenerationRate: 0,
});

const campaignAnalysis = ref({
  byStatus: [] as Array<{ status: string; count: number; percentage: number }>,
  byType: [] as Array<{ type: string; count: number; percentage: number }>,
  recentCampaigns: [] as Array<{
    id: string;
    name: string;
    status: string;
    totalTarget: number;
    createdAt: Date;
  }>,
  avgTargetCount: 0,
});

const audienceAnalysis = ref({
  totalMatches: 0,
  avgMatchedCount: 0,
  bySegment: [] as Array<{
    segmentId: string;
    segmentName: string;
    count: number;
    percentage: number;
  }>,
  rfmDistribution: [] as Array<{
    rfmSegment: string;
    count: number;
    percentage: number;
  }>,
});

const copyPerformance = ref({
  totalCopies: 0,
  byStatus: [] as Array<{ status: string; count: number; percentage: number }>,
  bySegment: [] as Array<{
    segmentId: string;
    segmentName: string;
    count: number;
    avgLength: number;
  }>,
  lengthDistribution: [] as Array<{
    range: string;
    count: number;
    percentage: number;
  }>,
});

// 表格列定义
const statusColumns = [
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const typeColumns = [
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const recentCampaignColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '活动名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '目标人数', dataIndex: 'totalTarget', key: 'totalTarget' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
];

const segmentColumns = [
  { title: '分群名称', dataIndex: 'segmentName', key: 'segmentName' },
  { title: '人数', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const rfmColumns = [
  { title: 'RFM分群', dataIndex: 'rfmSegment', key: 'rfmSegment' },
  { title: '人数', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const copyStatusColumns = [
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const lengthColumns = [
  { title: '长度范围', dataIndex: 'range', key: 'range' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const segmentCopyColumns = [
  { title: '分群名称', dataIndex: 'segmentName', key: 'segmentName' },
  { title: '文案数', dataIndex: 'count', key: 'count' },
  { title: '平均长度', dataIndex: 'avgLength', key: 'avgLength' },
];

// 状态映射
const statusMap: Record<string, string> = {
  DRAFT: '草稿',
  SCHEDULED: '已排期',
  RUNNING: '进行中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const statusColors: Record<string, string> = {
  DRAFT: '#d9d9d9',
  SCHEDULED: '#1890ff',
  RUNNING: '#52c41a',
  PAUSED: '#faad14',
  COMPLETED: '#722ed1',
  CANCELLED: '#ff4d4f',
};

// 类型映射
const typeMap: Record<string, string> = {
  WECOM_MASS: '企微群发',
  SMS: '短信',
  EMAIL: '邮件',
  PUSH: '推送',
};

const typeColors: Record<string, string> = {
  WECOM_MASS: '#07c160',
  SMS: '#1890ff',
  EMAIL: '#faad14',
  PUSH: '#722ed1',
};

// 文案状态映射
const copyStatusMap: Record<string, string> = {
  GENERATED: '已生成',
  SENT: '已发送',
  FAILED: '发送失败',
  PENDING: '待发送',
};

const copyStatusColors: Record<string, string> = {
  GENERATED: '#1890ff',
  SENT: '#52c41a',
  FAILED: '#ff4d4f',
  PENDING: '#faad14',
};

// RFM颜色
const rfmColors: Record<string, string> = {
  高价值: '#52c41a',
  中价值: '#1890ff',
  低价值: '#faad14',
};

// 方法
const getStatusName = (status: string) => statusMap[status] || status;
const getStatusColor = (status: string) => statusColors[status] || '#1890ff';
const getTypeName = (type: string) => typeMap[type] || type;
const getTypeColor = (type: string) => typeColors[type] || '#1890ff';
const getCopyStatusName = (status: string) => copyStatusMap[status] || status;
const getCopyStatusColor = (status: string) =>
  copyStatusColors[status] || '#1890ff';
const getRfmColor = (segment: string) => rfmColors[segment] || '#1890ff';

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
      '/targeted-marketing/statistics/overview',
    );
    overview.value = res;
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadCampaignAnalysis = async () => {
  loading.value.campaigns = true;
  try {
    const res = await requestClient.get(
      '/targeted-marketing/statistics/campaigns',
    );
    campaignAnalysis.value = res;
  } catch (error) {
    message.error('加载活动分析失败');
  } finally {
    loading.value.campaigns = false;
  }
};

const loadAudienceAnalysis = async () => {
  loading.value.audience = true;
  try {
    const res = await requestClient.get(
      '/targeted-marketing/statistics/audience',
    );
    audienceAnalysis.value = res;
  } catch (error) {
    message.error('加载人群匹配分析失败');
  } finally {
    loading.value.audience = false;
  }
};

const loadCopyPerformance = async () => {
  loading.value.copies = true;
  try {
    const res = await requestClient.get(
      '/targeted-marketing/statistics/copies',
    );
    copyPerformance.value = res;
  } catch (error) {
    message.error('加载文案效果分析失败');
  } finally {
    loading.value.copies = false;
  }
};

const loadTabData = (tab: string) => {
  switch (tab) {
    case 'overview':
      loadOverview();
      break;
    case 'campaigns':
      loadCampaignAnalysis();
      break;
    case 'audience':
      loadAudienceAnalysis();
      break;
    case 'copies':
      loadCopyPerformance();
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
