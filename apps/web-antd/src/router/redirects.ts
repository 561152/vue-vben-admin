/**
 * Route Redirection Configuration
 *
 * Phase 1: 核心菜单重组 - 路由重定向服务
 *
 * Purpose: Ensure old URLs still work after menu reorganization
 * Strategy: Automatic redirect with optional migration notice
 */

/**
 * Route redirect mapping: old path → new path
 *
 * Format:
 * - Key: Old route path (exact match)
 * - Value: New route path (can include query params)
 */
export const ROUTE_REDIRECTS: Record<string, string> = {
  // ========================================
  // AI 教师模块重定向
  // ========================================

  // 题目识别 → 拍照批改 (合并功能)
  '/ai-tutor/ocr': '/ai-tutor/quick-grading',
  '/ai-tutor/question-recognition': '/ai-tutor/quick-grading', // 别名

  // 作业批改 → 拍照批改 (合并功能)
  '/ai-tutor/homework': '/ai-tutor/quick-grading',
  '/ai-tutor/homework-grading': '/ai-tutor/quick-grading', // 别名

  // 试卷分析 → 诊断中心（Paper Analysis Tab）
  '/ai-tutor/paper': '/ai-doctor/diagnosis?tab=paper',
  '/ai-tutor/paper-analysis': '/ai-doctor/diagnosis?tab=paper', // 别名

  // 错题本 → 复诊追踪（Mistakes Tab）
  '/ai-tutor/mistakes': '/ai-doctor/follow-up?tab=mistakes',
  '/ai-tutor/wrong-questions': '/ai-doctor/follow-up?tab=mistakes', // 别名

  // 学习进度 → 成长档案
  '/ai-tutor/progress': '/growth-profile/progress',
  '/ai-tutor/learning-progress': '/growth-profile/progress', // 别名

  // 错题审核 → 复诊追踪（Review Tab）
  '/ai-tutor/mistake-review': '/ai-doctor/follow-up?tab=review',

  // 题库导入 → 题库管理
  '/ai-tutor/question-import': '/ai-tutor/question-bank',

  // ========================================
  // AI 学习医生模块重定向
  // ========================================

  // 错题审核 → 复诊追踪（Review Tab）
  '/ai-doctor/wrong-question-review': '/ai-doctor/follow-up?tab=review',
};

/**
 * Get redirect target for a given path
 *
 * @param path Current route path
 * @returns Redirect target path or null if no redirect needed
 */
export function getRedirectTarget(path: string): string | null {
  // Exact match
  if (ROUTE_REDIRECTS[path]) {
    return ROUTE_REDIRECTS[path];
  }

  // No redirect needed
  return null;
}

/**
 * Check if a path requires redirection
 *
 * @param path Current route path
 * @returns True if redirect is needed
 */
export function shouldRedirect(path: string): boolean {
  return getRedirectTarget(path) !== null;
}

/**
 * Get human-readable label for new location
 *
 * @param newPath New route path
 * @returns Display label for the new location
 */
export function getNewLocationLabel(newPath: string): string {
  const labels: Record<string, string> = {
    '/ai-tutor/quick-grading': 'AI 教师 > 拍照批改',
    '/ai-doctor/diagnosis': 'AI 学习医生 > 诊断中心',
    '/ai-doctor/follow-up': 'AI 学习医生 > 复诊追踪',
    '/growth-profile/progress': '成长档案 > 学习进度',
  };

  // Extract base path (without query params)
  const basePath = newPath.split('?')[0];
  return labels[basePath] || '新位置';
}

/**
 * Get reverse redirect mapping (new path → old paths)
 * Used for showing migration notices on destination pages
 *
 * @returns Map of new paths to arrays of old paths
 */
export function getReverseRedirects(): Record<string, string[]> {
  const reverse: Record<string, string[]> = {};

  for (const [oldPath, newPath] of Object.entries(ROUTE_REDIRECTS)) {
    const basePath = newPath.split('?')[0];
    if (!reverse[basePath]) {
      reverse[basePath] = [];
    }
    reverse[basePath].push(oldPath);
  }

  return reverse;
}
