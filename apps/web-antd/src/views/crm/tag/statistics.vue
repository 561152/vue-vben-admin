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
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

const router = useRouter();

// ==================== 类型定义 ====================

interface TagOverview {
  totalTags: number;
  activeTags: number;
  unusedTags: number;
  totalTaggings: number;
  avgTagsPerCustomer: number;
  taggedCustomers: number;
  untaggedCustomers: number;
  taggingRate: number;
  topTags: Array<{
    tagId: number;
    tagName: string;
    tagColor: string;
    customerCount: number;
    percentage: number;
  }>;
  recentTrend: Array<{
    date: string;
    newTaggings: number;
  }>;
}

interface UsageAnalysis {
  byCustomerLevel: Array<{
    level: string;
    taggedCount: number;
    totalCount: number;
    taggingRate: number;
    avgTagsPerCustomer: number;
  }>;
  byCustomerSource: Array<{
    source: string;
    taggedCount: number;
    totalCount: number;
    taggingRate: number;
  }>;
  tagCombinations: Array<{
    tags: string[];
    customerCount: number;
  }>;
}

interface UnusedTag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<TagOverview | null>(null);
const usageAnalysis = ref<UsageAnalysis | null>(null);
const unusedTags = ref<UnusedTag[]>([]);

// ==================== 客户等级映射 ====================

const levelMap: Record<string, string> = {
  VIP: 'VIP客户',
  IMPORTANT: '重要客户',
  NORMAL: '普通客户',
  POTENTIAL: '潜在客户',
  INACTIVE: '不活跃',
};

// ==================== 客户来源映射 ====================

const sourceMap: Record<string, string> = {
  WECOM: '企业微信',
  WECHAT: '微信',
  PHONE: '电话',
  WEBSITE: '网站',
  REFERRAL: '转介绍',
  OTHER: '其他',
};

// ==================== 表格列定义 ====================

const topTagColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '标签', key: 'tag' },
  { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', width: 100 },
  { title: '占比', key: 'percentage', width: 100 },
];

const levelColumns = [
  { title: '客户等级', key: 'level' },
  { title: '已打标', dataIndex: 'taggedCount', key: 'taggedCount' },
  { title: '总数', dataIndex: 'totalCount', key: 'totalCount' },
  { title: '打标率', key: 'taggingRate' },
  { title: '平均标签数', dataIndex: 'avgTagsPerCustomer', key: 'avgTagsPerCustomer' },
];

const sourceColumns = [
  { title: '客户来源', key: 'source' },
  { title: '已打标', dataIndex: 'taggedCount', key: 'taggedCount' },
  { title: '总数', dataIndex: 'totalCount', key: 'totalCount' },
  { title: '打标率', key: 'taggingRate' },
];

