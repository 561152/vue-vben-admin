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
  Alert,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileOutlined,
  CloudOutlined,
  SyncOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

const router = useRouter();

// ==================== 类型定义 ====================

interface MediaOverview {
  totalMedia: number;
  totalSize: number;
  totalSizeFormatted: string;
  imageCount: number;
  videoCount: number;
  fileCount: number;
  syncedCount: number;
  expiredCount: number;
  notSyncedCount: number;
  newMediaThisWeek: number;
  sizeThisWeek: number;
  newMediaToday: number;
  byType: Array<{
    type: string;
    count: number;
    totalSize: number;
    percentage: number;
  }>;
  largestMedia: Array<{
    id: number;
    name: string;
    type: string;
    fileSize: number;
    fileSizeFormatted: string;
    createdAt: string;
  }>;
  dailyTrend: Array<{
    date: string;
    count: number;
    size: number;
  }>;
}

interface StorageAnalysis {
  totalStorage: number;
  totalStorageFormatted: string;
  avgFileSize: number;
  avgFileSizeFormatted: string;
  storageByType: Array<{
    type: string;
    totalSize: number;
    totalSizeFormatted: string;
    count: number;
    avgSize: number;
    percentage: number;
  }>;
  sizeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  byCreator: Array<{
    creatorId: number;
    creatorName: string | null;
    mediaCount: number;
    totalSize: number;
    totalSizeFormatted: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    size: number;
  }>;
}

interface SyncStatus {
  total: number;
  synced: number;
  expired: number;
  notSynced: number;
  needRefresh: Array<{
    id: number;
    name: string;
    type: string;
    wecomExpiresAt: string | null;
    hoursUntilExpiry: number | null;
  }>;
  neverSynced: Array<{
    id: number;
    name: string;
    type: string;
    createdAt: string;
  }>;
}

// ==================== 类型映射 ====================

const typeMap: Record<string, { label: string; color: string; icon: any }> = {
  IMAGE: { label: '图片', color: 'blue', icon: FileImageOutlined },
  VIDEO: { label: '视频', color: 'purple', icon: VideoCameraOutlined },
  FILE: { label: '文件', color: 'orange', icon: FileOutlined },
};

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<MediaOverview | null>(null);
const storageAnalysis = ref<StorageAnalysis | null>(null);
const syncStatus = ref<SyncStatus | null>(null);

// ==================== 表格列定义 ====================

const largestMediaColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', key: 'type', width: 80 },
  { title: '大小', dataIndex: 'fileSizeFormatted', key: 'fileSize', width: 100 },
  { title: '创建时间', key: 'createdAt', width: 120 },
];

const creatorColumns = [
  { title: '创建者', key: 'creator' },
  { title: '素材数', dataIndex: 'mediaCount', key: 'mediaCount' },
  { title: '总存储', dataIndex: 'totalSizeFormatted', key: 'totalSize' },
];

const needRefreshColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', key: 'type', width: 80 },
  { title: '剩余时间', key: 'hoursUntilExpiry', width: 100 },
];

const neverSyncedColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', key: 'type', width: 80 },
  { title: '创建时间', key: 'createdAt', width: 120 },
];

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, storageRes, syncRes] = await Promise.all([
      requestClient.get<MediaOverview>('/crm/media/statistics/overview'),
      requestClient.get<StorageAnalysis>('/crm/media/statistics/storage-analysis'),
      requestClient.get<SyncStatus>('/crm/media/statistics/sync-status'),
    ]);
    overview.value = overviewRes;
    storageAnalysis.value = storageRes;
    syncStatus.value = syncRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/crm/media');
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
        <h2 class="m-0 text-xl font-bold">素材库统计</h2>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- 概览统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="4">
          <Card>
            <Statistic
              title="总素材数"
              :value="overview?.totalMedia || 0"
              :prefix="h(CloudOutlined)"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总存储"
              :value="overview?.totalSizeFormatted || '0 B'"
              :value-style="{ color: '#1890ff', fontSize: '20px' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="图片"
              :value="overview?.imageCount || 0"
              :prefix="h(FileImageOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="视频"
              :value="overview?.videoCount || 0"
              :prefix="h(VideoCameraOutlined)"
              :value-style="{ color: '#722ed1' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="文件"
              :value="overview?.fileCount || 0"
              :prefix="h(FileOutlined)"
              :value-style="{ color: '#fa8c16' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="本周新增"
              :value="overview?.newMediaThisWeek || 0"
              :prefix="h(PlusOutlined)"
              :value-style="{ color: '#13c2c2' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 同步状态警告 -->
      <div v-if="syncStatus && (syncStatus.expired > 0 || syncStatus.notSynced > 0)" class="mb-4">
        <Alert
          v-if="syncStatus.expired > 0"
          type="warning"
          show-icon
          :message="`有 ${syncStatus.expired} 个素材的企微同步已过期，需要重新同步后才能使用`"
          class="mb-2"
        />
        <Alert
          v-if="syncStatus.notSynced > 0"
          type="info"
          show-icon
          :message="`有 ${syncStatus.notSynced} 个素材尚未同步到企微`"
        />
      </div>

      <!-- 同步状态和类型分布 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="企微同步状态">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <CheckCircleOutlined class="text-green-500" />
                  已同步
                </span>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="syncStatus?.total ? Math.round((syncStatus.synced / syncStatus.total) * 100) : 0"
                    :show-info="false"
                    stroke-color="#52c41a"
                  />
                </div>
                <span>{{ syncStatus?.synced || 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <WarningOutlined class="text-yellow-500" />
                  已过期
                </span>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="syncStatus?.total ? Math.round((syncStatus.expired / syncStatus.total) * 100) : 0"
                    :show-info="false"
                    stroke-color="#faad14"
                  />
                </div>
                <span>{{ syncStatus?.expired || 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <SyncOutlined class="text-gray-400" />
                  未同步
                </span>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="syncStatus?.total ? Math.round((syncStatus.notSynced / syncStatus.total) * 100) : 0"
                    :show-info="false"
                    stroke-color="#d9d9d9"
                  />
                </div>
                <span>{{ syncStatus?.notSynced || 0 }}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="类型分布">
            <div v-if="overview?.byType?.length">
              <div
                v-for="item in overview.byType"
                :key="item.type"
                class="mb-3 flex items-center justify-between"
              >
                <Tag :color="typeMap[item.type]?.color || 'default'">
                  {{ typeMap[item.type]?.label || item.type }}
                </Tag>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                  />
                </div>
                <span class="text-gray-500">{{ item.count }} 个</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="存储分析">
            <div class="flex flex-col items-center justify-center" style="height: 140px">
              <div class="text-3xl font-bold text-blue-500">
                {{ storageAnalysis?.totalStorageFormatted || '0 B' }}
              </div>
              <div class="text-gray-500 mt-2">总存储空间</div>
              <div class="text-gray-400 mt-1">
                平均文件大小: {{ storageAnalysis?.avgFileSizeFormatted || '0 B' }}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 存储分布和文件大小分布 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="存储空间分布 (按类型)">
            <div v-if="storageAnalysis?.storageByType?.length">
              <div
                v-for="item in storageAnalysis.storageByType"
                :key="item.type"
                class="mb-3 flex items-center justify-between"
              >
                <Tag :color="typeMap[item.type]?.color || 'default'">
                  {{ typeMap[item.type]?.label || item.type }}
                </Tag>
                <div class="flex-1 mx-3">
                  <Progress
                    :percent="item.percentage"
                    :show-info="false"
                    :stroke-color="typeMap[item.type]?.color === 'blue' ? '#1890ff' : typeMap[item.type]?.color === 'purple' ? '#722ed1' : '#fa8c16'"
                  />
                </div>
                <span class="text-gray-500">{{ item.totalSizeFormatted }}</span>
              </div>
            </div>
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="文件大小分布">
            <div v-if="storageAnalysis?.sizeDistribution?.length">
              <div
                v-for="item in storageAnalysis.sizeDistribution"
                :key="item.range"
                class="mb-3 flex items-center justify-between"
              >
                <span class="text-gray-600 w-28">{{ item.range }}</span>
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

      <!-- 最大文件和创建者统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="14">
          <Card title="最大文件 TOP 10">
            <Table
              :columns="largestMediaColumns"
              :data-source="(overview?.largestMedia || []).map((item, index) => ({ ...item, key: index }))"
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
                <template v-if="column.key === 'type'">
                  <Tag :color="typeMap[record.type]?.color || 'default'">
                    {{ typeMap[record.type]?.label || record.type }}
                  </Tag>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="10">
          <Card title="创建者统计">
            <Table
              :columns="creatorColumns"
              :data-source="(storageAnalysis?.byCreator || []).slice(0, 8).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'creator'">
                  {{ record.creatorName || `用户${record.creatorId}` }}
                </template>
              </template>
            </Table>
            <Empty v-if="!storageAnalysis?.byCreator?.length" description="暂无数据" />
          </Card>
        </Col>
      </Row>

      <!-- 近7天趋势 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="24">
          <Card title="近7日上传趋势">
            <div v-if="overview?.dailyTrend?.length" class="flex items-end justify-around" style="height: 160px">
              <div
                v-for="(item, index) in overview.dailyTrend"
                :key="index"
                class="flex flex-col items-center"
              >
                <div class="mb-1 text-xs text-blue-500">{{ item.count }}</div>
                <div
                  class="w-12 rounded-t bg-blue-500"
                  :style="{ height: `${Math.max(10, (item.count / Math.max(...overview.dailyTrend.map(d => d.count), 1)) * 120)}px` }"
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

      <!-- 同步需关注的素材 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="即将过期 (24小时内)">
            <Table
              :columns="needRefreshColumns"
              :data-source="(syncStatus?.needRefresh || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag :color="typeMap[record.type]?.color || 'default'">
                    {{ typeMap[record.type]?.label || record.type }}
                  </Tag>
                </template>
                <template v-if="column.key === 'hoursUntilExpiry'">
                  <Tag color="warning">{{ record.hoursUntilExpiry }}小时</Tag>
                </template>
              </template>
            </Table>
            <Empty v-if="!syncStatus?.needRefresh?.length" description="没有即将过期的素材" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="从未同步">
            <Table
              :columns="neverSyncedColumns"
              :data-source="(syncStatus?.neverSynced || []).map((item, index) => ({ ...item, key: index }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag :color="typeMap[record.type]?.color || 'default'">
                    {{ typeMap[record.type]?.label || record.type }}
                  </Tag>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </Table>
            <Empty v-if="!syncStatus?.neverSynced?.length" description="所有素材都已同步" />
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MediaStatistics',
};
</script>
