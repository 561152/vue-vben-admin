<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  SendOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

interface MaterialStatistics {
  totalMaterials: number;
  todayAdded: number;
  weekAdded: number;
  activeMaterials: number;
  draftMaterials: number;
  archivedMaterials: number;
  totalViews: number;
  totalUsages: number;
  byType: Array<{ type: string; count: number }>;
  byCategory: Array<{
    categoryId: number | null;
    categoryName: string;
    count: number;
  }>;
  popularTags: Array<{ tag: string; count: number }>;
  dailyTrend: Array<{ date: string; addedCount: number; usageCount: number }>;
}

interface PopularMaterial {
  id: number;
  name: string;
  type: string;
  viewCount: number;
  usageCount: number;
  categoryName: string | null;
}

interface UsageRecord {
  id: number;
  materialId: number;
  materialName: string;
  usageType: string;
  targetId: string | null;
  createdAt: string;
}

interface UsageRanking {
  materialId: number;
  materialName: string;
  usageCount: number;
}

// ==================== 状态 ====================

const loading = ref(false);
const statistics = ref<MaterialStatistics | null>(null);
const popularMaterials = ref<PopularMaterial[]>([]);
const usageRecords = ref<UsageRecord[]>([]);
const usageRecordsTotal = ref(0);
const usageRecordsPage = ref(1);
const usageRecordsLoading = ref(false);
const usageRanking = ref<UsageRanking[]>([]);
const usageRankingLoading = ref(false);
const rankingPeriod = ref<'day' | 'week' | 'month'>('week');

// ==================== 常量 ====================

const typeIcons: Record<string, any> = {
  TEXT: FileTextOutlined,
  IMAGE: PictureOutlined,
  VIDEO: VideoCameraOutlined,
  LINK: LinkOutlined,
  FILE: FileOutlined,
  MIXED: FolderOutlined,
};

const typeLabels: Record<string, string> = {
  TEXT: '文本',
  IMAGE: '图片',
  VIDEO: '视频',
  LINK: '链接',
  FILE: '文件',
  MIXED: '图文',
};

const usageTypeLabels: Record<string, string> = {
  MOMENT: '朋友圈',
  MASS_MESSAGE: '群发消息',
  DIRECT_MESSAGE: '直发消息',
  SCHEDULED_MESSAGE: '定时消息',
};

const popularColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '素材名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '分类', dataIndex: 'categoryName', key: 'categoryName', width: 100 },
  { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 80 },
  { title: '使用', dataIndex: 'usageCount', key: 'usageCount', width: 80 },
];

const usageRecordColumns = [
  { title: '素材', dataIndex: 'materialName', key: 'materialName', width: 200 },
  { title: '使用场景', dataIndex: 'usageType', key: 'usageType', width: 120 },
  { title: '使用时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
];

const rankingColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '素材名称', dataIndex: 'materialName', key: 'materialName' },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
];

// ==================== API ====================

