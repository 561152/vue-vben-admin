<script lang="ts" setup>
import { h } from 'vue';
import { Row, Col, Card, Progress, Tag, Table, Empty } from 'ant-design-vue';
import {
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
} from '@ant-design/icons-vue';

import {
  StatisticCardRow,
  RankingTable,
  TrendBarChart,
  DistributionTable,
  StatisticsPageLayout,
  type StatisticItem,
  type RankingColumn,
  type DistributionColumn,
} from '#/components/statistics';
import { useStatistics, formatDate } from '#/hooks/useStatistics';
import {
  customerLevelOptions,
  customerSourceOptions,
} from '#/constants/crm-options';

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

// ==================== 数据加载 ====================

interface TagStats {
  overview: TagOverview;
  usageAnalysis: UsageAnalysis;
  unusedTags: UnusedTag[];
}

const { loading, data } = useStatistics<TagStats>({
  overview: '/tags/statistics/overview',
  usageAnalysis: '/tags/statistics/usage-analysis',
  unusedTags: '/tags/statistics/unused',
});

// ==================== 统计卡片配置 ====================

const overviewCards = computed<StatisticItem[]>(() => [
  {
    title: '总标签数',
    value: data.overview.value?.totalTags || 0,
    prefixIcon: TagsOutlined,
  },
  {
    title: '使用中标签',
    value: data.overview.value?.activeTags || 0,
    prefixIcon: CheckCircleOutlined,
    valueColor: '#52c41a',
  },
  {
    title: '未使用标签',
    value: data.overview.value?.unusedTags || 0,
    prefixIcon: CloseCircleOutlined,
    valueColor: '#ff4d4f',
  },
  {
    title: '已打标客户',
    value: data.overview.value?.taggedCustomers || 0,
    prefixIcon: UserOutlined,
    valueColor: '#1890ff',
  },
  {
    title: '未打标客户',
    value: data.overview.value?.untaggedCustomers || 0,
    valueColor: '#faad14',
  },
  {
    title: '打标率',
    value: data.overview.value?.taggingRate || 0,
    prefixIcon: PercentageOutlined,
    suffix: '%',
    colorThreshold: 50,
  },
]);

// ==================== 表格列配置 ====================

const topTagColumns: RankingColumn[] = [
  { title: '排名', key: 'rank', width: 60, isRank: true },
  {
    title: '标签',
    key: 'tag',
    dataIndex: 'tagName',
    isTag: true,
    tagColorField: 'tagColor',
    tagIcon: TagOutlined,
  },
  {
    title: '客户数',
    dataIndex: 'customerCount',
    key: 'customerCount',
    width: 100,
  },
  {
    title: '占比',
    key: 'percentage',
    dataIndex: 'percentage',
    showProgress: true,
    progressThreshold: 20,
  },
];

const levelColumns: DistributionColumn[] = [
  {
    title: '客户等级',
    key: 'level',
    dataIndex: 'level',
    options: customerLevelOptions,
  },
  { title: '已打标', dataIndex: 'taggedCount', key: 'taggedCount' },
  { title: '总数', dataIndex: 'totalCount', key: 'totalCount' },
  {
    title: '打标率',
    key: 'taggingRate',
    dataIndex: 'taggingRate',
    showProgress: true,
  },
  {
    title: '平均标签数',
    dataIndex: 'avgTagsPerCustomer',
    key: 'avgTagsPerCustomer',
  },
];

const sourceColumns: DistributionColumn[] = [
  {
    title: '客户来源',
    key: 'source',
    dataIndex: 'source',
    options: customerSourceOptions,
  },
  { title: '已打标', dataIndex: 'taggedCount', key: 'taggedCount' },
  { title: '总数', dataIndex: 'totalCount', key: 'totalCount' },
  {
    title: '打标率',
    key: 'taggingRate',
    dataIndex: 'taggingRate',
    showProgress: true,
  },
];

// ==================== 趋势数据 ====================

const trendData = computed(() =>
  (data.overview.value?.recentTrend || []).map((item) => ({
    date: item.date,
    value: item.newTaggings,
  })),
);
</script>

<script lang="ts">
import { computed } from 'vue';

export default {
  name: 'TagStatistics',
};
</script>

<template>
  <StatisticsPageLayout
    title="标签统计分析"
    back-path="/crm/tag"
    :loading="loading"
  >
    <!-- 概览统计卡片 -->
    <StatisticCardRow :items="overviewCards" />

    <!-- 打标率和平均标签数 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card title="客户打标覆盖率">
          <div class="flex items-center justify-center">
            <Progress
              type="circle"
              :percent="data.overview.value?.taggingRate || 0"
              :stroke-color="
                (data.overview.value?.taggingRate || 0) >= 50
                  ? '#52c41a'
                  : '#faad14'
              "
              :size="120"
            />
          </div>
          <div class="mt-3 text-center text-gray-500">
            平均每客户 {{ data.overview.value?.avgTagsPerCustomer || 0 }} 个标签
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="总打标次数">
          <div
            class="flex flex-col items-center justify-center"
            style="height: 140px"
          >
            <div class="text-4xl font-bold text-blue-500">
              {{ data.overview.value?.totalTaggings || 0 }}
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
                {{ data.overview.value?.activeTags || 0 }}
              </div>
              <div class="text-gray-500">使用中</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-500">
                {{ data.overview.value?.unusedTags || 0 }}
              </div>
              <div class="text-gray-500">未使用</div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 热门标签排行和趋势 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <RankingTable
          title="热门标签 TOP10"
          :data-source="data.overview.value?.topTags || []"
          :columns="topTagColumns"
        />
      </Col>
      <Col :span="12">
        <TrendBarChart
          title="近7日打标趋势"
          :data="trendData"
          label="新增打标"
          color="#3b82f6"
        />
      </Col>
    </Row>

    <!-- 按客户等级和来源分析 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <DistributionTable
          title="按客户等级分析"
          :data-source="data.usageAnalysis.value?.byCustomerLevel || []"
          :columns="levelColumns"
        />
      </Col>
      <Col :span="12">
        <DistributionTable
          title="按客户来源分析"
          :data-source="data.usageAnalysis.value?.byCustomerSource || []"
          :columns="sourceColumns"
        />
      </Col>
    </Row>

    <!-- 标签组合和未使用标签 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <Card title="常见标签组合">
          <Table
            :columns="[
              { title: '标签组合', key: 'tags' },
              {
                title: '客户数',
                dataIndex: 'customerCount',
                key: 'customerCount',
                width: 100,
              },
            ]"
            :data-source="
              (data.usageAnalysis.value?.tagCombinations || []).map(
                (item, index) => ({
                  ...item,
                  key: index,
                }),
              )
            "
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
          <Empty
            v-if="!data.usageAnalysis.value?.tagCombinations?.length"
            description="暂无数据"
          />
        </Card>
      </Col>
      <Col :span="12">
        <Card title="未使用的标签">
          <Table
            :columns="[
              { title: '标签名称', key: 'tag' },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
            ]"
            :data-source="
              (data.unusedTags.value || []).map((item, index) => ({
                ...item,
                key: index,
              }))
            "
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
          <Empty
            v-if="!data.unusedTags.value?.length"
            description="没有未使用的标签"
          />
        </Card>
      </Col>
    </Row>
  </StatisticsPageLayout>
</template>
