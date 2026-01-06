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
  data: StatisticsApi.SalesFunnel | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  loading: false,
});

// ===================================
// 生命周期阶段映射
// ===================================

const lifecycleStageMap: Record<string, string> = {
  CUSTOMER: '客户',
  EVANGELIST: '忠实客户',
  LEAD: '线索',
  MQL: '营销合格线索',
  OPPORTUNITY: '商机',
  SQL: '销售合格线索',
  SUBSCRIBER: '订阅者',
};

// ===================================
// 图表渲染
// ===================================

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/**
 * 渲染销售漏斗图
 */
function renderChart() {
  if (!props.data?.stages || props.data.stages.length === 0) {
    return;
  }

  // 转换数据
  const chartData = props.data.stages.map((item) => ({
    name: lifecycleStageMap[item.stage] || item.stage,
    value: item.count,
  }));

  // 渲染图表
  renderEcharts({
    series: [
      {
        data: chartData,
        emphasis: {
          label: {
            fontSize: 16,
          },
        },
        gap: 2,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          formatter: '{b}: {c}',
          position: 'inside',
          show: true,
        },
        sort: 'descending',
        type: 'funnel',
      },
    ],
    tooltip: {
      formatter: (params: any) => {
        const stage = props.data!.stages[params.dataIndex];
        let tooltip = `${params.name}<br/>`;
        tooltip += `数量: ${params.value}<br/>`;
        tooltip += `占比: ${stage.percentage.toFixed(2)}%`;
        if (stage.conversionRate !== undefined) {
          tooltip += `<br/>转化率: ${stage.conversionRate.toFixed(2)}%`;
        }
        return tooltip;
      },
      trigger: 'item',
    },
  });
}

// 监听数据变化重新渲染
watch(() => props.data, renderChart, { deep: true, immediate: true });
</script>

<template>
  <div>
    <EchartsUI
      v-if="data?.stages && data.stages.length > 0"
      ref="chartRef"
      class="h-80"
    />
    <Empty
      v-else
      description="暂无数据"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      class="py-20"
    />
  </div>
</template>
