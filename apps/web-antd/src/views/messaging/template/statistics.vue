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
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  TrophyOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

const router = useRouter();

// ==================== 类型定义 ====================

interface TemplateOverview {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  totalUsageCount: number;
  avgUsagePerTemplate: number;
  mostUsedTemplate: {
    id: number;
    name: string;
    usageCount: number;
  } | null;
  newTemplatesThisWeek: number;
  usageThisWeek: number;
  newTemplatesToday: number;
  byCategory: Array<{
    category: string | null;
    count: number;
    totalUsage: number;
    percentage: number;
  }>;
  topTemplates: Array<{
    id: number;
    name: string;
    category: string | null;
    usageCount: number;
    isActive: boolean;
  }>;
  dailyTrend: Array<{
    date: string;
    newTemplates: number;
  }>;
}

interface UsageAnalysis {
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byCreator: Array<{
    creatorId: number;
    creatorName: string | null;
    templateCount: number;
    totalUsage: number;
  }>;
  usageDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  unusedTemplates: Array<{
    id: number;
    name: string;
    category: string | null;
    createdAt: string;
    isActive: boolean;
  }>;
  lowUsageTemplates: Array<{
    id: number;
    name: string;
    category: string | null;
    usageCount: number;
    isActive: boolean;
  }>;
}

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<TemplateOverview | null>(null);
const usageAnalysis = ref<UsageAnalysis | null>(null);

// ==================== 表格列定义 ====================

const topTemplateColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '模板名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '分类', key: 'category', width: 100 },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
  { title: '状态', key: 'status', width: 80 },
];

const creatorColumns = [
  { title: '创建者', key: 'creator' },
  { title: '模板数', dataIndex: 'templateCount', key: 'templateCount' },
  { title: '总使用量', dataIndex: 'totalUsage', key: 'totalUsage' },
];

const unusedColumns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '分类', key: 'category', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', key: 'createdAt', width: 120 },
];

