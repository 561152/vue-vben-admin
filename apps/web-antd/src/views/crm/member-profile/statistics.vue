<template>
  <div class="p-4">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span>会员画像统计</span>
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
                    title="总画像数"
                    :value="overview.totalProfiles"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总标签数"
                    :value="overview.totalTags"
                    :value-style="{ color: '#52c41a' }"
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
                    title="活跃标签"
                    :value="overview.activeTags"
                    :value-style="{ color: '#722ed1' }"
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
                    title="画像覆盖率"
                    :value="overview.profileCoverageRate"
                    suffix="%"
                    :value-style="{
                      color:
                        overview.profileCoverageRate >= 50
                          ? '#52c41a'
                          : '#faad14',
                    }"
                  >
                    <template #prefix>
                      <PieChartOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日新增"
                    :value="overview.todayNewProfiles"
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
                    :value="overview.weekNewProfiles"
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
                    :value="overview.monthNewProfiles"
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
                    title="有画像客户"
                    :value="overview.profiledCustomers"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <TeamOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- 标签分析 -->
        <TabPane key="tags" tab="标签分析">
          <Spin :spinning="loading.tags">
            <Row :gutter="16" class="mb-4">
              <Col :span="8">
                <Card title="标签类别数">
                  <Statistic
                    :value="tagAnalysis.totalCategories"
                    suffix="种"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="平均标签数/客户">
                  <Statistic
                    :value="tagAnalysis.avgTagsPerCustomer"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="8">
                <Card title="总标签数">
                  <Statistic
                    :value="
                      tagAnalysis.byCategory.reduce(
                        (sum, c) => sum + c.count,
                        0,
                      )
                    "
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Row :gutter="16" class="mb-4">
              <Col :span="12">
                <Card title="按类别分布">
                  <Table
                    :columns="categoryColumns"
                    :data-source="tagAnalysis.byCategory"
                    :pagination="false"
                    row-key="category"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'category'">
                        <Tag :color="getCategoryColor(record.category)">
                          {{ getCategoryName(record.category) }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getCategoryColor(record.category)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="按来源分布">
                  <Table
                    :columns="sourceColumns"
                    :data-source="tagAnalysis.bySource"
                    :pagination="false"
                    row-key="source"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'source'">
                        <Tag :color="getSourceColor(record.source)">
                          {{ getSourceName(record.source) }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getSourceColor(record.source)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>

            <Card title="热门标签 TOP 10">
              <Table
                :columns="topTagColumns"
                :data-source="tagAnalysis.topTags"
                :pagination="false"
                row-key="tagKey"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'avgConfidence'">
                    <Progress
                      :percent="record.avgConfidence * 100"
                      :stroke-color="getConfidenceColor(record.avgConfidence)"
                      size="small"
                      :format="
                        () => (record.avgConfidence * 100).toFixed(1) + '%'
                      "
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>

        <!-- 画像质量 -->
        <TabPane key="quality" tab="画像质量">
          <Spin :spinning="loading.quality">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均置信度"
                    :value="(quality.avgConfidence * 100).toFixed(1)"
                    suffix="%"
                    :value-style="{
                      color: getConfidenceColor(quality.avgConfidence),
                    }"
                  >
                    <template #prefix>
                      <SafetyCertificateOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="高置信度标签"
                    :value="quality.highConfidenceTags"
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
                    title="中置信度标签"
                    :value="quality.mediumConfidenceTags"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <MinusCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="低置信度标签"
                    :value="quality.lowConfidenceTags"
                    :value-style="{ color: '#ff4d4f' }"
                  >
                    <template #prefix>
                      <CloseCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16" class="mb-4">
              <Col :span="12">
                <Card title="置信度分布">
                  <Table
                    :columns="confidenceColumns"
                    :data-source="quality.confidenceDistribution"
                    :pagination="false"
                    row-key="range"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'percentage'">
                        <Progress
                          :percent="record.percentage"
                          :stroke-color="getConfidenceRangeColor(record.range)"
                          size="small"
                        />
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
              <Col :span="12">
                <Card title="最近更新的画像">
                  <Table
                    :columns="recentColumns"
                    :data-source="quality.recentlyUpdated"
                    :pagination="false"
                    row-key="customerId"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'profileSummary'">
                        <Tooltip :title="record.profileSummary">
                          {{ record.profileSummary.substring(0, 30) }}...
                        </Tooltip>
                      </template>
                      <template v-else-if="column.key === 'updatedAt'">
                        {{ formatDate(record.updatedAt) }}
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>
            </Row>
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
                    title="日均新增画像"
                    :value="growth.avgDailyNewProfiles"
                    :value-style="{ color: '#1890ff' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="日均新增标签"
                    :value="growth.avgDailyNewTags"
                    :value-style="{ color: '#52c41a' }"
                  />
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="30天总增长"
                    :value="
                      growth.dailyGrowth.reduce(
                        (sum, d) => sum + d.newProfiles,
                        0,
                      )
                    "
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="近30天画像增长趋势">
              <Table
                :columns="growthColumns"
                :data-source="growth.dailyGrowth"
                :pagination="{ pageSize: 10 }"
                row-key="date"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'newProfiles'">
                    <span
                      :style="{
                        color: record.newProfiles > 0 ? '#52c41a' : '#999',
                      }"
                    >
                      {{ record.newProfiles > 0 ? '+' : ''
                      }}{{ record.newProfiles }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'newTags'">
                    <span
                      :style="{
                        color: record.newTags > 0 ? '#1890ff' : '#999',
                      }"
                    >
                      {{ record.newTags > 0 ? '+' : '' }}{{ record.newTags }}
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
  Tooltip,
  message,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  UserOutlined,
  TagOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  MinusCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import type { Key } from 'ant-design-vue/es/_util/type';

