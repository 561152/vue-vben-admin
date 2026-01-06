<script setup lang="ts">
import { h, ref } from 'vue';

import { Button, DatePicker, message, Select, Space } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue';

import { exportToExcel, type BiCrmApi } from '#/api/bi/crm';

// ===================================
// Props 定义
// ===================================

interface Props {
  timeRange: BiCrmApi.TimeRange;
  customDateRange: [Dayjs, Dayjs] | null;
  loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: 'month',
  customDateRange: null,
  loading: false,
});

// ===================================
// Emits 定义
// ===================================

interface Emits {
  (e: 'update:timeRange', value: BiCrmApi.TimeRange): void;
  (e: 'update:customDateRange', value: [Dayjs, Dayjs] | null): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

// ===================================
// 导出功能
// ===================================

const exporting = ref(false);

async function handleExport() {
  exporting.value = true;
  try {
    const params: BiCrmApi.TimeRangeParams = {
      timeRange: props.timeRange,
    };

    // 自定义日期范围
    if (props.timeRange === 'custom' && props.customDateRange) {
      params.startDate = props.customDateRange[0].format('YYYY-MM-DD');
      params.endDate = props.customDateRange[1].format('YYYY-MM-DD');
    }

    await exportToExcel(params);
    message.success('导出成功！');
  } catch (error: any) {
    message.error(`导出失败: ${error.message || '未知错误'}`);
    console.error('Export error:', error);
  } finally {
    exporting.value = false;
  }
}

// ===================================
// 数据
// ===================================

// 时间范围选项
const timeRangeOptions = [
  { label: '今天', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' },
  { label: '自定义', value: 'custom' },
];
</script>

<template>
  <div class="mb-5 flex justify-between items-center flex-wrap gap-3">
    <h2 class="text-2xl font-bold">数据统计分析</h2>

    <Space size="middle">
      <span class="text-gray-500">时间范围:</span>

      <Select
        :value="timeRange"
        :options="timeRangeOptions"
        @change="emit('update:timeRange', $event)"
        style="width: 140px"
      />

      <DatePicker.RangePicker
        v-if="timeRange === 'custom'"
        :value="customDateRange"
        @change="emit('update:customDateRange', $event)"
        format="YYYY-MM-DD"
        :placeholder="['开始日期', '结束日期']"
      />

      <Button
        :icon="h(DownloadOutlined)"
        :loading="exporting"
        @click="handleExport"
      >
        导出 Excel
      </Button>

      <Button
        type="primary"
        :icon="h(ReloadOutlined)"
        :loading="loading"
        @click="emit('refresh')"
      >
        刷新
      </Button>
    </Space>
  </div>
</template>
