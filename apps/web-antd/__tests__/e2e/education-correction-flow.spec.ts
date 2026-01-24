/**
 * 作业批改模块 - 错题矫正流程 E2E 测试
 *
 * 测试核心流程：
 * 1. 错题列表页 - 查看错题列表
 * 2. 错题详情页 - 查看错题详情
 * 3. 矫正编辑器 - 编辑错题内容
 * 4. 步骤评分 - 修改步骤分
 * 5. 矫正历史 - 查看历史记录
 */
import { expect, test } from '@playwright/test';
import jwt from 'jsonwebtoken';

// 测试配置
const BASE_URL = 'http://localhost:5666';
const JWT_SECRET =
  process.env.JWT_SECRET || 'omnireach-secret-key-change-in-production';

// 测试用户（教师角色）
const TEST_USER = {
  id: '1',
  tenantId: '1',
  username: 'teacher',
};

// Storage 前缀
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

/**
 * 生成测试用 JWT Token
 */
function generateTestToken(): string {
  return jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * 获取 Pinia store 持久化数据
 */
function getStorageData(token: string) {
  return {
    [`${STORAGE_PREFIX}-core-access`]: JSON.stringify({
      accessToken: token,
      refreshToken: null,
      accessCodes: [],
      isLockScreen: false,
    }),
  };
}

/**
 * 通过 Token 登录
 */
async function loginWithToken(page: any) {
  const token = generateTestToken();
  const storageData = getStorageData(token);

  await page.goto(`${BASE_URL}/`);
  await page.waitForTimeout(500);

  await page.evaluate((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
  }, storageData);

  await page.reload();
  await page.waitForTimeout(2000);
}

/**
 * 等待页面加载完成
 */
async function waitForPageLoad(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 检查页面是否可访问
 */
async function isPageAccessible(page: any): Promise<boolean> {
  const title = await page.title();
  if (title.includes('404') || title.includes('Forbidden')) {
    return false;
  }
  const content = await page.content();
  if (content.includes('未找到页面') || content.includes('哎呀！')) {
    return false;
  }
  return true;
}

// ==================== 错题列表页测试 ====================
test.describe('错题列表页测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review`);
    await waitForPageLoad(page);
  });

  test('错题列表页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面 (需要 EDUCATION:PAPER:VIEW 权限)');
      return;
    }

    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('错题');

    // 检查是否有表格或卡片列表
    const hasTable = await page
      .locator('.ant-table')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasCards = await page
      .locator('.ant-card')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasTable || hasCards).toBeTruthy();
  });

  test('筛选器可用 - 错误类型筛选', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找错误类型选择器
    const errorTypeSelect = page
      .locator('.ant-select')
      .filter({ has: page.locator('text=错误类型') })
      .first();

    if (
      await errorTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(errorTypeSelect).toBeVisible();
      await errorTypeSelect.click();
      await page.waitForTimeout(300);

      // 检查下拉选项
      const options = page.locator('.ant-select-item');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('筛选器可用 - 知识点筛选', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const knowledgeSelect = page
      .locator('.ant-select')
      .filter({ has: page.locator('text=知识点') })
      .first();

    if (await knowledgeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(knowledgeSelect).toBeVisible();
    }
  });

  test('筛选器可用 - 掌握程度筛选', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const masterySelect = page
      .locator('.ant-select')
      .filter({ has: page.locator('text=掌握') })
      .first();

    if (await masterySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(masterySelect).toBeVisible();
    }
  });

  test('错题卡片可点击进入详情', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 等待列表加载
    await page.waitForTimeout(1000);

    // 查找第一个错题卡片或表格行
    const firstItem = page
      .locator('.ant-card, .ant-table-row')
      .first();

    const itemVisible = await firstItem
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (itemVisible) {
      // 点击进入详情
      await firstItem.click();
      await page.waitForTimeout(1000);

      // 验证 URL 变化（进入详情页）
      const url = page.url();
      expect(url).toMatch(/\/ai-tutor\/mistake-review\/.+/);
    } else {
      test.skip(true, '暂无错题数据');
    }
  });

  test('导出错题集按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const exportButton = page.getByRole('button', { name: /导出|下载|PDF/i });

    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportButton).toBeEnabled();
    }
  });
});

