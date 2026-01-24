/**
 * 错题可视化 API 接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export interface MistakeDetail {
  id: string;
  studentId: number;
  questionItemId: string;
  questionItem: {
    id: string;
    questionNumber: number;
    questionContent: string;
    studentAnswer: string;
    studentAnswerLatex?: string;
    correctAnswer: string;
    correctAnswerLatex?: string;
    score: number;
    maxScore: number;
    isCorrect: boolean;
    errorType?: string;
    // 图片坐标
    regionX?: number;
    regionY?: number;
    regionWidth?: number;
    regionHeight?: number;
    // 试卷图片
    paperImageUrl?: string;
  };
  errorType: string;
  knowledgePoints: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  analysis?: string;
  suggestion?: string;
  masteryLevel: number;
  reviewCount: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MistakeStats {
  totalMistakes: number;
  byErrorType: Record<string, number>;
  byKnowledgePoint: Record<string, number>;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  masteryTrend: Array<{
    date: string;
    masteryRate: number;
  }>;
}

export interface MistakeListParams {
  page?: number;
  pageSize?: number;
  studentId?: number;
  errorType?: string;
  knowledgePointId?: string;
  masteryLevel?: number;
  sortBy?: 'createdAt' | 'reviewCount' | 'masteryLevel';
  sortOrder?: 'asc' | 'desc';
}

// ==================== API 函数 ====================

/**
 * 获取错题详情
 */
export async function getMistakeDetail(mistakeId: string) {
  return requestClient.get<MistakeDetail>(`/education/mistakes/${mistakeId}`);
}

/**
 * 获取错题列表
 */
export async function getMistakeList(params: MistakeListParams) {
  return requestClient.get<{
    items: MistakeDetail[];
    total: number;
    page: number;
    pageSize: number;
  }>('/education/mistakes', { params });
}

/**
 * 获取错题统计
 */
export async function getMistakeStats(studentId?: number) {
  return requestClient.get<MistakeStats>('/education/mistakes/stats', {
    params: { studentId },
  });
}

/**
 * 标记错题已掌握
 */
export async function markMistakeMastered(mistakeId: string) {
  return requestClient.post<void>(`/education/mistakes/${mistakeId}/master`);
}

/**
 * 生成错题集 PDF
 */
export async function generateMistakeBookPdf(studentId: number) {
  return requestClient.post<{ downloadUrl: string }>(
    '/education/mistakes/generate-pdf',
    { studentId }
  );
}
