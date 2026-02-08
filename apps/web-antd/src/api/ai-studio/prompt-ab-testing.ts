/**
 * Prompt A/B Testing API
 * 提示词 A/B 测试接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export enum AbTestStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface CreateShadowTestParams {
  name: string;
  description?: string;
  controlVersionId: number;
  treatmentVersionId: number;
  trafficPercentage?: number;
  endDate?: string;
  targetExecutions?: number;
}

export interface UpdateAbTestParams {
  name?: string;
  description?: string;
  trafficPercentage?: number;
  status?: AbTestStatus;
}

export interface AbTestResponse {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  controlVersionId: string;
  treatmentVersionId: string;
  trafficPercentage: number;
  status: AbTestStatus;
  targetExecutions?: number;
  currentExecutions: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface VersionMetrics {
  versionId: string;
  version: number;
  executionCount: number;
  successCount: number;
  successRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  avgTokens: number;
  totalTokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AbTestResults {
  testId: string;
  name: string;
  status: AbTestStatus;
  controlMetrics: VersionMetrics;
  treatmentMetrics: VersionMetrics;
  latencyDiffPercent: number;
  successRateDiff: number;
  tokenDiffPercent: number;
  pValue?: number;
  isSignificant: boolean;
  recommendedVersion?: 'control' | 'treatment';
  recommendation?: string;
  startedAt: string;
  endedAt?: string;
}

export interface CompareVersionsParams {
  versionAId: number;
  versionBId: number;
}

export interface ComparisonResult {
  versionA: VersionMetrics;
  versionB: VersionMetrics;
  latencyDiffPercent: number;
  successRateDiff: number;
  tokenDiffPercent: number;
  recommendedVersion: 'A' | 'B' | 'equal';
  recommendation: string;
}

// ==================== API ====================

/**
 * 创建 A/B 测试
 */
export async function createAbTest(
  templateId: string,
  params: CreateShadowTestParams,
) {
  return requestClient.post<AbTestResponse>(
    `/prompt-templates/${templateId}/ab-tests`,
    params,
  );
}

/**
 * 获取模板的 A/B 测试列表
 */
export async function getAbTests(templateId: string) {
  return requestClient.get<AbTestResponse[]>(
    `/prompt-templates/${templateId}/ab-tests`,
  );
}

/**
 * 获取 A/B 测试详情
 */
export async function getAbTest(templateId: string, testId: string) {
  return requestClient.get<AbTestResponse>(
    `/prompt-templates/${templateId}/ab-tests/${testId}`,
  );
}

/**
 * 更新 A/B 测试
 */
export async function updateAbTest(
  templateId: string,
  testId: string,
  params: UpdateAbTestParams,
) {
  return requestClient.put<AbTestResponse>(
    `/prompt-templates/${templateId}/ab-tests/${testId}`,
    params,
  );
}

/**
 * 删除 A/B 测试
 */
export async function deleteAbTest(templateId: string, testId: string) {
  return requestClient.delete(
    `/prompt-templates/${templateId}/ab-tests/${testId}`,
  );
}

/**
 * 获取 A/B 测试结果
 */
export async function getAbTestResults(templateId: string, testId: string) {
  return requestClient.get<AbTestResults>(
    `/prompt-templates/${templateId}/ab-tests/${testId}/results`,
  );
}

/**
 * 对比两个版本
 */
export async function compareVersions(
  templateId: string,
  params: CompareVersionsParams,
) {
  return requestClient.post<ComparisonResult>(
    `/prompt-templates/${templateId}/compare-versions`,
    params,
  );
}