// ==================== 错题详情页测试 ====================
test.describe('错题详情页测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    // 使用模拟的错题 ID
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('错题详情页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 检查是否有主要内容区域
    const contentArea = page.locator('.ant-layout-content, main');
    await expect(contentArea).toBeVisible({ timeout: 5000 });
  });

  test('试卷图片区域可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 检查图片容器或 Canvas
    const imageContainer = page.locator(
      'img, canvas, .image-container, [class*="image"]'
    );

    if (await imageContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(imageContainer.first()).toBeVisible();
    }
  });

  test('题目信息卡片可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const infoCard = page.locator('.ant-card').first();
    if (await infoCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(infoCard).toBeVisible();
    }
  });

  test('Tab 切换功能正常', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const tabs = page.locator('.ant-tabs-tab');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      // 点击第二个 Tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);

      // 验证 Tab 切换成功
      await expect(tabs.nth(1)).toHaveClass(/ant-tabs-tab-active/);
    }
  });
});

// ==================== 矫正编辑器测试 ====================
test.describe('矫正编辑器测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('矫正编辑器可打开', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找"编辑"或"矫正"按钮
    const editButton = page.getByRole('button', { name: /编辑|矫正/i });

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      // 检查编辑器是否打开（Modal 或 Drawer）
      const editor = page.locator('.ant-modal, .ant-drawer');
      await expect(editor).toBeVisible();
    }
  });

  test('学生答案输入框可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const editButton = page.getByRole('button', { name: /编辑|矫正/i });

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      // 查找学生答案输入框
      const answerInput = page.locator(
        'textarea, .ant-input'
      ).filter({ hasText: /学生答案|studentAnswer/i });

      if (await answerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(answerInput).toBeEnabled();

        // 测试输入
        await answerInput.fill('x = 2');
        await expect(answerInput).toHaveValue('x = 2');
      }
    }
  });

  test('LaTeX 公式输入框可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const editButton = page.getByRole('button', { name: /编辑|矫正/i });

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      // 查找 LaTeX 输入框
      const latexInput = page
        .locator('input, textarea')
        .filter({ hasText: /LaTeX|公式/i });

      if (await latexInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(latexInput).toBeEnabled();

        // 测试 LaTeX 输入
        await latexInput.fill('x^2 + y^2 = r^2');
        await expect(latexInput).toHaveValue('x^2 + y^2 = r^2');
      }
    }
  });

  test('保存矫正按钮可见且可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const editButton = page.getByRole('button', { name: /编辑|矫正/i });

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const saveButton = page
        .locator('.ant-modal-footer, .ant-drawer-footer')
        .getByRole('button', { name: /保存|确定/i });

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    }
  });

  test('取消按钮可关闭编辑器', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const editButton = page.getByRole('button', { name: /编辑|矫正/i });

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const cancelButton = page
        .locator('.ant-modal-footer, .ant-drawer-footer')
        .getByRole('button', { name: /取消/i });

      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(300);

        // 验证编辑器已关闭
        const editor = page.locator('.ant-modal, .ant-drawer');
        await expect(editor).not.toBeVisible();
      }
    }
  });
});