const lowUsageColumns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '分类', key: 'category', width: 100 },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
  { title: '状态', key: 'status', width: 80 },
];

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, analysisRes] = await Promise.all([
      requestClient.get<TemplateOverview>(
        '/messaging/template/statistics/overview',
      ),
      requestClient.get<UsageAnalysis>(
        '/messaging/template/statistics/usage-analysis',
      ),
    ]);
    overview.value = overviewRes;
    usageAnalysis.value = analysisRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/messaging/template');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
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
        <h2 class="m-0 text-xl font-bold">消息模板统计</h2>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- 概览统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="4">
          <Card>
            <Statistic
              title="总模板数"
              :value="overview?.totalTemplates || 0"
              :prefix="h(FileTextOutlined)"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="启用中"
              :value="overview?.activeTemplates || 0"
              :prefix="h(CheckCircleOutlined)"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="已禁用"
              :value="overview?.inactiveTemplates || 0"
              :prefix="h(CloseCircleOutlined)"
              :value-style="{ color: '#ff4d4f' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总使用次数"
              :value="overview?.totalUsageCount || 0"
              :prefix="h(RiseOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="平均使用次数"
              :value="overview?.avgUsagePerTemplate || 0"
              :value-style="{ color: '#722ed1' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="本周新增"
              :value="overview?.newTemplatesThisWeek || 0"
              :prefix="h(PlusOutlined)"
              :value-style="{ color: '#13c2c2' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 最常用模板和今日数据 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="最常用模板">
            <div
              v-if="overview?.mostUsedTemplate"
              class="flex flex-col items-center justify-center"
              style="height: 120px"
            >
              <TrophyOutlined class="mb-2 text-4xl text-yellow-500" />
              <div class="text-center text-lg font-bold">
                {{ overview.mostUsedTemplate.name }}
              </div>
              <div class="mt-1 text-gray-500">
                使用 {{ overview.mostUsedTemplate.usageCount }} 次
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="今日数据">
            <div class="flex items-center justify-center" style="height: 120px">
              <div class="text-center">
                <div class="text-3xl font-bold text-purple-500">
                  {{ overview?.newTemplatesToday || 0 }}
                </div>
                <div class="mt-2 text-gray-500">今日新增模板</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="状态分布">
            <div v-if="usageAnalysis?.byStatus?.length">
              <div
                v-for="item in usageAnalysis.byStatus"
                :key="item.status"
                class="mb-3 flex items-center justify-between"
              >
                <Tag :color="item.status === '启用' ? 'success' : 'default'">
                  {{ item.status }}
                </Tag>
                <div class="mx-3 flex-1">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                    :stroke-color="
                      item.status === '启用' ? '#52c41a' : '#d9d9d9'
                    "
                  />
                </div>
                <span>{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 分类统计和使用分布 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="分类统计">
            <div v-if="overview?.byCategory?.length">
              <div
                v-for="item in overview.byCategory"
                :key="item.category || 'uncategorized'"
                class="mb-3 flex items-center justify-between"
              >
                <Tag color="blue">
                  {{ item.category || '未分类' }}
                </Tag>
                <div class="mx-3 flex-1">
                  <Progress :percent="item.percentage" :show-info="false" />
                </div>
                <span class="text-gray-500"
                  >{{ item.count }} 个 / {{ item.totalUsage }} 次使用</span
                >
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="使用量分布">
            <div v-if="usageAnalysis?.usageDistribution?.length">
              <div
                v-for="item in usageAnalysis.usageDistribution"
                :key="item.range"
                class="mb-3 flex items-center justify-between"
              >
                <span class="w-20 text-gray-600">{{ item.range }}</span>
                <div class="mx-3 flex-1">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                    :stroke-color="item.range === '0次' ? '#ff4d4f' : '#1890ff'"
                  />
                </div>
                <span>{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 热门模板排行和创建者统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="14">
          <Card title="使用量 TOP 10">
            <Table
              :columns="topTemplateColumns"
              :data-source="
                (overview?.topTemplates || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
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
                <template v-if="column.key === 'category'">
                  <Tag v-if="record.category" color="blue">{{
                    record.category
                  }}</Tag>
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="record.isActive ? 'success' : 'default'">
                    {{ record.isActive ? '启用' : '禁用' }}
                  </Tag>
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="10">
          <Card title="创建者统计">
            <Table
              :columns="creatorColumns"
              :data-source="
                (usageAnalysis?.byCreator || [])
                  .slice(0, 8)
                  .map((item, index) => ({ ...item, key: index }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'creator'">
                  {{ record.creatorName || `用户${record.creatorId}` }}
                </template>
              </template>
            </Table>
            <Empty
              v-if="!usageAnalysis?.byCreator?.length"
              description="暂无数据"
            />
          </Card>
        </Col>
      </Row>

      <!-- 近7天趋势 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="24">
          <Card title="近7日新增趋势">
            <div
              v-if="overview?.dailyTrend?.length"
              class="flex items-end justify-around"
              style="height: 160px"
            >
              <div
                v-for="(item, index) in overview.dailyTrend"
                :key="index"
                class="flex flex-col items-center"
              >
                <div class="mb-1 text-xs text-blue-500">
                  {{ item.newTemplates }}
                </div>
                <div
                  class="w-12 rounded-t bg-blue-500"
                  :style="{
                    height: `${Math.max(10, (item.newTemplates / Math.max(...overview.dailyTrend.map((d) => d.newTemplates), 1)) * 120)}px`,
                  }"
                />
                <div class="mt-2 text-xs text-gray-400">
                  {{ item.date.slice(5) }}
                </div>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 未使用和低使用率模板 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="未使用模板">
            <Table
              :columns="unusedColumns"
              :data-source="
                (usageAnalysis?.unusedTemplates || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'category'">
                  <Tag v-if="record.category" color="blue">{{
                    record.category
                  }}</Tag>
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="record.isActive ? 'success' : 'default'">
                    {{ record.isActive ? '启用' : '禁用' }}
                  </Tag>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </Table>
            <Empty
              v-if="!usageAnalysis?.unusedTemplates?.length"
              description="没有未使用的模板"
            />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="低使用率模板 (使用<5次)">
            <Table
              :columns="lowUsageColumns"
              :data-source="
                (usageAnalysis?.lowUsageTemplates || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'category'">
                  <Tag v-if="record.category" color="blue">{{
                    record.category
                  }}</Tag>
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="record.isActive ? 'success' : 'default'">
                    {{ record.isActive ? '启用' : '禁用' }}
                  </Tag>
                </template>
              </template>
            </Table>
            <Empty
              v-if="!usageAnalysis?.lowUsageTemplates?.length"
              description="没有低使用率的模板"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MessageTemplateStatistics',
};
</script>
