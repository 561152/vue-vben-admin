/**
 * AI Studio Pipeline API
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export interface Pipeline {
  id: number;
  key: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: any;
  inputSchema: any;
  outputSchema: any;
  formSchema: any | null;
  defHash: string | null;
  runtimeConfig: any;
  isSystem: boolean;
  isActive: boolean;
  version: number;
  timeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineListResponse {
  data: Pipeline[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExecutionSubmitResponse {
  executionId: string;
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export interface PipelineExecution {
  id: string;
  pipelineId: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  inputData: any;
  outputData: any | null;
  totalTokens: number;
  totalCost: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StepExecution {
  id: string;
  executionId: string;
  stepKey: string;
  name: string;
  status: string;
  inputData: any;
  outputData: any;
  tokensUsed: number;
  cost: number;
  latencyMs: number;
  sequence: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string;
}

// ==================== Pipeline API ====================

/**
 * 获取 Pipeline 列表
 */
export async function getPipelines(params?: {
  featureCode?: string;
  triggerType?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<PipelineListResponse>('/ai-studio/pipelines', {
    params,
  });
}

/**
 * 根据 key 获取 Pipeline 详情
 */
export async function getPipelineByKey(key: string) {
  return requestClient.get<Pipeline>(`/ai-studio/pipelines/${key}`);
}

/**
 * 更新 Pipeline Runtime Config
 */
export async function updateRuntimeConfig(
  key: string,
  config: Record<string, any>,
) {
  return requestClient.put(`/ai-studio/pipelines/${key}/config`, {
    runtimeConfig: config,
  });
}

/**
 * 执行 Pipeline
 */
export async function executePipeline(
  key: string,
  data: {
    inputData: Record<string, any>;
    sync?: boolean;
  },
) {
  return requestClient.post<ExecutionSubmitResponse>(
    `/ai-studio/pipelines/${key}/execute`,
    data,
  );
}

/**
 * 获取执行历史
 */
export async function getExecutions(
  key: string,
  params?: {
    page?: number;
    pageSize?: number;
  },
) {
  return requestClient.get<{
    data: PipelineExecution[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/ai-studio/pipelines/${key}/executions`, { params });
}

/**
 * 获取执行详情
 */
export async function getExecutionDetail(executionId: string) {
  return requestClient.get<{
    execution: PipelineExecution;
    steps: StepExecution[];
  }>(`/ai-studio/executions/${executionId}`);
}

// ==================== 功能模块 API ====================

export interface FeatureModule {
  code: string;
  label: string;
  pipelineCount: number;
}

/**
 * 获取可用功能模块列表
 */
export async function getFeatureModules() {
  return requestClient.get<FeatureModule[]>('/ai-studio/feature-modules');
}