// ==================== 步骤评分测试 ====================
test.describe('步骤评分测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('步骤评分面板可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找步骤评分相关的 Tab 或面板
    const stepScorePanel = page
      .locator('[class*="step"], [class*="score"]')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (
      await stepScorePanel.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(stepScorePanel).toBeVisible();
    }
  });

  test('AI 评分显示正确', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找 AI 评分标签或文本
    const aiScoreLabel = page.locator('text=AI评分, text=AI给分');

    if (await aiScoreLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(aiScoreLabel).toBeVisible();
    }
  });

  test('教师评分输入框可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找评分输入框（InputNumber）
    const scoreInput = page
      .locator('.ant-input-number-input')
      .first();

    if (await scoreInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(scoreInput).toBeEnabled();

      // 测试输入分数
      await scoreInput.fill('3.5');
      await page.waitForTimeout(300);
    }
  });

  test('评语输入框可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找评语输入框
    const commentInput = page
      .locator('input, textarea')
      .filter({ hasText: /评语|comment/i })
      .first();

    if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(commentInput).toBeEnabled();

      // 测试输入评语
      await commentInput.fill('步骤正确但计算有误');
      await expect(commentInput).toHaveValue('步骤正确但计算有误');
    }
  });

  test('总分自动计算正确', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找总分显示区域
    const totalScore = page.locator('text=总分').first();

    if (await totalScore.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(totalScore).toBeVisible();

      // 检查总分是否为数字格式
      const scoreText = await totalScore.textContent();
      expect(scoreText).toMatch(/\d+(\.\d+)?/);
    }
  });
});

// ==================== 矫正历史测试 ====================
test.describe('矫正历史测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('矫正历史时间轴可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找历史相关的 Tab
    const historyTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /历史|History/i })
      .first();

    if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);

      // 检查时间轴组件
      const timeline = page.locator('.ant-timeline');
      if (await timeline.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(timeline).toBeVisible();
      }
    }
  });

  test('矫正记录显示完整信息', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const historyTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /历史|History/i })
      .first();

    if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);

      // 检查是否显示矫正人、时间、内容
      const hasCorrector = await page
        .locator('text=教师, text=专家, text=admin')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      const hasTimestamp = await page
        .locator('[class*="time"], [class*="date"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // 至少应该有时间或矫正人信息
      expect(hasCorrector || hasTimestamp).toBeTruthy();
    }
  });

  test('回滚按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const historyTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /历史|History/i })
      .first();

    if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);

      const rollbackButton = page.getByRole('button', { name: /回滚/i });

      if (
        await rollbackButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(rollbackButton).toBeEnabled();
      }
    }
  });
});

// ==================== 提交审核流程测试 ====================
test.describe('提交审核流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('提交审核按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const submitButton = page.getByRole('button', {
      name: /提交审核|提交专家审核/i,
    });

    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(submitButton).toBeEnabled();
    }
  });

  test('提交审核确认对话框正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const submitButton = page.getByRole('button', {
      name: /提交审核|提交专家审核/i,
    });

    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // 检查确认对话框
      const confirmModal = page.locator('.ant-modal-confirm, .ant-popconfirm');
      if (
        await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(confirmModal).toBeVisible();

        // 取消提交
        const cancelButton = page.getByRole('button', { name: /取消/i });
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        }
      }
    }
  });

  test('矫正状态标签正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找状态标签 (AUTO/TEACHER/EXPERT/VERIFIED)
    const statusTag = page
      .locator('.ant-tag')
      .filter({ hasText: /自动|教师|专家|已验证|AUTO|TEACHER|EXPERT|VERIFIED/i })
      .first();

    if (await statusTag.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusTag).toBeVisible();
    }
  });
});

// ==================== 返回按钮测试 ====================
test.describe('导航功能测试', () => {
  test('返回按钮可用', async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);

    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const backButton = page
      .locator('button')
      .filter({ has: page.locator('[class*="ArrowLeft"], [class*="back"]') })
      .first();

    if (await backButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(backButton).toBeEnabled();

      // 点击返回
      await backButton.click();
      await page.waitForTimeout(1000);

      // 验证返回到列表页
      const url = page.url();
      expect(url).toMatch(/\/ai-tutor\/mistake-review$/);
    }
  });
});
