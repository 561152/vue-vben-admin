/**
 * 错题矫正管理 API 接口
 */
import { requestClient } from '../request';

// ==================== 类型定义 ====================

export enum CorrectionLevel {
  AUTO = 'AUTO',
  TEACHER = 'TEACHER',
  EXPERT = 'EXPERT',
  VERIFIED = 'VERIFIED',
}

export enum CorrectionType {
  QUESTION_TEXT = 'QUESTION_TEXT',
  STUDENT_ANSWER = 'STUDENT_ANSWER',
  CORRECT_ANSWER = 'CORRECT_ANSWER',
  SCORING = 'SCORING',
  STEP_SCORING = 'STEP_SCORING',
}

export interface CorrectionHistory {
  id: string;
  questionItemId: string;
  correctionType: CorrectionType;
  correctionLevel: CorrectionLevel;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  diffPatch?: string;
  charStart?: number;
  charEnd?: number;
  latexFormula?: string;
  correctorId: number;
  correctorRole: string;
  reason?: string;
  corrector: {
    id: number;
    username: string;
    realName?: string;
  };
  createdAt: string;
}

export interface StepScoreDetail {
  id: string;
  questionItemId: string;
  stepNumber: number;
  stepDescription: string;
  maxScore: number;
  aiScore?: number;
  aiReasoning?: string;
  teacherScore?: number;
  teacherComment?: string;
  modifiedBy?: number;
  modifier?: {
    id: number;
    username: string;
    realName?: string;
  };
  modifiedAt?: string;
  isCorrect: boolean;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorrectionDto {
  questionItemId: string;
  correctionType: CorrectionType;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  correctorId: number;
  correctorRole: string;
  reason?: string;
  correctionLevel?: CorrectionLevel;
}

export interface SegmentCorrectionDto extends CreateCorrectionDto {
  charStart: number;
  charEnd: number;
  latexFormula?: string;
}

export interface BatchCorrectionDto {
  corrections: CreateCorrectionDto[];
}

export interface BatchResult {
  success: number;
  failed: number;
  errors: Array<{
    questionItemId: string;
    error: string;
  }>;
}

export interface UpdateStepScoreDto {
  score: number;
  comment?: string;
}

// ==================== API 函数 ====================

/**
 * 创建矫正记录
 */
export async function createCorrection(data: CreateCorrectionDto) {
  return requestClient.post<CorrectionHistory>(
    '/education/paper/corrections',
    data,
  );
}

/**
 * 字符级矫正
 */
export async function correctSegment(data: SegmentCorrectionDto) {
  return requestClient.post<CorrectionHistory>(
    '/education/paper/corrections/segment',
    data,
  );
}

/**
 * 批量矫正
 */
export async function batchCorrection(data: BatchCorrectionDto) {
  return requestClient.post<BatchResult>(
    '/education/paper/corrections/batch',
    data,
  );
}

/**
 * 获取矫正历史
 */
export async function getCorrectionHistory(questionItemId: string) {
  return requestClient.get<CorrectionHistory[]>(
    `/education/paper/corrections/history/${questionItemId}`,
  );
}

/**
 * 回滚矫正
 */
export async function rollbackCorrection(correctionId: string) {
  return requestClient.post<void>(
    `/education/paper/corrections/${correctionId}/rollback`,
  );
}

/**
 * 提交审核
 */
export async function submitForReview(questionItemId: string, notes?: string) {
  return requestClient.post<void>(
    `/education/paper/corrections/submit-review`,
    {
      questionItemId,
      notes,
    },
  );
}

/**
 * 获取步骤评分详情
 */
export async function getStepScores(questionItemId: string) {
  return requestClient.get<StepScoreDetail[]>(
    `/education/paper/steps/${questionItemId}`,
  );
}

/**
 * 修改步骤分
 */
export async function updateStepScore(
  stepId: string,
  data: UpdateStepScoreDto,
) {
  return requestClient.put<StepScoreDetail>(
    `/education/paper/steps/${stepId}/score`,
    data,
  );
}
