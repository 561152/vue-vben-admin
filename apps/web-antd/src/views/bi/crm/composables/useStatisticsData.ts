import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import {
  getCustomerTrend,
  getFollowUpStats,
  getOverviewStats,
  getSalesFunnel,
  type BiCrmApi,
} from '#/api/bi/crm';

/**
 * 统计数据管理 Composable
 * 负责数据获取、状态管理和参数处理
 */
export function useStatisticsData() {
  // ===================================
  // 响应式状态
  // ===================================

  // 加载状态
  const loading = ref(false);

  // 时间范围选择
  const timeRange = ref<BiCrmApi.TimeRange>('month');

  // 自定义日期范围
  const customDateRange = ref<[Dayjs, Dayjs] | null>(null);

  // 概览统计数据
  const overviewData = ref<BiCrmApi.OverviewStats | null>(null);

  // 客户趋势数据
  const trendData = ref<BiCrmApi.CustomerTrendItem[]>([]);

  // 跟进统计数据
  const followUpData = ref<BiCrmApi.FollowUpStats | null>(null);

  // 销售漏斗数据
  const funnelData = ref<BiCrmApi.SalesFunnel | null>(null);

  // ===================================
  // 计算属性
  // ===================================

  /**
   * 计算 API 请求参数
   * 根据时间范围类型自动添加自定义日期参数
   */
  const requestParams = computed<BiCrmApi.TimeRangeParams>(() => {
    const params: BiCrmApi.TimeRangeParams = {
      timeRange: timeRange.value,
    };

    // 如果是自定义范围，添加开始和结束日期
    if (timeRange.value === 'custom' && customDateRange.value) {
      params.startDate = customDateRange.value[0].format('YYYY-MM-DD');
      params.endDate = customDateRange.value[1].format('YYYY-MM-DD');
    }

    return params;
  });

  // ===================================
  // 方法
  // ===================================

  /**
   * 加载所有统计数据
   * 使用 Promise.all 并发请求以提升性能
   */
  async function loadAllData() {
    loading.value = true;

    try {
      // 并发请求所有数据
      const [overview, trend, followUp, funnel] = await Promise.all([
        getOverviewStats(requestParams.value),
        getCustomerTrend(requestParams.value),
        getFollowUpStats(requestParams.value),
        getSalesFunnel(requestParams.value),
      ]);

      // 更新数据
      overviewData.value = overview;
      trendData.value = trend;
      followUpData.value = followUp;
      funnelData.value = funnel;
    } catch (error: any) {
      // 错误处理
      message.error(`加载统计数据失败: ${error.message || '未知错误'}`);
      console.error('Statistics load error:', error);

      // 清空数据
      overviewData.value = null;
      trendData.value = [];
      followUpData.value = null;
      funnelData.value = null;
    } finally {
      loading.value = false;
    }
  }

  // ===================================
  // 导出
  // ===================================

  return {
    // 状态
    loading,
    timeRange,
    customDateRange,
    overviewData,
    trendData,
    followUpData,
    funnelData,
    requestParams,

    // 方法
    loadAllData,
  };
}
