/**
 * Prompt Template API
 * 提示词模板接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export interface PromptTemplate {
  id: string;
  tenantId: string | null;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  templateContent: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: any;
  }>;
  defaultValues: Record<string, any> | null;
  modelConfig: {
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  } | null;
  version: number;
  isActive: boolean;
  isSystem: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateListParams {
  category?: string;
  tags?: string;
  includeSystem?: boolean;
  activeOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PromptTemplateListResponse {
  data: PromptTemplate[];
  total: number;
}

// ==================== API ====================

/**
 * 获取提示词模板列表
 */
export async function getPromptTemplates(params?: PromptTemplateListParams) {
  return requestClient.get<PromptTemplateListResponse>('/prompt-templates', {
    params,
  });
}

/**
 * 获取提示词模板详情
 */
export async function getPromptTemplate(id: string) {
  return requestClient.get<PromptTemplate>(`/prompt-templates/${id}`);
}

/**
 * 根据 key 获取提示词模板
 */
export async function getPromptTemplateByKey(key: string) {
  return requestClient.get<PromptTemplate>(`/prompt-templates/key/${key}`);
}

// ==================== 提示词管理模块新增接口 ====================

export interface CreatePromptTemplateData {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  templateContent: string;
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: unknown;
  }>;
  defaultValues?: Record<string, unknown> | null;
  modelConfig?: {
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  } | null;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdatePromptTemplateData extends Partial<CreatePromptTemplateData> {}

export interface PromptTemplateVersion {
  id: string;
  promptTemplateId: string;
  version: number;
  templateContent: string;
  variables: unknown;
  modelConfig: unknown;
  changeLog: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PromptVersionListResponse {
  data: PromptTemplateVersion[];
  total: number;
}

export interface CategoryOption {
  value: string;
  label: string;
  count: number;
}

/**
 * 创建提示词模板
 */
export async function createPromptTemplate(data: CreatePromptTemplateData) {
  return requestClient.post<PromptTemplate>('/prompt-templates', data);
}

/**
 * 更新提示词模板
 */
export async function updatePromptTemplate(
  id: string,
  data: UpdatePromptTemplateData,
) {
  return requestClient.put<PromptTemplate>(`/prompt-templates/${id}`, data);
}

/**
 * 删除提示词模板
 */
export async function deletePromptTemplate(id: string) {
  return requestClient.delete(`/prompt-templates/${id}`);
}

/**
 * 克隆提示词模板
 */
export async function clonePromptTemplate(
  id: string,
  newKey?: string,
  newName?: string,
) {
  return requestClient.post<PromptTemplate>(`/prompt-templates/${id}/clone`, {
    newKey,
    newName,
  });
}

/**
 * 发布提示词模板（创建新版本）
 */
export async function publishPromptTemplate(id: string, changeLog?: string) {
  return requestClient.post<PromptTemplateVersion>(
    `/prompt-templates/${id}/publish`,
    { changeLog },
  );
}

/**
 * 获取提示词模板版本历史
 */
export async function getPromptTemplateVersions(
  id: string,
  params?: { limit?: number; offset?: number },
) {
  return requestClient.get<PromptVersionListResponse>(
    `/prompt-templates/${id}/versions`,
    { params },
  );
}

/**
 * 回滚到指定版本
 */
export async function rollbackPromptTemplate(id: string, versionId: string) {
  return requestClient.post<PromptTemplate>(
    `/prompt-templates/${id}/rollback`,
    { versionId },
  );
}

/**
 * 对比两个版本
 */
export async function comparePromptVersions(
  id: string,
  versionId1: string,
  versionId2: string,
) {
  return requestClient.post<{
    additions: number;
    deletions: number;
    diff: string;
  }>(`/prompt-templates/${id}/compare`, { versionId1, versionId2 });
}

/**
 * 获取所有分类列表
 */
export async function getPromptCategories() {
  return requestClient.get<CategoryOption[]>('/prompt-templates/categories');
}

/**
 * 获取所有标签列表
 */
export async function getPromptTags() {
  return requestClient.get<string[]>('/prompt-templates/tags');
}

/**
 * 批量删除提示词模板
 */
export async function batchDeletePromptTemplates(ids: string[]) {
  return requestClient.post('/prompt-templates/batch-delete', { ids });
}

/**
 * 检查提示词是否被使用
 */
export async function checkPromptUsage(id: string) {
  return requestClient.get<{
    inUse: boolean;
    pipelines: Array<{ id: string; name: string }>;
  }>(`/prompt-templates/${id}/usage`);
}
