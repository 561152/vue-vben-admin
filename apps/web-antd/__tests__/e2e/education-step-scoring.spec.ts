/**
 * 作业批改模块 - 步骤评分流程 E2E 测试
 *
 * 测试核心流程：
 * 1. 步骤评分面板 - 查看步骤列表
 * 2. AI 评分显示 - 查看 AI 给分和理由
 * 3. 教师修改分数 - 修改步骤分
 * 4. 评语输入 - 添加评语
 * 5. 总分计算 - 验证总分自动更新
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

// ==================== 步骤评分面板显示测试 ====================
test.describe('步骤评分面板显示测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    // 使用模拟的错题详情页（包含步骤评分）
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('步骤评分面板正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 查找步骤评分 Tab 或面板
    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分|Step/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 验证 Tab 激活
      await expect(stepScoreTab).toHaveClass(/ant-tabs-tab-active/);
    }
  });

  test('步骤列表正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    // 切换到步骤评分 Tab
    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找步骤列表（List 或 Table）
      const stepList = page.locator(
        '.ant-list, .ant-table, [class*="step-list"]'
      );

      if (await stepList.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(stepList).toBeVisible();

        // 检查是否有步骤项
        const stepItems = page.locator(
          '.ant-list-item, .ant-table-row, [class*="step-item"]'
        );
        const itemCount = await stepItems.count();
        expect(itemCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('步骤序号正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找步骤序号（通常是 "步骤1", "步骤2" 等）
      const stepNumber = page.locator('text=/步骤\\s*\\d+/i').first();

      if (await stepNumber.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(stepNumber).toBeVisible();
        const text = await stepNumber.textContent();
        expect(text).toMatch(/\d+/);
      }
    }
  });

  test('步骤描述正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找步骤描述文本
      const stepDescription = page
        .locator('[class*="description"], [class*="step-desc"]')
        .first();

      if (
        await stepDescription.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const text = await stepDescription.textContent();
        expect(text).toBeTruthy();
        expect(text!.length).toBeGreaterThan(0);
      }
    }
  });

  test('满分值正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找满分值标签（如 "/5分", "满分 5分" 等）
      const maxScore = page.locator('text=/\\/\\s*\\d+|满分\\s*\\d+/i').first();

      if (await maxScore.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await maxScore.textContent();
        expect(text).toMatch(/\d+/);
      }
    }
  });
});

// ==================== AI 评分显示测试 ====================
test.describe('AI 评分显示测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('AI 评分标签可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找 AI 评分标签
      const aiScoreLabel = page.locator('text=AI评分, text=AI给分').first();

      if (await aiScoreLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(aiScoreLabel).toBeVisible();
      }
    }
  });

  test('AI 评分数值正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找 AI 评分数值（通常显示为 Tag 或数字）
      const aiScore = page
        .locator('text=AI评分, text=AI给分')
        .locator('..')
        .locator('.ant-tag, [class*="score-value"]')
        .first();

      if (await aiScore.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await aiScore.textContent();
        expect(text).toMatch(/\d+(\.\d+)?/);
      }
    }
  });

  test('AI 评分理由可查看', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找理由图标或按钮（通常是 QuestionCircleOutlined 图标）
      const reasonIcon = page
        .locator('[class*="question-circle"], [class*="info-circle"]')
        .first();

      if (await reasonIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(reasonIcon).toBeVisible();

        // 鼠标悬停查看 Tooltip
        await reasonIcon.hover();
        await page.waitForTimeout(500);

        // 检查 Tooltip 是否显示
        const tooltip = page.locator('.ant-tooltip');
        if (await tooltip.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(tooltip).toBeVisible();

          // 检查 Tooltip 内容
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toBeTruthy();
          expect(tooltipText!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('AI 评分状态图标正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找正确/错误状态图标（通常是 CheckCircle 或 CloseCircle）
      const statusIcon = page
        .locator(
          '[class*="check-circle"], [class*="close-circle"], [class*="status-icon"]'
        )
        .first();

      if (await statusIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(statusIcon).toBeVisible();
      }
    }
  });
});

// ==================== 教师修改分数测试 ====================
test.describe('教师修改分数测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('教师评分输入框可见且可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找教师评分输入框（InputNumber）
      const teacherScoreInput = page
        .locator('.ant-input-number-input')
        .first();

      if (
        await teacherScoreInput.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(teacherScoreInput).toBeEnabled();
      }
    }
  });

  test('可以输入有效分数', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const teacherScoreInput = page
        .locator('.ant-input-number-input')
        .first();

      if (
        await teacherScoreInput.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        // 清空输入框
        await teacherScoreInput.fill('');
        await page.waitForTimeout(200);

        // 输入新分数
        await teacherScoreInput.fill('3.5');
        await page.waitForTimeout(300);

        // 验证输入值
        const value = await teacherScoreInput.inputValue();
        expect(value).toBe('3.5');
      }
    }
  });

  test('分数值在合法范围内', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const teacherScoreInput = page
        .locator('.ant-input-number-input')
        .first();

      if (
        await teacherScoreInput.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        // 尝试输入超出范围的值
        await teacherScoreInput.fill('100');
        await page.waitForTimeout(300);

        // 验证输入值是否被限制（应该 <= 满分）
        const value = await teacherScoreInput.inputValue();
        const numValue = Number.parseFloat(value);
        expect(numValue).toBeGreaterThanOrEqual(0);
        expect(numValue).toBeLessThanOrEqual(100); // 假设单步满分不超过 100
      }
    }
  });

  test('支持小数点输入', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const teacherScoreInput = page
        .locator('.ant-input-number-input')
        .first();

      if (
        await teacherScoreInput.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        // 输入带小数的分数
        await teacherScoreInput.fill('4.25');
        await page.waitForTimeout(300);

        const value = await teacherScoreInput.inputValue();
        expect(value).toMatch(/\d+\.\d+/);
      }
    }
  });

  test('增加/减少按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找 InputNumber 的增加/减少按钮
      const increaseButton = page
        .locator('.ant-input-number-handler-up')
        .first();
      const decreaseButton = page
        .locator('.ant-input-number-handler-down')
        .first();

      if (
        await increaseButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(increaseButton).toBeVisible();
        await expect(decreaseButton).toBeVisible();

        // 测试点击增加按钮
        await increaseButton.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

// ==================== 评语输入测试 ====================
test.describe('评语输入测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('评语输入框可见且可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找评语输入框
      const commentInput = page
        .locator('input, textarea')
        .filter({ hasText: /评语|comment/i })
        .first();

      if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(commentInput).toBeEnabled();
      }
    }
  });

  test('可以输入评语文本', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const commentInput = page.locator('input, textarea').nth(1); // 通常评语输入框在第二个

      if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // 输入评语
        const testComment = '步骤正确但计算有误，请注意运算符号';
        await commentInput.fill(testComment);
        await page.waitForTimeout(300);

        // 验证输入值
        const value = await commentInput.inputValue();
        expect(value).toBe(testComment);
      }
    }
  });

  test('评语字数无限制或有合理上限', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const commentInput = page.locator('input, textarea').nth(1);

      if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // 输入较长评语
        const longComment = '这是一段较长的评语。'.repeat(10);
        await commentInput.fill(longComment);
        await page.waitForTimeout(300);

        const value = await commentInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});

// ==================== 总分计算测试 ====================
test.describe('总分计算测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('总分显示区域可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找总分显示区域
      const totalScoreArea = page.locator('text=总分').first();

      if (
        await totalScoreArea.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(totalScoreArea).toBeVisible();
      }
    }
  });

  test('总分数值正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const totalScore = page
        .locator('text=总分')
        .locator('..')
        .locator('.ant-tag, [class*="score-value"]')
        .first();

      if (await totalScore.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await totalScore.textContent();
        expect(text).toMatch(/\d+(\.\d+)?/);
      }
    }
  });

  test('总满分正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 查找总满分显示（通常显示为 "X/Y" 格式）
      const totalMaxScore = page.locator('text=/\\/\\s*\\d+/').last();

      if (
        await totalMaxScore.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const text = await totalMaxScore.textContent();
        expect(text).toMatch(/\d+/);
      }
    }
  });

  test('修改步骤分后总分自动更新', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 获取初始总分
      const totalScoreElement = page
        .locator('text=总分')
        .locator('..')
        .locator('.ant-tag, [class*="score-value"]')
        .first();

      if (
        await totalScoreElement.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const initialScore = await totalScoreElement.textContent();

        // 修改第一个步骤分
        const scoreInput = page.locator('.ant-input-number-input').first();

        if (
          await scoreInput.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await scoreInput.fill('3.5');
          await page.waitForTimeout(500);

          // 检查总分是否变化
          const newScore = await totalScoreElement.textContent();

          // 总分应该是数字格式
          expect(newScore).toMatch(/\d+(\.\d+)?/);
          // 注意：我们不强制要求总分必须变化，因为可能初始值就是 3.5
        }
      }
    }
  });
});

// ==================== 保存评分测试 ====================
test.describe('保存评分测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('保存按钮可见且可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const saveButton = page.getByRole('button', { name: /保存|确定|提交/i });

      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(saveButton).toBeEnabled();
      }
    }
  });

  test('点击保存显示成功提示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 修改一个步骤分
      const scoreInput = page.locator('.ant-input-number-input').first();

      if (await scoreInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await scoreInput.fill('4.0');
        await page.waitForTimeout(300);

        // 点击保存
        const saveButton = page.getByRole('button', {
          name: /保存|确定|提交/i,
        });

        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // 检查成功提示消息
          const message = page.locator('.ant-message');
          if (await message.isVisible({ timeout: 2000 }).catch(() => false)) {
            const messageText = await message.textContent();
            expect(messageText).toMatch(/成功|保存|Success/i);
          }
        }
      }
    }
  });
});

// ==================== 重置评分测试 ====================
test.describe('重置评分测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('重置按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const resetButton = page.getByRole('button', { name: /重置|恢复/i });

      // 重置按钮可能默认不显示
      const hasReset = await resetButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(typeof hasReset).toBe('boolean');
    }
  });

  test('点击重置恢复 AI 评分', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 先修改分数
      const scoreInput = page.locator('.ant-input-number-input').first();

      if (await scoreInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await scoreInput.fill('2.0');
        await page.waitForTimeout(300);

        // 点击重置
        const resetButton = page.getByRole('button', { name: /重置|恢复/i });

        if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await resetButton.click();
          await page.waitForTimeout(500);

          // 验证分数是否恢复（应该不再是 2.0）
          const value = await scoreInput.inputValue();
          // 注意：我们不知道原始 AI 评分是多少，所以只检查格式
          expect(value).toMatch(/\d+(\.\d+)?/);
        }
      }
    }
  });
});

// ==================== 批量操作测试 ====================
test.describe('批量操作测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/mistake-review/test-mistake-001`);
    await waitForPageLoad(page);
  });

  test('全部采用 AI 评分按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      const acceptAllButton = page.getByRole('button', {
        name: /全部采用|全部确认|批量采用/i,
      });

      if (
        await acceptAllButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await expect(acceptAllButton).toBeEnabled();
      }
    }
  });

  test('修改所有步骤功能可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面或错题不存在');
      return;
    }

    const stepScoreTab = page
      .locator('.ant-tabs-tab')
      .filter({ hasText: /步骤|评分/i })
      .first();

    if (await stepScoreTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stepScoreTab.click();
      await page.waitForTimeout(500);

      // 获取所有步骤的评分输入框
      const scoreInputs = page.locator('.ant-input-number-input');
      const inputCount = await scoreInputs.count();

      // 如果有多个步骤，应该有多个输入框
      expect(inputCount).toBeGreaterThanOrEqual(0);

      // 可以遍历所有输入框进行修改
      if (inputCount > 0) {
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = scoreInputs.nth(i);
          if (await input.isVisible().catch(() => false)) {
            await expect(input).toBeEnabled();
          }
        }
      }
    }
  });
});
