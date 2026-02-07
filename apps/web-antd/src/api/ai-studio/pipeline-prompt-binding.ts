/**
 * AI Studio Pipeline Step Prompt Binding API
 * 流程步骤与提示词模板绑定接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export type BindingType = 'PRIMARY' | 'FALLBACK' | 'SHADOW';

export interface PipelinePromptBinding {
  id: string;
  stepId: string;
  promptTemplateId: string;
  bindingType: BindingType;
  priority: number;
  variableMappings: Record<string, string> | null;
  condition: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  promptTemplateName?: string;
  promptTemplateKey?: string;
  promptTemplateCategory?: string;
}

export interface CreateBindingParams {
  promptTemplateId: number;
  bindingType?: BindingType;
  priority?: number;
  variableMappings?: Record<string, string>;
  condition?: string;
}

export interface UpdateBindingParams {
  bindingType?: BindingType;
  priority?: number;
  variableMappings?: Record<string, string>;
  condition?: string;
  isActive?: boolean;
}

export interface BatchCreateResult {
  successCount: number;
  failedCount: number;
  errors: string[];
  createdIds?: string[];
}

export interface PromptTemplateUsage {
  id: string;
  pipelineId: string;
  pipelineKey: string;
  pipelineName: string;
  stepId: string;
  stepKey: string;
  stepName: string;
  bindingType: BindingType;
  priority: number;
  isActive: boolean;
}

// ==================== Binding API ====================

/**
 * 获取步骤的所有提示词绑定
 */
export async function getStepPromptBindings(
  pipelineKey: string,
  stepKey: string,
  activeOnly = true,
) {
  return requestClient.get<PipelinePromptBinding[]>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings`,
    { params: { activeOnly } },
  );
}

/**
 * 创建提示词绑定
 */
export async function createPromptBinding(
  pipelineKey: string,
  stepKey: string,
  data: CreateBindingParams,
) {
  return requestClient.post<PipelinePromptBinding>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings`,
    data,
  );
}

/**
 * 批量创建提示词绑定
 */
export async function batchCreatePromptBindings(
  pipelineKey: string,
  stepKey: string,
  bindings: CreateBindingParams[],
) {
  return requestClient.post<BatchCreateResult>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings/batch`,
    { bindings },
  );
}

/**
 * 获取绑定详情
 */
export async function getPromptBinding(
  pipelineKey: string,
  stepKey: string,
  bindingId: string,
) {
  return requestClient.get<PipelinePromptBinding>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings/${bindingId}`,
  );
}

/**
 * 更新提示词绑定
 */
export async function updatePromptBinding(
  pipelineKey: string,
  stepKey: string,
  bindingId: string,
  data: UpdateBindingParams,
) {
  return requestClient.put<PipelinePromptBinding>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings/${bindingId}`,
    data,
  );
}

/**
 * 删除提示词绑定
 */
export async function deletePromptBinding(
  pipelineKey: string,
  stepKey: string,
  bindingId: string,
) {
  return requestClient.delete(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings/${bindingId}`,
  );
}

/**
 * 批量删除提示词绑定
 */
export async function batchDeletePromptBindings(
  pipelineKey: string,
  stepKey: string,
  bindingIds: string[],
) {
  return requestClient.post<BatchCreateResult>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/prompt-bindings`,
    { bindingIds },
  );
}

/**
 * 获取步骤的生效提示词
 */
export async function getActivePromptForStep(
  pipelineKey: string,
  stepKey: string,
) {
  return requestClient.get<PipelinePromptBinding | null>(
    `/ai-studio/pipelines/${pipelineKey}/steps/${stepKey}/active-prompt`,
  );
}

/**
 * 获取提示词模板的使用情况
 */
export async function getPromptTemplateUsages(templateId: string) {
  return requestClient.get<PromptTemplateUsage[]>(
    `/ai-studio/prompt-templates/${templateId}/pipeline-usages`,
  );
}