const router = useRouter();

// 状态
const activeTab = ref('overview');
const loading = ref({
  overview: false,
  tags: false,
  quality: false,
  growth: false,
});

// 数据
const overview = ref({
  totalProfiles: 0,
  profiledCustomers: 0,
  totalTags: 0,
  activeTags: 0,
  todayNewProfiles: 0,
  weekNewProfiles: 0,
  monthNewProfiles: 0,
  profileCoverageRate: 0,
});

const tagAnalysis = ref({
  byCategory: [] as Array<{
    category: string;
    count: number;
    activeCount: number;
    percentage: number;
  }>,
  bySource: [] as Array<{
    source: string;
    count: number;
    percentage: number;
  }>,
  topTags: [] as Array<{
    tagKey: string;
    tagValue: string;
    count: number;
    avgConfidence: number;
  }>,
  totalCategories: 0,
  avgTagsPerCustomer: 0,
});

const quality = ref({
  avgConfidence: 0,
  highConfidenceTags: 0,
  mediumConfidenceTags: 0,
  lowConfidenceTags: 0,
  confidenceDistribution: [] as Array<{
    range: string;
    count: number;
    percentage: number;
  }>,
  recentlyUpdated: [] as Array<{
    customerId: string;
    memberId: string;
    profileSummary: string;
    updatedAt: Date;
  }>,
});

const growth = ref({
  dailyGrowth: [] as Array<{
    date: string;
    newProfiles: number;
    newTags: number;
    cumulativeProfiles: number;
  }>,
  growthRate: 0,
  avgDailyNewProfiles: 0,
  avgDailyNewTags: 0,
});

// 表格列定义
const categoryColumns = [
  { title: '标签类别', dataIndex: 'category', key: 'category' },
  { title: '总数', dataIndex: 'count', key: 'count' },
  { title: '活跃', dataIndex: 'activeCount', key: 'activeCount' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const sourceColumns = [
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const topTagColumns = [
  { title: '标签键', dataIndex: 'tagKey', key: 'tagKey' },
  { title: '标签值', dataIndex: 'tagValue', key: 'tagValue' },
  { title: '使用次数', dataIndex: 'count', key: 'count' },
  {
    title: '平均置信度',
    dataIndex: 'avgConfidence',
    key: 'avgConfidence',
    width: 200,
  },
];

const confidenceColumns = [
  { title: '置信度范围', dataIndex: 'range', key: 'range' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 150 },
];

const recentColumns = [
  { title: '客户ID', dataIndex: 'customerId', key: 'customerId', width: 100 },
  { title: '会员ID', dataIndex: 'memberId', key: 'memberId', width: 120 },
  { title: '画像摘要', dataIndex: 'profileSummary', key: 'profileSummary' },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
];

const growthColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '新增画像', dataIndex: 'newProfiles', key: 'newProfiles' },
  { title: '新增标签', dataIndex: 'newTags', key: 'newTags' },
  {
    title: '累计画像',
    dataIndex: 'cumulativeProfiles',
    key: 'cumulativeProfiles',
  },
];

// 标签类别映射
const categoryMap: Record<string, string> = {
  CONSUMPTION: '消费偏好',
  DEMOGRAPHIC: '人口统计',
  BEHAVIOR: '行为特征',
  INTEREST: '兴趣爱好',
  VALUE: '价值评估',
  LIFECYCLE: '生命周期',
  RISK: '风险标签',
};

const categoryColors: Record<string, string> = {
  CONSUMPTION: '#1890ff',
  DEMOGRAPHIC: '#52c41a',
  BEHAVIOR: '#722ed1',
  INTEREST: '#eb2f96',
  VALUE: '#faad14',
  LIFECYCLE: '#13c2c2',
  RISK: '#ff4d4f',
};

// 来源映射
const sourceMap: Record<string, string> = {
  RULE: '规则引擎',
  LLM: 'AI生成',
  MANUAL: '人工标注',
};

const sourceColors: Record<string, string> = {
  RULE: '#1890ff',
  LLM: '#52c41a',
  MANUAL: '#faad14',
};

// 方法
const getCategoryName = (category: string) => {
  return categoryMap[category] || category;
};

const getCategoryColor = (category: string) => {
  return categoryColors[category] || '#1890ff';
};

const getSourceName = (source: string) => {
  return sourceMap[source] || source;
};

const getSourceColor = (source: string) => {
  return sourceColors[source] || '#1890ff';
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#52c41a';
  if (confidence >= 0.5) return '#faad14';
  return '#ff4d4f';
};

const getConfidenceRangeColor = (range: string) => {
  if (range.includes('高')) return '#52c41a';
  if (range.includes('中')) return '#faad14';
  return '#ff4d4f';
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
    const res = await requestClient.get('/member-profile/statistics/overview');
    overview.value = res;
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadTagAnalysis = async () => {
  loading.value.tags = true;
  try {
    const res = await requestClient.get('/member-profile/statistics/tags');
    tagAnalysis.value = res;
  } catch (error) {
    message.error('加载标签分析失败');
  } finally {
    loading.value.tags = false;
  }
};

const loadQuality = async () => {
  loading.value.quality = true;
  try {
    const res = await requestClient.get('/member-profile/statistics/quality');
    quality.value = res;
  } catch (error) {
    message.error('加载画像质量分析失败');
  } finally {
    loading.value.quality = false;
  }
};

const loadGrowth = async () => {
  loading.value.growth = true;
  try {
    const res = await requestClient.get('/member-profile/statistics/growth');
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
    case 'tags':
      loadTagAnalysis();
      break;
    case 'quality':
      loadQuality();
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
