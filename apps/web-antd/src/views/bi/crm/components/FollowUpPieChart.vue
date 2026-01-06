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
  data: StatisticsApi.FollowUpStats | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  loading: false,
});

// ===================================
// 跟进类型映射
// ===================================

const followUpTypeMap: Record<string, string> = {
  CALL: '电话',
  EMAIL: '邮件',
  MESSAGE: '短信',
  MEETING: '会议',
  OTHER: '其他',
  VISIT: '拜访',
  WECHAT: '微信',
};

// ===================================
// 图表渲染
// ===================================

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/**
 * 渲染跟进类型分布饼图
 */
function renderChart() {
  if (!props.data?.byType || props.data.byType.length === 0) {
    return;
  }

  // 转换数据
  const chartData = props.data.byType.map((item) => ({
    name: followUpTypeMap[item.type] || item.type,
    value: item.count,
  }));

  // 渲染图表
  renderEcharts({
    legend: {
      left: 'left',
      orient: 'vertical',
    },
    series: [
      {
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowOffsetX: 0,
          },
        },
        radius: ['40%', '70%'], // 环形图
        type: 'pie',
      },
    ],
    tooltip: {
      formatter: '{b}: {c} ({d}%)',
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
      v-if="data?.byType && data.byType.length > 0"
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