async function fetchStatistics() {
  loading.value = true;
  try {
    const res = await requestClient.get<MaterialStatistics>(
      '/messaging/material/statistics/overview',
    );
    statistics.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchPopularMaterials() {
  try {
    const res = await requestClient.get<PopularMaterial[]>(
      '/messaging/material/statistics/popular',
      { params: { limit: 10 } },
    );
    popularMaterials.value = res || [];
  } catch (e) {
    console.error(e);
  }
}

async function fetchUsageRecords() {
  usageRecordsLoading.value = true;
  try {
    const res = await requestClient.get<{
      items: UsageRecord[];
      total: number;
    }>('/messaging/material/statistics/usage-records', {
      params: { page: usageRecordsPage.value, pageSize: 10 },
    });
    usageRecords.value = res.items || [];
    usageRecordsTotal.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    usageRecordsLoading.value = false;
  }
}

async function fetchUsageRanking() {
  usageRankingLoading.value = true;
  try {
    const res = await requestClient.get<UsageRanking[]>(
      '/messaging/material/statistics/usage-ranking',
      { params: { period: rankingPeriod.value, limit: 10 } },
    );
    usageRanking.value = res || [];
  } catch (e) {
    console.error(e);
  } finally {
    usageRankingLoading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleUsageRecordsPageChange(page: number) {
  usageRecordsPage.value = page;
  fetchUsageRecords();
}

function handlePeriodChange(value: unknown) {
  rankingPeriod.value = value as 'day' | 'week' | 'month';
  fetchUsageRanking();
}

function goBack() {
  window.history.back();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchStatistics();
  fetchPopularMaterials();
  fetchUsageRecords();
  fetchUsageRanking();
});
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="mb-4 flex items-center">
      <Button type="text" @click="goBack">
        <ArrowLeftOutlined />
      </Button>
      <h2 class="ml-2 text-xl font-bold">素材库数据统计</h2>
    </div>

    <!-- Overview Statistics -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="4">
        <Card>
          <Statistic title="总素材数" :value="statistics.totalMaterials" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="今日新增"
            :value="statistics.todayAdded"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="本周新增" :value="statistics.weekAdded" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic
            title="活跃素材"
            :value="statistics.activeMaterials"
            :value-style="{ color: '#3f8600' }"
          />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="草稿" :value="statistics.draftMaterials" />
        </Card>
      </Col>
      <Col :span="4">
        <Card>
          <Statistic title="已归档" :value="statistics.archivedMaterials" />
        </Card>
      </Col>
    </Row>

    <!-- Usage Statistics -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="6">
        <Card>
          <Statistic title="总浏览次数" :value="statistics.totalViews">
            <template #prefix>
              <EyeOutlined class="text-blue-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="总使用次数" :value="statistics.totalUsages">
            <template #prefix>
              <SendOutlined class="text-green-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="按类型分布">
          <div class="flex flex-wrap gap-4">
            <div
              v-for="item in statistics.byType"
              :key="item.type"
              class="flex items-center gap-2"
            >
              <component :is="typeIcons[item.type]" class="text-gray-500" />
              <span>{{ typeLabels[item.type] || item.type }}</span>
              <span class="font-medium">{{ item.count }}</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Tags & Categories -->
    <Row :gutter="16" class="mb-4" v-if="statistics">
      <Col :span="12">
        <Card title="热门标签">
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="(item, index) in statistics.popularTags"
              :key="item.tag"
              :color="index < 3 ? 'blue' : 'default'"
            >
              {{ item.tag }} ({{ item.count }})
            </Tag>
            <span v-if="!statistics.popularTags?.length" class="text-gray-400">
              暂无标签数据
            </span>
          </div>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="按分类统计">
          <div class="flex flex-wrap gap-4">
            <div
              v-for="item in statistics.byCategory"
              :key="item.categoryId ?? 'uncategorized'"
              class="flex items-center gap-2"
            >
              <FolderOutlined class="text-gray-400" />
              <span>{{ item.categoryName }}</span>
              <span class="font-medium text-blue-500">{{ item.count }}</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Daily Trend -->
    <Card class="mb-4" title="近7天趋势" v-if="statistics?.dailyTrend?.length">
      <Table
        :data-source="statistics.dailyTrend"
        :pagination="false"
        size="small"
        row-key="date"
      >
        <Table.Column title="日期" dataIndex="date" key="date" />
        <Table.Column
          title="新增素材"
          dataIndex="addedCount"
          key="addedCount"
        />
        <Table.Column
          title="使用次数"
          dataIndex="usageCount"
          key="usageCount"
        />
      </Table>
    </Card>

    <Row :gutter="16" class="mb-4">
      <!-- Popular Materials -->
      <Col :span="12">
        <Card title="热门素材 TOP10">
          <Table
            :columns="popularColumns"
            :data-source="popularMaterials"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'rank'">
                <span
                  :class="{
                    'font-bold text-yellow-500': index === 0,
                    'font-bold text-gray-400': index === 1,
                    'font-bold text-orange-400': index === 2,
                  }"
                >
                  {{ index + 1 }}
                </span>
              </template>
              <template v-if="column.key === 'type'">
                <Tag>{{ typeLabels[record.type] || record.type }}</Tag>
              </template>
              <template v-if="column.key === 'viewCount'">
                <span class="text-gray-500">
                  <EyeOutlined /> {{ record.viewCount }}
                </span>
              </template>
              <template v-if="column.key === 'usageCount'">
                <span class="text-gray-500">
                  <SendOutlined /> {{ record.usageCount }}
                </span>
              </template>
            </template>
          </Table>
        </Card>
      </Col>

      <!-- Usage Ranking -->
      <Col :span="12">
        <Card title="使用排行">
          <template #extra>
            <Select
              v-model:value="rankingPeriod"
              size="small"
              style="width: 100px"
              @change="handlePeriodChange"
            >
              <Select.Option value="day">今日</Select.Option>
              <Select.Option value="week">本周</Select.Option>
              <Select.Option value="month">本月</Select.Option>
            </Select>
          </template>
          <Table
            :columns="rankingColumns"
            :data-source="usageRanking"
            :loading="usageRankingLoading"
            :pagination="false"
            size="small"
            row-key="materialId"
          >
            <template #bodyCell="{ column, index }">
              <template v-if="column.key === 'rank'">
                <span
                  :class="{
                    'font-bold text-yellow-500': index === 0,
                    'font-bold text-gray-400': index === 1,
                    'font-bold text-orange-400': index === 2,
                  }"
                >
                  {{ index + 1 }}
                </span>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>

    <!-- Recent Usage Records -->
    <Card title="最近使用记录">
      <Table
        :columns="usageRecordColumns"
        :data-source="usageRecords"
        :loading="usageRecordsLoading"
        :pagination="{
          current: usageRecordsPage,
          pageSize: 10,
          total: usageRecordsTotal,
          onChange: handleUsageRecordsPageChange,
          size: 'small',
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'usageType'">
            <Tag color="blue">
              {{ usageTypeLabels[record.usageType] || record.usageType }}
            </Tag>
          </template>
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
