<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Button,
  Spin,
  Alert,
  Tabs,
  TabPane,
  Badge,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  DatabaseOutlined,
} from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface StatisticsOverview {
  totalAudiences: number;
  totalMembers: number;
  totalWecomMembers: number;
  draftCount: number;
  computingCount: number;
  readyCount: number;
  expiredCount: number;
  staticCount: number;
  dynamicCount: number;
  createdToday: number;
  createdThisWeek: number;
  computedToday: number;
  wecomCoverageRate: number;
  byStatus: Array<{ status: string; count: number; percentage: number }>;
  byComputeType: Array<{
    computeType: string;
    count: number;
    memberCount: number;
    percentage: number;
  }>;
  dailyTrend: Array<{ date: string; created: number; computed: number }>;
}

interface SizeAnalysis {
  sizeDistribution: Array<{ range: string; count: number; percentage: number }>;
  largestAudiences: Array<{
    id: number;
    name: string;
    computeType: string;
    status: string;
    customerCount: number;
    wecomCount: number;
    lastComputedAt: string | null;
  }>;
  emptyAudiences: Array<{
    id: number;
    name: string;
    status: string;
    createdAt: string;
  }>;
  avgCustomerCount: number;
  avgWecomCount: number;
  uniqueCustomerCount: number;
}

interface UsageAnalysis {
  inUseCount: number;
  unusedCount: number;
  byActivityStatus: Array<{ status: string; audienceCount: number }>;
  mostUsed: Array<{
    id: number;
    name: string;
    campaignCount: number;
    lastUsedAt: string | null;
  }>;
  neverUsed: Array<{
    id: number;
    name: string;
    customerCount: number;
    createdAt: string;
  }>;
}

interface HealthStatus {
  healthy: number;
  warning: number;
  critical: number;
  expiringSoon: Array<{
    id: number;
    name: string;
    expiredAt: string | null;
    daysUntilExpiry: number;
  }>;
  expired: Array<{
    id: number;
    name: string;
    expiredAt: string | null;
    daysSinceExpiry: number;
  }>;
  stale: Array<{
    id: number;
    name: string;
    lastComputedAt: string | null;
    daysSinceCompute: number;
  }>;
  stuck: Array<{
    id: number;
    name: string;
    updatedAt: string;
  }>;
}

// ==================== 状态 ====================

const router = useRouter();
const loading = ref(false);
const activeTab = ref('overview');

const overview = ref<StatisticsOverview | null>(null);
const sizeAnalysis = ref<SizeAnalysis | null>(null);
const usageAnalysis = ref<UsageAnalysis | null>(null);
const healthStatus = ref<HealthStatus | null>(null);

// ==================== 映射 ====================

const statusMap: Record<string, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  COMPUTING: { text: '计算中', color: 'processing' },
  READY: { text: '就绪', color: 'success' },
  EXPIRED: { text: '已过期', color: 'error' },
};

const computeTypeMap: Record<string, string> = {
  STATIC: '静态人群',
  DYNAMIC: '动态人群',
};

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, sizeRes, usageRes, healthRes] = await Promise.all([
      requestClient.get<StatisticsOverview>(
        '/marketing/audience/statistics/overview',
      ),
      requestClient.get<SizeAnalysis>(
        '/marketing/audience/statistics/size-analysis',
      ),
      requestClient.get<UsageAnalysis>('/marketing/audience/statistics/usage'),
      requestClient.get<HealthStatus>('/marketing/audience/statistics/health'),
    ]);
    overview.value = overviewRes;
    sizeAnalysis.value = sizeRes;
    usageAnalysis.value = usageRes;
    healthStatus.value = healthRes;
  } catch (e) {
    console.error('加载统计数据失败', e);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/marketing/campaign');
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

// ==================== 表格列定义 ====================

const largestColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'computeType', key: 'computeType' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  {
    title: '客户数',
    dataIndex: 'customerCount',
    key: 'customerCount',
    sorter: (a: any, b: any) => a.customerCount - b.customerCount,
  },
  { title: '企微数', dataIndex: 'wecomCount', key: 'wecomCount' },
  { title: '最后计算', dataIndex: 'lastComputedAt', key: 'lastComputedAt' },
];

const usedColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  {
    title: '使用次数',
    dataIndex: 'campaignCount',
    key: 'campaignCount',
    sorter: (a: any, b: any) => a.campaignCount - b.campaignCount,
  },
  { title: '最后使用', dataIndex: 'lastUsedAt', key: 'lastUsedAt' },
];

// ==================== 生命周期 ====================

onMounted(loadData);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button @click="goBack">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </Button>
        <h2 class="m-0 text-xl font-bold">人群包统计</h2>
      </div>
      <Button @click="loadData" :loading="loading">
        <template #icon><ReloadOutlined /></template>
        刷新
      </Button>
    </div>

    <Spin :spinning="loading">
      <Tabs v-model:activeKey="activeTab">
        <!-- 概览 Tab -->
        <TabPane key="overview" tab="统计概览">
          <template v-if="overview">
            <!-- 核心指标 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :sm="12" :md="6">
                <Card>
                  <Statistic
                    title="人群包总数"
                    :value="overview.totalAudiences"
                  >
                    <template #prefix><TeamOutlined /></template>
                  </Statistic>
                  <div class="mt-2 text-xs text-gray-500">
                    静态: {{ overview.staticCount }} / 动态:
                    {{ overview.dynamicCount }}
                  </div>
                </Card>
              </Col>
              <Col :xs="24" :sm="12" :md="6">
                <Card>
                  <Statistic title="总成员数" :value="overview.totalMembers">
                    <template #prefix><DatabaseOutlined /></template>
                  </Statistic>
                  <div class="mt-2 text-xs text-gray-500">
                    企微用户: {{ overview.totalWecomMembers }}
                  </div>
                </Card>
              </Col>
              <Col :xs="24" :sm="12" :md="6">
                <Card>
                  <Statistic
                    title="企微覆盖率"
                    :value="overview.wecomCoverageRate"
                    suffix="%"
                    :value-style="{
                      color:
                        overview.wecomCoverageRate >= 80
                          ? '#3f8600'
                          : '#fa8c16',
                    }"
                  />
                </Card>
              </Col>
              <Col :xs="24" :sm="12" :md="6">
                <Card>
                  <Statistic
                    title="就绪人群包"
                    :value="overview.readyCount"
                    :value-style="{ color: '#3f8600' }"
                  >
                    <template #prefix><CheckCircleOutlined /></template>
                  </Statistic>
                  <div class="mt-2 text-xs text-gray-500">
                    草稿: {{ overview.draftCount }} / 计算中:
                    {{ overview.computingCount }}
                  </div>
                </Card>
              </Col>
            </Row>

            <!-- 今日/本周数据 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic title="今日创建" :value="overview.createdToday" />
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="本周创建"
                    :value="overview.createdThisWeek"
                  />
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic title="今日计算" :value="overview.computedToday" />
                </Card>
              </Col>
            </Row>

            <!-- 分布统计 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :md="12">
                <Card title="按状态分布">
                  <div
                    v-for="item in overview.byStatus"
                    :key="item.status"
                    class="mb-3"
                  >
                    <div class="mb-1 flex justify-between">
                      <span>
                        <Badge :status="statusMap[item.status]?.color as any" />
                        {{ statusMap[item.status]?.text || item.status }}
                      </span>
                      <span>{{ item.count }} ({{ item.percentage }}%)</span>
                    </div>
                    <Progress
                      :percent="item.percentage"
                      :show-info="false"
                      size="small"
                    />
                  </div>
                </Card>
              </Col>
              <Col :xs="24" :md="12">
                <Card title="按类型分布">
                  <div
                    v-for="item in overview.byComputeType"
                    :key="item.computeType"
                    class="mb-3"
                  >
                    <div class="mb-1 flex justify-between">
                      <span>{{
                        computeTypeMap[item.computeType] || item.computeType
                      }}</span>
                      <span
                        >{{ item.count }} 个 / {{ item.memberCount }} 成员</span
                      >
                    </div>
                    <Progress
                      :percent="item.percentage"
                      :show-info="false"
                      size="small"
                      stroke-color="#1890ff"
                    />
                  </div>
                </Card>
              </Col>
            </Row>

            <!-- 7天趋势 -->
            <Card title="近7天创建趋势" class="mb-4">
              <div class="flex h-32 items-end gap-2">
                <div
                  v-for="item in overview.dailyTrend"
                  :key="item.date"
                  class="flex flex-1 flex-col items-center"
                >
                  <div
                    class="w-full rounded-t bg-blue-400"
                    :style="{
                      height: `${Math.max((item.created / Math.max(...overview.dailyTrend.map((d) => d.created), 1)) * 100, 4)}px`,
                    }"
                  ></div>
                  <div class="mt-2 text-xs text-gray-500">
                    {{ item.date.slice(5) }}
                  </div>
                  <div class="text-xs font-medium">{{ item.created }}</div>
                </div>
              </div>
            </Card>
          </template>
        </TabPane>

        <!-- 规模分析 Tab -->
        <TabPane key="size" tab="规模分析">
          <template v-if="sizeAnalysis">
            <!-- 统计指标 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="平均客户数"
                    :value="sizeAnalysis.avgCustomerCount"
                  />
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="平均企微数"
                    :value="sizeAnalysis.avgWecomCount"
                  />
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="覆盖独立客户"
                    :value="sizeAnalysis.uniqueCustomerCount"
                  />
                </Card>
              </Col>
            </Row>

            <Row :gutter="[16, 16]" class="mb-4">
              <!-- 规模分布 -->
              <Col :xs="24" :md="12">
                <Card title="人群规模分布">
                  <div
                    v-for="item in sizeAnalysis.sizeDistribution"
                    :key="item.range"
                    class="mb-3"
                  >
                    <div class="mb-1 flex justify-between">
                      <span>{{ item.range }} 人</span>
                      <span>{{ item.count }} ({{ item.percentage }}%)</span>
                    </div>
                    <Progress
                      :percent="item.percentage"
                      :show-info="false"
                      size="small"
                    />
                  </div>
                </Card>
              </Col>

              <!-- 空人群包 -->
              <Col :xs="24" :md="12">
                <Card title="空人群包">
                  <Alert
                    v-if="sizeAnalysis.emptyAudiences.length > 0"
                    type="warning"
                    show-icon
                    class="mb-3"
                  >
                    <template #message>
                      发现 {{ sizeAnalysis.emptyAudiences.length }} 个空人群包
                    </template>
                  </Alert>
                  <div
                    v-for="item in sizeAnalysis.emptyAudiences.slice(0, 10)"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <Tag>{{ statusMap[item.status]?.text || item.status }}</Tag>
                  </div>
                  <div
                    v-if="sizeAnalysis.emptyAudiences.length === 0"
                    class="text-center text-gray-400"
                  >
                    没有空人群包
                  </div>
                </Card>
              </Col>
            </Row>

            <!-- 最大人群包 -->
            <Card title="最大人群包 TOP 10">
              <Table
                :data-source="sizeAnalysis.largestAudiences"
                :columns="largestColumns"
                :pagination="false"
                size="small"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'computeType'">
                    <Tag>{{
                      computeTypeMap[record.computeType] || record.computeType
                    }}</Tag>
                  </template>
                  <template v-if="column.key === 'status'">
                    <Badge
                      :status="statusMap[record.status]?.color as any"
                      :text="statusMap[record.status]?.text || record.status"
                    />
                  </template>
                  <template v-if="column.key === 'lastComputedAt'">
                    {{ formatDateTime(record.lastComputedAt) }}
                  </template>
                </template>
              </Table>
            </Card>
          </template>
        </TabPane>

        <!-- 使用情况 Tab -->
        <TabPane key="usage" tab="使用情况">
          <template v-if="usageAnalysis">
            <!-- 使用统计 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :sm="12">
                <Card>
                  <Statistic
                    title="使用中"
                    :value="usageAnalysis.inUseCount"
                    :value-style="{ color: '#3f8600' }"
                  />
                </Card>
              </Col>
              <Col :xs="24" :sm="12">
                <Card>
                  <Statistic
                    title="未使用"
                    :value="usageAnalysis.unusedCount"
                    :value-style="{
                      color:
                        usageAnalysis.unusedCount > 0 ? '#fa8c16' : undefined,
                    }"
                  />
                </Card>
              </Col>
            </Row>

            <Row :gutter="[16, 16]" class="mb-4">
              <!-- 使用频率最高 -->
              <Col :xs="24" :lg="12">
                <Card title="使用频率最高 TOP 10">
                  <Table
                    :data-source="usageAnalysis.mostUsed"
                    :columns="usedColumns"
                    :pagination="false"
                    size="small"
                    row-key="id"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'lastUsedAt'">
                        {{ formatDateTime(record.lastUsedAt) }}
                      </template>
                    </template>
                  </Table>
                </Card>
              </Col>

              <!-- 从未使用 -->
              <Col :xs="24" :lg="12">
                <Card title="从未使用的人群包">
                  <div
                    v-for="item in usageAnalysis.neverUsed.slice(0, 10)"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <span class="text-gray-500"
                      >{{ item.customerCount }} 人</span
                    >
                  </div>
                  <div
                    v-if="usageAnalysis.neverUsed.length === 0"
                    class="text-center text-gray-400"
                  >
                    所有人群包都已使用
                  </div>
                </Card>
              </Col>
            </Row>
          </template>
        </TabPane>

        <!-- 健康状态 Tab -->
        <TabPane key="health" tab="健康状态">
          <template v-if="healthStatus">
            <!-- 健康指标 -->
            <Row :gutter="[16, 16]" class="mb-4">
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="健康"
                    :value="healthStatus.healthy"
                    :value-style="{ color: '#3f8600' }"
                  >
                    <template #prefix><CheckCircleOutlined /></template>
                  </Statistic>
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="警告"
                    :value="healthStatus.warning"
                    :value-style="{ color: '#fa8c16' }"
                  >
                    <template #prefix><WarningOutlined /></template>
                  </Statistic>
                </Card>
              </Col>
              <Col :xs="24" :sm="8">
                <Card>
                  <Statistic
                    title="严重"
                    :value="healthStatus.critical"
                    :value-style="{ color: '#cf1322' }"
                  >
                    <template #prefix><CloseCircleOutlined /></template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="[16, 16]">
              <!-- 即将过期 -->
              <Col :xs="24" :md="12">
                <Card title="即将过期（7天内）">
                  <template #extra>
                    <FieldTimeOutlined class="text-orange-500" />
                  </template>
                  <div
                    v-for="item in healthStatus.expiringSoon"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <Tag color="orange"
                      >{{ item.daysUntilExpiry }} 天后过期</Tag
                    >
                  </div>
                  <div
                    v-if="healthStatus.expiringSoon.length === 0"
                    class="text-center text-gray-400"
                  >
                    无即将过期
                  </div>
                </Card>
              </Col>

              <!-- 已过期 -->
              <Col :xs="24" :md="12">
                <Card title="已过期">
                  <template #extra>
                    <CloseCircleOutlined class="text-red-500" />
                  </template>
                  <div
                    v-for="item in healthStatus.expired.slice(0, 10)"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <Tag color="red">已过期 {{ item.daysSinceExpiry }} 天</Tag>
                  </div>
                  <div
                    v-if="healthStatus.expired.length === 0"
                    class="text-center text-gray-400"
                  >
                    无已过期
                  </div>
                </Card>
              </Col>
            </Row>

            <Row :gutter="[16, 16]" class="mt-4">
              <!-- 长时间未更新 -->
              <Col :xs="24" :md="12">
                <Card title="长时间未更新（30天以上）">
                  <div
                    v-for="item in healthStatus.stale.slice(0, 10)"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <Tag>{{ item.daysSinceCompute }} 天未更新</Tag>
                  </div>
                  <div
                    v-if="healthStatus.stale.length === 0"
                    class="text-center text-gray-400"
                  >
                    无长期未更新
                  </div>
                </Card>
              </Col>

              <!-- 计算卡住 -->
              <Col :xs="24" :md="12">
                <Card title="计算卡住">
                  <Alert
                    v-if="healthStatus.stuck.length > 0"
                    type="error"
                    show-icon
                    class="mb-3"
                  >
                    <template #message>
                      发现 {{ healthStatus.stuck.length }} 个人群包计算卡住
                    </template>
                  </Alert>
                  <div
                    v-for="item in healthStatus.stuck"
                    :key="item.id"
                    class="mb-2 flex items-center justify-between"
                  >
                    <span class="truncate">{{ item.name }}</span>
                    <Tag color="red">计算中</Tag>
                  </div>
                  <div
                    v-if="healthStatus.stuck.length === 0"
                    class="text-center text-green-500"
                  >
                    <CheckCircleOutlined /> 无卡住任务
                  </div>
                </Card>
              </Col>
            </Row>
          </template>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
