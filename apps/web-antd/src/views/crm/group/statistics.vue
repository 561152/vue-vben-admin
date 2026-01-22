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
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  ClusterOutlined,
  RiseOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

const router = useRouter();

// ==================== 类型定义 ====================

interface GroupOverview {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  avgMembersPerGroup: number;
  emptyGroups: number;
  newGroupsToday: number;
  newGroupsWeek: number;
  newMembersToday: number;
  newMembersWeek: number;
  topGroups: Array<{
    groupId: number;
    groupName: string;
    memberCount: number;
    owner: string | null;
  }>;
  memberDistribution: Array<{
    range: string;
    count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    newGroups: number;
    newMembers: number;
  }>;
}

interface MemberAnalysis {
  byMemberType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topActiveGroups: Array<{
    groupId: number;
    groupName: string;
    recentJoins: number;
    totalMembers: number;
  }>;
  memberGrowthTrend: Array<{
    date: string;
    joins: number;
    leaves: number;
    netGrowth: number;
  }>;
}

interface EmptyGroup {
  id: number;
  name: string;
  owner: string | null;
  createdAt: string;
}

// ==================== 状态 ====================

const loading = ref(false);
const overview = ref<GroupOverview | null>(null);
const memberAnalysis = ref<MemberAnalysis | null>(null);
const emptyGroups = ref<EmptyGroup[]>([]);

// ==================== 成员类型映射 ====================

const memberTypeMap: Record<string, string> = {
  CUSTOMER: '客户',
  EMPLOYEE: '员工',
  EXTERNAL: '外部联系人',
};

// ==================== 表格列定义 ====================

const topGroupColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '群名称', dataIndex: 'groupName', key: 'groupName' },
  { title: '成员数', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
  { title: '群主', dataIndex: 'owner', key: 'owner', width: 120 },
];

const distributionColumns = [
  { title: '成员规模', dataIndex: 'range', key: 'range' },
  { title: '群数量', dataIndex: 'count', key: 'count' },
];

const memberTypeColumns = [
  { title: '成员类型', key: 'type' },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', key: 'percentage' },
];

const activeGroupColumns = [
  { title: '群名称', dataIndex: 'groupName', key: 'groupName' },
  { title: '近期新增', dataIndex: 'recentJoins', key: 'recentJoins' },
  { title: '总成员', dataIndex: 'totalMembers', key: 'totalMembers' },
];

