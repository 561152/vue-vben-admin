<script setup lang="ts">
import { h, ref } from 'vue';

import { Button, DatePicker, message, Select, Space } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import {
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';

import { exportToExcel, type BiCrmApi } from '#/api/bi/crm';
import { generatePdf } from '#/api/print';

// ===================================
// Props 定义
// ===================================

interface Props {
  timeRange: BiCrmApi.TimeRange;
  customDateRange: [Dayjs, Dayjs] | null;
  loading: boolean;
  // 报表数据（用于打印）
  overviewData?: BiCrmApi.OverviewStats | null;
  followUpData?: BiCrmApi.FollowUpStats | null;
  funnelData?: BiCrmApi.SalesFunnel | null;
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: 'month',
  customDateRange: null,
  loading: false,
  overviewData: null,
  followUpData: null,
  funnelData: null,
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
// 打印PDF功能
// ===================================

const printing = ref(false);

async function handlePrint() {
  printing.value = true;
  try {
    // 构建报表数据
    const timeRangeMap: Record<BiCrmApi.TimeRange, string> = {
      today: '今日',
      week: '本周',
      month: '本月',
      quarter: '本季度',
      year: '本年',
      custom: '自定义',
    };

    const reportPeriod = timeRangeMap[props.timeRange] || '本月';
    const generatedAt = new Date().toLocaleString('zh-CN');

    // 准备打印数据
    const printData = {
      reportTitle: 'CRM分析报告',
      reportPeriod,
      generatedAt,
      overview: props.overviewData
        ? {
            totalCustomers: props.overviewData.totalCustomers,
            newCustomers: props.overviewData.newCustomers,
            activeCustomers: props.overviewData.activeCustomers,
            conversionRate: props.overviewData.conversionRate,
          }
        : null,
      customerSources: [], // 可以从其他数据源获取
      salesFunnel: props.funnelData?.stages?.map((stage) => ({
        stage: stage.stage,
        count: stage.count,
        percentage: stage.percentage,
      })),
      performanceRanking: props.followUpData?.byUser?.slice(0, 5).map((user) => ({
        name: user.userName,
        deals: user.count,
        revenue: 0, // 如有收入数据可补充
      })),
    };

    await generatePdf({
      templateCode: 'BI_CRM_REPORT',
      data: printData,
      fileName: `CRM分析报告-${reportPeriod}-${new Date().toISOString().split('T')[0]}`,
    });

    message.success('PDF报告生成成功！');
  } catch (error: any) {
    message.error(`生成PDF失败: ${error.message || '未知错误'}`);
    console.error('Print error:', error);
  } finally {
    printing.value = false;
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
  <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
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
        :icon="h(PrinterOutlined)"
        :loading="printing"
        @click="handlePrint"
      >
        打印 PDF
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
