<script lang="ts" setup>
import { Row, Col, Card, Table, Tag, Empty } from 'ant-design-vue';
import {
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  ClusterOutlined,
  RiseOutlined,
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
  type TrendItem,
} from '#/components/statistics';
import { useStatistics, formatDate } from '#/hooks/useStatistics';

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

// ==================== 数据加载 ====================

interface GroupStats {
  overview: GroupOverview;
  memberAnalysis: MemberAnalysis;
  emptyGroups: EmptyGroup[];
}

const { loading, data } = useStatistics<GroupStats>({
  overview: '/groups/statistics/overview',
  memberAnalysis: '/groups/statistics/member-analysis',
  emptyGroups: '/groups/statistics/empty',
});

// ==================== 映射 ====================

const memberTypeMap: Record<string, string> = {
  CUSTOMER: '客户',
  EMPLOYEE: '员工',
  EXTERNAL: '外部联系人',
};

const memberTypeColorMap: Record<string, string> = {
  CUSTOMER: 'blue',
  EMPLOYEE: 'green',
  EXTERNAL: 'orange',
};

// ==================== 统计卡片配置 ====================

const overviewCards = computed<StatisticItem[]>(() => [
  {
    title: '总分组数',
    value: data.overview.value?.totalGroups || 0,
    prefixIcon: ClusterOutlined,
  },
  {
    title: '活跃分组',
    value: data.overview.value?.activeGroups || 0,
    prefixIcon: TeamOutlined,
    valueColor: '#52c41a',
  },
  {
    title: '空分组',
    value: data.overview.value?.emptyGroups || 0,
    valueColor: '#ff4d4f',
  },
  {
    title: '总成员数',
    value: data.overview.value?.totalMembers || 0,
    prefixIcon: UserOutlined,
    valueColor: '#1890ff',
  },
  {
    title: '本周新增分组',
    value: data.overview.value?.newGroupsWeek || 0,
    prefixIcon: PlusOutlined,
    valueColor: '#722ed1',
  },
  {
    title: '本周新增成员',
    value: data.overview.value?.newMembersWeek || 0,
    prefixIcon: RiseOutlined,
    valueColor: '#13c2c2',
  },
]);

// ==================== 表格列配置 ====================

const topGroupColumns: RankingColumn[] = [
  { title: '排名', key: 'rank', width: 60, isRank: true },
  { title: '群名称', dataIndex: 'groupName', key: 'groupName' },
  { title: '成员数', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
  { title: '群主', dataIndex: 'owner', key: 'owner', width: 120 },
];

const distributionColumns: DistributionColumn[] = [
  { title: '成员规模', dataIndex: 'range', key: 'range' },
  { title: '群数量', dataIndex: 'count', key: 'count' },
];

const memberTypeColumns: DistributionColumn[] = [
  { title: '成员类型', key: 'type', dataIndex: 'type', valueMap: memberTypeMap, isTag: true },
  { title: '数量', dataIndex: 'count', key: 'count' },
  { title: '占比', key: 'percentage', dataIndex: 'percentage', showProgress: true },
];

const activeGroupColumns: DistributionColumn[] = [
  { title: '群名称', dataIndex: 'groupName', key: 'groupName' },
  { title: '近期新增', dataIndex: 'recentJoins', key: 'recentJoins' },
  { title: '总成员', dataIndex: 'totalMembers', key: 'totalMembers' },
];

// ==================== 趋势数据 ====================

const trendData = computed<TrendItem[]>(() =>
  (data.overview.value?.dailyTrend || []).map((item) => ({
    date: item.date,
    value: item.newMembers,
    value2: item.newGroups,
  })),
);
</script>

<script lang="ts">
import { computed } from 'vue';

export default {
  name: 'GroupStatistics',
};
</script>

<template>
  <StatisticsPageLayout title="客户分组统计" back-path="/crm/group" :loading="loading">
    <!-- 概览统计卡片 -->
    <StatisticCardRow :items="overviewCards" />

    <!-- 平均成员数和今日数据 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card title="分组规模">
          <div class="flex flex-col items-center justify-center" style="height: 140px">
            <div class="text-4xl font-bold text-blue-500">
              {{ data.overview.value?.avgMembersPerGroup || 0 }}
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
                {{ data.overview.value?.newGroupsToday || 0 }}
              </div>
              <div class="text-gray-500">新建分组</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-cyan-500">
                {{ data.overview.value?.newMembersToday || 0 }}
              </div>
              <div class="text-gray-500">新增成员</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col :span="8">
        <DistributionTable
          title="成员规模分布"
          :data-source="data.overview.value?.memberDistribution || []"
          :columns="distributionColumns"
          :scroll-y="120"
        />
      </Col>
    </Row>

    <!-- 热门分组排行和趋势 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <RankingTable
          title="成员最多分组 TOP10"
          :data-source="data.overview.value?.topGroups || []"
          :columns="topGroupColumns"
        />
      </Col>
      <Col :span="12">
        <TrendBarChart
          title="近7日趋势"
          :data="trendData"
          label="新增成员"
          label2="新建分组"
          color="#3b82f6"
          color2="#a855f7"
        />
      </Col>
    </Row>

    <!-- 成员分析 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card title="成员类型分布">
          <Table
            :columns="[
              { title: '成员类型', key: 'type' },
              { title: '数量', dataIndex: 'count', key: 'count' },
              { title: '占比', key: 'percentage' },
            ]"
            :data-source="
              (data.memberAnalysis.value?.byMemberType || []).map((item, index) => ({
                ...item,
                key: index,
              }))
            "
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <Tag :color="memberTypeColorMap[record.type] || 'default'">
                  {{ memberTypeMap[record.type] || record.type }}
                </Tag>
              </template>
              <template v-if="column.key === 'percentage'">
                {{ record.percentage }}%
              </template>
            </template>
          </Table>
          <Empty
            v-if="!data.memberAnalysis.value?.byMemberType?.length"
            description="暂无数据"
          />
        </Card>
      </Col>
      <Col :span="8">
        <DistributionTable
          title="最近活跃分组 (本周)"
          :data-source="(data.memberAnalysis.value?.topActiveGroups || []).slice(0, 5)"
          :columns="activeGroupColumns"
        />
      </Col>
      <Col :span="8">
        <Card title="空分组列表">
          <Table
            :columns="[
              { title: '群名称', dataIndex: 'name', key: 'name' },
              { title: '群主', dataIndex: 'owner', key: 'owner' },
              { title: '创建时间', key: 'createdAt' },
            ]"
            :data-source="
              (data.emptyGroups.value || [])
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
          <Empty v-if="!data.emptyGroups.value?.length" description="没有空分组" />
        </Card>
      </Col>
    </Row>

    <!-- 成员增长趋势 -->
    <Card title="成员增长趋势 (近7日)">
      <div v-if="data.memberAnalysis.value?.memberGrowthTrend?.length">
        <Table
          :columns="[
            { title: '日期', dataIndex: 'date', key: 'date' },
            { title: '新增', dataIndex: 'joins', key: 'joins' },
            { title: '退出', dataIndex: 'leaves', key: 'leaves' },
            { title: '净增长', key: 'netGrowth' },
          ]"
          :data-source="
            data.memberAnalysis.value.memberGrowthTrend.map((item, index) => ({
              ...item,
              key: index,
            }))
          "
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'netGrowth'">
              <span :class="record.netGrowth >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ record.netGrowth >= 0 ? '+' : '' }}{{ record.netGrowth }}
              </span>
            </template>
          </template>
        </Table>
      </div>
      <Empty v-else description="暂无数据" />
    </Card>
  </StatisticsPageLayout>
</template>
