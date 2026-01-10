import { requestClient } from '#/api/request';
import { useAccessStore } from '@vben/stores';

// ===================================
// TypeScript 类型定义
// ===================================

export namespace PrintApi {
  // 打印模板类型
  export type ReportType =
    | 'PAPER_GRADING'
    | 'K12_DAILY'
    | 'K12_WEEKLY'
    | 'BI_CRM_OVERVIEW'
    | 'BI_SALES_FUNNEL';

  // 模板配置
  export interface TemplateConfig {
    header?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      showDate?: boolean;
    };
    footer?: {
      enabled?: boolean;
      text?: string;
    };
    logo?: {
      enabled?: boolean;
      url?: string;
      width?: number;
    };
    theme?: {
      primaryColor?: string;
      fontSize?: number;
    };
  }

  // 打印模板信息
  export interface PrintTemplate {
    id: string;
    name: string;
    code: string;
    reportType: ReportType;
    isSystem: boolean;
    isActive: boolean;
    config?: TemplateConfig;
  }

  // 创建打印任务请求
  export interface CreatePrintJobRequest {
    templateCode: string;
    data: Record<string, unknown>;
    configOverride?: Partial<TemplateConfig>;
    fileName?: string;
  }

  // 批量打印请求
  export interface CreateBatchPrintJobRequest {
    templateCode: string;
    dataList: Record<string, unknown>[];
    mergeIntoOne?: boolean;
    configOverride?: Partial<TemplateConfig>;
    fileName?: string;
  }

  // 打印任务状态
  export type PrintJobStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED';

  // 打印任务信息
  export interface PrintJob {
    id: string;
    templateCode: string;
    templateName: string;
    jobType: 'SINGLE' | 'BATCH';
    status: PrintJobStatus;
    progress: number;
    totalCount: number;
    successCount: number;
    failedCount: number;
    fileName: string | null;
    fileSize: number | null;
    ossPath: string | null;
    downloadUrl?: string;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  }

  // 下载响应
  export interface DownloadResponse {
    downloadUrl: string;
  }
}

// ===================================
// API 函数
// ===================================

/**
 * 获取打印模板列表
 */
export async function getTemplates() {
  return requestClient.get<PrintApi.PrintTemplate[]>('/print/templates');
}

/**
 * 获取模板详情
 */
export async function getTemplateById(id: string) {
  return requestClient.get<PrintApi.PrintTemplate>(`/print/templates/${id}`);
}

/**
 * 生成单个PDF报告（直接下载）
 * @param request 打印请求
 */
export async function generatePdf(request: PrintApi.CreatePrintJobRequest) {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (!token) {
    throw new Error('未登录或登录已过期');
  }

  const apiURL = import.meta.env.VITE_GLOB_API_URL || '/api';
  const url = `${apiURL}/print/generate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`生成PDF失败: ${response.statusText} - ${errorText}`);
  }

  // 获取 blob
  const blob = await response.blob();

  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  // 生成文件名
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = request.fileName || `报告-${timestamp}.pdf`;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 创建批量打印任务
 * @param request 批量打印请求
 * @returns 任务ID
 */
export async function createBatchJob(
  request: PrintApi.CreateBatchPrintJobRequest,
) {
  return requestClient.post<{ jobId: string }>('/print/batch', request);
}

/**
 * 获取打印任务状态
 * @param jobId 任务ID
 */
export async function getJobStatus(jobId: string) {
  return requestClient.get<PrintApi.PrintJob>(`/print/jobs/${jobId}`);
}

/**
 * 获取打印任务下载链接
 * @param jobId 任务ID
 */
export async function getJobDownloadUrl(jobId: string) {
  return requestClient.get<PrintApi.DownloadResponse>(
    `/print/jobs/${jobId}/download`,
  );
}

/**
 * 下载批量打印结果
 * @param jobId 任务ID
 * @param fileName 文件名
 */
export async function downloadBatchResult(jobId: string, fileName?: string) {
  const result = await getJobDownloadUrl(jobId);

  if (!result.downloadUrl) {
    throw new Error('下载链接不可用');
  }

  const response = await fetch(result.downloadUrl);
  if (!response.ok) {
    throw new Error('下载失败');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  const timestamp = new Date().toISOString().split('T')[0];
  link.download = fileName || `批量报告-${timestamp}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * 获取打印任务列表
 */
export async function getJobList(params?: {
  status?: PrintApi.PrintJobStatus;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<{
    items: PrintApi.PrintJob[];
    total: number;
    page: number;
    pageSize: number;
  }>('/print/jobs', { params });
}
