<script setup lang="ts">
import { ref, watch } from 'vue';

import { Empty } from 'ant-design-vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { StatisticsApi } from '#/api/crm/statistics';

// ===================================
// Props 定义
// ===================================

interface Props {
  data: StatisticsApi.CustomerTrendItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
});

// ===================================
// 图表渲染
// ===================================

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/**
 * 渲染客户趋势折线图
 */
function renderChart() {
  if (!props.data || props.data.length === 0) {
    return;
  }

  // 提取数据
  const dates = props.data.map((item) => item.date.substring(5)); // MM-DD
  const totalData = props.data.map((item) => item.total);
  const newData = props.data.map((item) => item.new);
  const activeData = props.data.map((item) => item.active);

  // 渲染图表
  renderEcharts({
    grid: {
      bottom: '10%',
      containLabel: true,
      left: '3%',
      right: '4%',
      top: '15%',
    },
    legend: {
      data: ['总客户数', '新增客户', '活跃客户'],
      top: '5%',
    },
    series: [
      {
        data: totalData,
        itemStyle: { color: '#5470c6' },
        name: '总客户数',
        smooth: true,
        type: 'line',
      },
      {
        data: newData,
        itemStyle: { color: '#91cc75' },
        name: '新增客户',
        smooth: true,
        type: 'line',
      },
      {
        data: activeData,
        itemStyle: { color: '#fac858' },
        name: '活跃客户',
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: { type: 'cross' },
      trigger: 'axis',
    },
    xAxis: {
      boundaryGap: false,
      data: dates,
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
  });
}

// 监听数据变化重新渲染
watch(() => props.data, renderChart, { immediate: true });
</script>

<template>
  <div>
    <EchartsUI v-if="data && data.length > 0" ref="chartRef" class="h-80" />
    <Empty
      v-else
      description="暂无数据"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      class="py-20"
    />
  </div>
</template>
