import { requestClient } from '#/api/request';
import { useAccessStore } from '@vben/stores';

// ===================================
// TypeScript 类型定义
// ===================================

export namespace BiCrmApi {
  // 时间范围类型
  export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

  // 请求参数接口
  export interface TimeRangeParams {
    timeRange: TimeRange;
    startDate?: string; // 自定义范围开始日期 (YYYY-MM-DD)
    endDate?: string;   // 自定义范围结束日期 (YYYY-MM-DD)
  }

  // 客户概览统计接口
  export interface OverviewStats {
    totalCustomers: number;              // 总客户数
    newCustomers: number;                // 新增客户数
    activeCustomers: number;             // 活跃客户数
    conversionRate: number;              // 转化率
    totalFollowUps: number;              // 总跟进次数
    averageFollowUpPerCustomer: number;  // 平均每客户跟进次数
    taggedCustomers: number;             // 有标签的客户数
    groupedCustomers: number;            // 在分组中的客户数
  }

  // 客户趋势数据项接口
  export interface CustomerTrendItem {
    date: string;   // 日期 (YYYY-MM-DD)
    total: number;  // 累计总数
    new: number;    // 当日新增
    active: number; // 当日活跃
  }

  // 跟进类型统计项接口
  export interface FollowUpTypeItem {
    type: string;       // 跟进类型
    count: number;      // 数量
    percentage: number; // 百分比
  }

  // 跟进用户统计项接口
  export interface FollowUpUserItem {
    userId: string;   // 用户ID
    userName: string; // 用户名称
    count: number;    // 跟进数量
  }

  // 跟进统计数据接口
  export interface FollowUpStats {
    totalFollowUps: number;                               // 总跟进数
    byType: FollowUpTypeItem[];                           // 按类型分布
    byUser: FollowUpUserItem[];                           // 按用户分布
    averagePerCustomer: number;                           // 平均每客户跟进数
    recentActivity: Array<{ date: string; count: number }>; // 最近活动趋势
  }

  // 漏斗阶段数据项接口
  export interface FunnelStageItem {
    stage: string;           // 阶段名称
    count: number;           // 数量
    percentage: number;      // 百分比
    conversionRate?: number; // 转化率（可选，第一阶段无转化率）
  }

  // 销售漏斗数据接口
  export interface SalesFunnel {
    stages: FunnelStageItem[];    // 各阶段数据
    totalLeads: number;           // 总线索数
    totalCustomers: number;       // 总客户数
    overallConversionRate: number; // 总体转化率
  }
}

// ===================================
// API 函数
// ===================================

/**
 * 获取客户概览统计
 * @param params 时间范围参数
 * @returns 概览统计数据
 */
export async function getOverviewStats(params: BiCrmApi.TimeRangeParams) {
  return requestClient.get<BiCrmApi.OverviewStats>('/bi/crm/overview', {
    params,
  });
}

/**
 * 获取客户趋势分析数据
 * @param params 时间范围参数
 * @returns 每日趋势数据数组
 */
export async function getCustomerTrend(params: BiCrmApi.TimeRangeParams) {
  return requestClient.get<BiCrmApi.CustomerTrendItem[]>(
    '/bi/crm/customer-trend',
    { params },
  );
}

/**
 * 获取跟进统计数据
 * @param params 时间范围参数
 * @returns 跟进统计数据
 */
export async function getFollowUpStats(params: BiCrmApi.TimeRangeParams) {
  return requestClient.get<BiCrmApi.FollowUpStats>('/bi/crm/follow-up', {
    params,
  });
}

/**
 * 获取销售漏斗数据
 * @param params 时间范围参数
 * @returns 销售漏斗数据
 */
export async function getSalesFunnel(params: BiCrmApi.TimeRangeParams) {
  return requestClient.get<BiCrmApi.SalesFunnel>('/bi/crm/funnel', {
    params,
  });
}

/**
 * 导出 CRM 统计数据为 Excel
 * @param params 时间范围参数
 * @returns 下载 Excel 文件
 */
export async function exportToExcel(params: BiCrmApi.TimeRangeParams) {
  // 获取 token
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (!token) {
    throw new Error('未登录或登录已过期');
  }

  // 构建查询参数
  const queryString = new URLSearchParams(
    params as Record<string, string>,
  ).toString();

  // 获取 API base URL
  const apiURL = import.meta.env.VITE_GLOB_API_URL || '/api';
  const url = `${apiURL}/bi/crm/export?${queryString}`;

  // 使用原生 fetch 避免响应拦截器
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`导出失败: ${response.statusText} - ${errorText}`);
  }

  // 获取 blob
  const blob = await response.blob();

  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  // 生成文件名
  const timeRangeMap = {
    today: '今日',
    week: '本周',
    month: '本月',
    quarter: '本季度',
    year: '本年',
    custom: '自定义',
  };
  const timeRangeLabel = timeRangeMap[params.timeRange] || '本月';
  const timestamp = new Date().toISOString().split('T')[0];
  link.download = `CRM统计报表-${timeRangeLabel}-${timestamp}.xlsx`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