const combinationColumns = [
  { title: '标签组合', key: 'tags' },
  { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', width: 100 },
];

const unusedColumns = [
  { title: '标签名称', key: 'tag' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
];

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, analysisRes, unusedRes] = await Promise.all([
      requestClient.get<TagOverview>('/tags/statistics/overview'),
      requestClient.get<UsageAnalysis>('/tags/statistics/usage-analysis'),
      requestClient.get<UnusedTag[]>('/tags/statistics/unused'),
    ]);
    overview.value = overviewRes;
    usageAnalysis.value = analysisRes;
    unusedTags.value = unusedRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/crm/tag');
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
        <h2 class="m-0 text-xl font-bold">标签统计分析</h2>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- 概览统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="4">
          <Card>
            <Statistic
              title="总标签数"
              :value="overview?.totalTags || 0"
              :prefix="h(TagsOutlined)"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="使用中标签"
              :value="overview?.activeTags || 0"
              :prefix="h(CheckCircleOutlined)"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="未使用标签"
              :value="overview?.unusedTags || 0"
              :prefix="h(CloseCircleOutlined)"
              :value-style="{ color: '#ff4d4f' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="已打标客户"
              :value="overview?.taggedCustomers || 0"
              :prefix="h(UserOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="未打标客户"
              :value="overview?.untaggedCustomers || 0"
              :value-style="{ color: '#faad14' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="打标率"
              :value="overview?.taggingRate || 0"
              suffix="%"
              :prefix="h(PercentageOutlined)"
              :value-style="{ color: overview?.taggingRate && overview.taggingRate >= 50 ? '#52c41a' : '#faad14' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 打标率和平均标签数 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="客户打标覆盖率">
            <div class="flex items-center justify-center">
              <Progress
                type="circle"
                :percent="overview?.taggingRate || 0"
                :stroke-color="overview?.taggingRate && overview.taggingRate >= 50 ? '#52c41a' : '#faad14'"
                :size="120"
              />
            </div>
            <div class="mt-3 text-center text-gray-500">
              平均每客户 {{ overview?.avgTagsPerCustomer || 0 }} 个标签
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="总打标次数">
            <div class="flex flex-col items-center justify-center" style="height: 140px">
              <div class="text-4xl font-bold text-blue-500">
                {{ overview?.totalTaggings || 0 }}
              </div>
              <div class="mt-2 text-gray-500">次标签关联</div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="标签使用情况">
            <div class="flex items-center justify-around" style="height: 140px">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">
                  {{ overview?.activeTags || 0 }}
                </div>
                <div class="text-gray-500">使用中</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-500">
                  {{ overview?.unusedTags || 0 }}
                </div>
                <div class="text-gray-500">未使用</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 热门标签排行 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="热门标签 TOP10">
            <Table
              :columns="topTagColumns"
              :data-source="(overview?.topTags || []).map((item, index) => ({ ...item, key: index }))"
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
                <template v-if="column.key === 'tag'">
                  <Tag :color="record.tagColor">
                    <TagOutlined class="mr-1" />
                    {{ record.tagName }}
                  </Tag>
                </template>
                <template v-if="column.key === 'percentage'">
                  <Progress
                    :percent="record.percentage"
                    :size="60"
                    :stroke-color="record.percentage >= 20 ? '#52c41a' : '#1890ff'"
                  />
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="近7日打标趋势">
            <div v-if="overview?.recentTrend?.length" class="flex items-end justify-around" style="height: 240px">
              <div
                v-for="(item, index) in overview.recentTrend"
                :key="index"
                class="flex flex-col items-center"
              >
                <div class="mb-1 text-xs text-gray-500">{{ item.newTaggings }}</div>
                <div
                  class="w-10 rounded-t bg-blue-500"
                  :style="{ height: `${Math.max(20, (item.newTaggings / Math.max(...overview.recentTrend.map(d => d.newTaggings), 1)) * 180)}px` }"
                />
                <div class="mt-2 text-xs text-gray-400">
                  {{ item.date.slice(5) }}
                </div>
              </div>
            </div>
            <div v-else class="flex h-60 items-center justify-center">
              <Empty description="暂无数据" />
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 按客户等级和来源分析 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="按客户等级分析">
            <Table
              :columns="levelColumns"
              :data-source="(usageAnalysis?.byCustomerLevel || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  {{ levelMap[record.level] || record.level }}
                </template>
                <template v-if="column.key === 'taggingRate'">
                  <Progress
                    :percent="record.taggingRate"
                    :size="60"
                    :stroke-color="record.taggingRate >= 50 ? '#52c41a' : '#faad14'"
                  />
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="按客户来源分析">
            <Table
              :columns="sourceColumns"
              :data-source="(usageAnalysis?.byCustomerSource || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'source'">
                  {{ sourceMap[record.source] || record.source }}
                </template>
                <template v-if="column.key === 'taggingRate'">
                  <Progress
                    :percent="record.taggingRate"
                    :size="60"
                    :stroke-color="record.taggingRate >= 50 ? '#52c41a' : '#faad14'"
                  />
                </template>
              </template>
            </Table>
          </Card>
        </Col>
      </Row>

      <!-- 标签组合和未使用标签 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="常见标签组合">
            <Table
              :columns="combinationColumns"
              :data-source="(usageAnalysis?.tagCombinations || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'tags'">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="(tag, i) in record.tags" :key="i" color="blue">
                      {{ tag }}
                    </Tag>
                  </div>
                </template>
              </template>
            </Table>
            <Empty v-if="!usageAnalysis?.tagCombinations?.length" description="暂无数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="未使用的标签">
            <Table
              :columns="unusedColumns"
              :data-source="unusedTags.map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'tag'">
                  <Tag :color="record.color">
                    <TagOutlined class="mr-1" />
                    {{ record.name }}
                  </Tag>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </Table>
            <Empty v-if="!unusedTags.length" description="没有未使用的标签" />
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TagStatistics',
};
</script>
