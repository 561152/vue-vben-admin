/**
 * 题库导入 API 接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export interface QuestionBankImport {
  id: string;
  paperId: string;
  totalQuestions: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  autoMerge: boolean;
  qualityThreshold: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorLog?: string;
  processedAt?: string;
  createdAt: string;
}

export interface ImportConfig {
  autoMerge?: boolean;
  qualityThreshold?: number;
}

export interface ImportPaperDto {
  paperId: string;
  config?: ImportConfig;
}

// ==================== API 函数 ====================

/**
 * 从试卷导入题目到题库
 */
export async function importPaperToQuestionBank(data: ImportPaperDto) {
  return requestClient.post<QuestionBankImport>(
    '/education/question-bank/import',
    data,
  );
}

/**
 * 获取导入状态
 */
export async function getImportStatus(importId: string) {
  return requestClient.get<QuestionBankImport>(
    `/education/question-bank/import/${importId}/status`,
  );
}

/**
 * 获取导入历史列表
 */
export async function getImportHistory(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return requestClient.get<{
    items: QuestionBankImport[];
    total: number;
  }>('/education/question-bank/import', { params });
}
