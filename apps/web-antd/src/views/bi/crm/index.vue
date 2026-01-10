<script setup lang="ts">
import { onMounted, watch } from 'vue';

import { Card, Col, Row } from 'ant-design-vue';

import { useStatisticsData } from './composables/useStatisticsData';

// 导入子组件
import CustomerTrendChart from './components/CustomerTrendChart.vue';
import FollowUpPieChart from './components/FollowUpPieChart.vue';
import FollowUpRanking from './components/FollowUpRanking.vue';
import OverviewCards from './components/OverviewCards.vue';
import SalesFunnelChart from './components/SalesFunnelChart.vue';
import StatisticsHeader from './components/StatisticsHeader.vue';

// ===================================
// 使用 Composable
// ===================================

const {
  loading,
  timeRange,
  customDateRange,
  overviewData,
  trendData,
  followUpData,
  funnelData,
  loadAllData,
} = useStatisticsData();

// ===================================
// 生命周期和监听
// ===================================

// 监听时间范围变化，自动重新加载数据
watch([timeRange, customDateRange], () => {
  // 如果是自定义范围但尚未选择日期，则等待用户选择
  if (timeRange.value === 'custom' && !customDateRange.value) {
    return;
  }

  // 重新加载数据
  loadAllData();
});

// 组件挂载时加载数据
onMounted(() => {
  loadAllData();
});
</script>

<template>
  <div class="p-5">
    <!-- 页面头部：时间选择器 + 刷新按钮 -->
    <StatisticsHeader
      v-model:timeRange="timeRange"
      v-model:customDateRange="customDateRange"
      :loading="loading"
      :overview-data="overviewData"
      :follow-up-data="followUpData"
      :funnel-data="funnelData"
      @refresh="loadAllData"
    />

    <!-- 第一部分：概览统计卡片（8个指标） -->
    <OverviewCards :data="overviewData" :loading="loading" />

    <!-- 第二部分：客户趋势分析 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="24">
        <Card title="客户趋势分析" :bordered="false">
          <CustomerTrendChart :data="trendData" :loading="loading" />
        </Card>
      </Col>
    </Row>

    <!-- 第三部分：跟进统计 + 销售漏斗 -->
    <Row :gutter="16">
      <Col :xs="24" :lg="8">
        <Card title="跟进类型分布" :bordered="false" class="mb-4">
          <FollowUpPieChart :data="followUpData" :loading="loading" />
        </Card>
      </Col>
      <Col :xs="24" :lg="8">
        <Card title="跟进人员排行榜" :bordered="false" class="mb-4">
          <FollowUpRanking :data="followUpData" />
        </Card>
      </Col>
      <Col :xs="24" :lg="8">
        <Card title="销售漏斗" :bordered="false" class="mb-4">
          <SalesFunnelChart :data="funnelData" :loading="loading" />
        </Card>
      </Col>
    </Row>
  </div>
</template>
