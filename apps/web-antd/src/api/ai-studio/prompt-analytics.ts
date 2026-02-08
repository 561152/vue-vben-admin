/**
 * Prompt Analytics API
 * 提示词使用分析接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface PromptAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export interface PromptTrendParams {
  period?: AnalyticsPeriod;
  limit?: number;
}

export interface PipelineUsage {
  pipelineKey: string;
  pipelineName: string;
  stepKey: string;
  bindingType: string;
  executionCount: number;
  successRate: number;
  lastExecutedAt?: string;
}

export interface VersionPerformance {
  version: number;
  versionId: string;
  testCount: number;
  successRate: number;
  avgLatencyMs: number;
  avgTokens: number;
}

export interface TrendDataPoint {
  date: string;
  usageCount: number;
  testCount: number;
  successRate: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  avgLatencyMs: number;
}

export interface PromptAnalytics {
  templateId: string;
  usageCount: number;
  testCount: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  pipelineUsages: PipelineUsage[];
  versionPerformance: VersionPerformance[];
  dailyStats: TrendDataPoint[];
  activeVersionId?: string;
  totalVersions: number;
}

// ==================== API ====================

/**
 * 获取模板使用分析
 */
export async function getPromptAnalytics(
  templateId: string,
  params?: PromptAnalyticsParams,
) {
  return requestClient.get<PromptAnalytics>(
    `/prompt-templates/${templateId}/analytics`,
    { params },
  );
}

/**
 * 获取模板趋势数据
 */
export async function getPromptTrends(
  templateId: string,
  params?: PromptTrendParams,
) {
  return requestClient.get<TrendDataPoint[]>(
    `/prompt-templates/${templateId}/analytics/trends`,
    { params },
  );
}
