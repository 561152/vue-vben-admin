<script setup lang="ts">
import { Card, Col, Row, Skeleton, Statistic } from 'ant-design-vue';
import {
  FireOutlined,
  LineChartOutlined,
  PercentageOutlined,
  TagsOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons-vue';

import type { StatisticsApi } from '#/api/crm/statistics';

// ===================================
// Props 定义
// ===================================

interface Props {
  data: StatisticsApi.OverviewStats | null;
  loading: boolean;
}

withDefaults(defineProps<Props>(), {
  data: null,
  loading: false,
});

// ===================================
// 卡片配置
// ===================================

const cardConfigs = [
  {
    title: '总客户数',
    dataKey: 'totalCustomers' as keyof StatisticsApi.OverviewStats,
    icon: TeamOutlined,
    color: '#1890ff',
    precision: 0,
  },
  {
    title: '新增客户',
    dataKey: 'newCustomers' as keyof StatisticsApi.OverviewStats,
    icon: UserAddOutlined,
    color: '#52c41a',
    precision: 0,
  },
  {
    title: '活跃客户',
    dataKey: 'activeCustomers' as keyof StatisticsApi.OverviewStats,
    icon: FireOutlined,
    color: '#fa8c16',
    precision: 0,
  },
  {
    title: '转化率',
    dataKey: 'conversionRate' as keyof StatisticsApi.OverviewStats,
    icon: PercentageOutlined,
    color: '#13c2c2',
    precision: 2,
    suffix: '%',
  },
  {
    title: '跟进记录数',
    dataKey: 'totalFollowUps' as keyof StatisticsApi.OverviewStats,
    icon: LineChartOutlined,
    color: '#722ed1',
    precision: 0,
  },
  {
    title: '人均跟进次数',
    dataKey: 'averageFollowUpPerCustomer' as keyof StatisticsApi.OverviewStats,
    icon: UserSwitchOutlined,
    color: '#eb2f96',
    precision: 2,
  },
  {
    title: '已打标签客户',
    dataKey: 'taggedCustomers' as keyof StatisticsApi.OverviewStats,
    icon: TagsOutlined,
    color: '#faad14',
    precision: 0,
  },
  {
    title: '已分组客户',
    dataKey: 'groupedCustomers' as keyof StatisticsApi.OverviewStats,
    icon: UsergroupAddOutlined,
    color: '#2f54eb',
    precision: 0,
  },
];
</script>

<template>
  <div>
    <Row :gutter="16" class="mb-4">
      <Col
        v-for="config in cardConfigs"
        :key="config.dataKey"
        :xs="24"
        :sm="12"
        :lg="6"
        class="mb-4"
      >
        <Card :bordered="false">
          <Skeleton v-if="loading" active :paragraph="{ rows: 1 }" />
          <Statistic
            v-else
            :value="data?.[config.dataKey] || 0"
            :title="config.title"
            :precision="config.precision"
            :suffix="config.suffix"
          >
            <template #prefix>
              <component :is="config.icon" :style="{ color: config.color }" />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>
  </div>
</template>