const emptyGroupColumns = [
  { title: '群名称', dataIndex: 'name', key: 'name' },
  { title: '群主', dataIndex: 'owner', key: 'owner' },
  { title: '创建时间', key: 'createdAt' },
];

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    const [overviewRes, analysisRes, emptyRes] = await Promise.all([
      requestClient.get<GroupOverview>('/groups/statistics/overview'),
      requestClient.get<MemberAnalysis>('/groups/statistics/member-analysis'),
      requestClient.get<EmptyGroup[]>('/groups/statistics/empty'),
    ]);
    overview.value = overviewRes;
    memberAnalysis.value = analysisRes;
    emptyGroups.value = emptyRes;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/crm/group');
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
        <h2 class="m-0 text-xl font-bold">客户分组统计</h2>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- 概览统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="4">
          <Card>
            <Statistic
              title="总分组数"
              :value="overview?.totalGroups || 0"
              :prefix="h(ClusterOutlined)"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="活跃分组"
              :value="overview?.activeGroups || 0"
              :prefix="h(TeamOutlined)"
              :value-style="{ color: '#52c41a' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="空分组"
              :value="overview?.emptyGroups || 0"
              :value-style="{ color: '#ff4d4f' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="总成员数"
              :value="overview?.totalMembers || 0"
              :prefix="h(UserOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="本周新增分组"
              :value="overview?.newGroupsWeek || 0"
              :prefix="h(PlusOutlined)"
              :value-style="{ color: '#722ed1' }"
            />
          </Card>
        </Col>
        <Col :span="4">
          <Card>
            <Statistic
              title="本周新增成员"
              :value="overview?.newMembersWeek || 0"
              :prefix="h(RiseOutlined)"
              :value-style="{ color: '#13c2c2' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 平均成员数和今日数据 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="分组规模">
            <div
              class="flex flex-col items-center justify-center"
              style="height: 140px"
            >
              <div class="text-4xl font-bold text-blue-500">
                {{ overview?.avgMembersPerGroup || 0 }}
              </div>
              <div class="mt-2 text-gray-500">平均每组成员数</div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="今日数据">
            <div class="flex items-center justify-around" style="height: 140px">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-500">
                  {{ overview?.newGroupsToday || 0 }}
                </div>
                <div class="text-gray-500">新建分组</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-cyan-500">
                  {{ overview?.newMembersToday || 0 }}
                </div>
                <div class="text-gray-500">新增成员</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="成员规模分布">
            <Table
              :columns="distributionColumns"
              :data-source="
                (overview?.memberDistribution || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
              :pagination="false"
              size="small"
              :scroll="{ y: 120 }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 热门分组排行 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="成员最多分组 TOP10">
            <Table
              :columns="topGroupColumns"
              :data-source="
                (overview?.topGroups || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, index }">
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
              </template>
            </Table>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="近7日趋势">
            <div
              v-if="overview?.dailyTrend?.length"
              class="flex items-end justify-around"
              style="height: 240px"
            >
              <div
                v-for="(item, index) in overview.dailyTrend"
                :key="index"
                class="flex flex-col items-center"
              >
                <div class="mb-1 text-xs text-blue-500">
                  {{ item.newMembers }}
                </div>
                <div
                  class="w-8 rounded-t bg-blue-500"
                  :style="{
                    height: `${Math.max(10, (item.newMembers / Math.max(...overview.dailyTrend.map((d) => d.newMembers), 1)) * 140)}px`,
                  }"
                />
                <div
                  class="w-8 bg-purple-500"
                  :style="{
                    height: `${Math.max(5, (item.newGroups / Math.max(...overview.dailyTrend.map((d) => d.newGroups), 1)) * 40)}px`,
                  }"
                />
                <div class="mt-2 text-xs text-gray-400">
                  {{ item.date.slice(5) }}
                </div>
              </div>
            </div>
            <div class="mt-2 flex justify-center gap-4 text-xs">
              <span
                ><span
                  class="mr-1 inline-block h-2 w-2 rounded bg-blue-500"
                ></span
                >新增成员</span
              >
              <span
                ><span
                  class="mr-1 inline-block h-2 w-2 rounded bg-purple-500"
                ></span
                >新建分组</span
              >
            </div>
            <Empty
              v-if="!overview?.dailyTrend?.length"
              description="暂无数据"
            />
          </Card>
        </Col>
      </Row>

      <!-- 成员分析 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card title="成员类型分布">
            <Table
              :columns="memberTypeColumns"
              :data-source="
                (memberAnalysis?.byMemberType || []).map((item, index) => ({
                  ...item,
                  key: index,
                }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag
                    :color="
                      record.type === 'CUSTOMER'
                        ? 'blue'
                        : record.type === 'EMPLOYEE'
                          ? 'green'
                          : 'orange'
                    "
                  >
                    {{ memberTypeMap[record.type] || record.type }}
                  </Tag>
                </template>
                <template v-if="column.key === 'percentage'">
                  <Progress
                    :percent="record.percentage"
                    :size="60"
                    :stroke-color="
                      record.percentage >= 50 ? '#52c41a' : '#1890ff'
                    "
                  />
                </template>
              </template>
            </Table>
            <Empty
              v-if="!memberAnalysis?.byMemberType?.length"
              description="暂无数据"
            />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="最近活跃分组 (本周)">
            <Table
              :columns="activeGroupColumns"
              :data-source="
                (memberAnalysis?.topActiveGroups || [])
                  .slice(0, 5)
                  .map((item, index) => ({ ...item, key: index }))
              "
              :pagination="false"
              size="small"
            />
            <Empty
              v-if="!memberAnalysis?.topActiveGroups?.length"
              description="暂无数据"
            />
          </Card>
        </Col>
        <Col :span="8">
          <Card title="空分组列表">
            <Table
              :columns="emptyGroupColumns"
              :data-source="
                emptyGroups
                  .slice(0, 5)
                  .map((item, index) => ({ ...item, key: index }))
              "
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </Table>
            <Empty v-if="!emptyGroups.length" description="没有空分组" />
          </Card>
        </Col>
      </Row>

      <!-- 成员增长趋势 -->
      <Card title="成员增长趋势 (近7日)">
        <div v-if="memberAnalysis?.memberGrowthTrend?.length">
          <Table
            :columns="[
              { title: '日期', dataIndex: 'date', key: 'date' },
              { title: '新增', dataIndex: 'joins', key: 'joins' },
              { title: '退出', dataIndex: 'leaves', key: 'leaves' },
              { title: '净增长', key: 'netGrowth' },
            ]"
            :data-source="
              memberAnalysis.memberGrowthTrend.map((item, index) => ({
                ...item,
                key: index,
              }))
            "
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'netGrowth'">
                <span
                  :class="
                    record.netGrowth >= 0 ? 'text-green-500' : 'text-red-500'
                  "
                >
                  {{ record.netGrowth >= 0 ? '+' : '' }}{{ record.netGrowth }}
                </span>
              </template>
            </template>
          </Table>
        </div>
        <Empty v-else description="暂无数据" />
      </Card>
    </Spin>
  </div>
</template>

<script lang="ts">
export default {
  name: 'GroupStatistics',
};
</script>
