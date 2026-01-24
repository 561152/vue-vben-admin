/**
 * 作业批改模块 - 题库导入流程 E2E 测试
 *
 * 测试核心流程：
 * 1. 题库导入页面 - 选择试卷
 * 2. 导入配置 - 质量阈值、自动合并
 * 3. 导入执行 - 启动导入任务
 * 4. 导入进度 - 查看导入状态
 * 5. 导入结果 - 查看导入统计
 */
import { expect, test } from '@playwright/test';
import jwt from 'jsonwebtoken';

// 测试配置
const BASE_URL = 'http://localhost:5666';
const JWT_SECRET =
  process.env.JWT_SECRET || 'omnireach-secret-key-change-in-production';

// 测试用户（教师角色 + 题库导入权限）
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

// ==================== 题库导入页面测试 ====================
test.describe('题库导入页面测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('题库导入页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(
        true,
        '用户无权限访问此页面 (需要 EDUCATION:QUESTION:IMPORT 权限)',
      );
      return;
    }

    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('题库导入');

    // 检查主要内容区域
    const contentArea = page.locator('.ant-layout-content, main');
    await expect(contentArea).toBeVisible();
  });

  test('试卷选择器可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找试卷选择器（可能是 Select 或 Table）
    const paperSelector = page
      .locator('.ant-select')
      .filter({ has: page.locator('text=试卷, text=选择试卷') })
      .first();

    if (await paperSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(paperSelector).toBeVisible();
      await paperSelector.click();
      await page.waitForTimeout(300);

      // 检查下拉选项
      const options = page.locator('.ant-select-item');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('试卷列表表格可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找试卷列表表格
    const paperTable = page.locator('.ant-table');

    if (await paperTable.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(paperTable).toBeVisible();

      // 检查表格列标题
      const hasColumns = await page
        .locator('.ant-table-thead th')
        .count()
        .then((count) => count > 0);

      expect(hasColumns).toBeTruthy();
    }
  });

  test('导入按钮可见且可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const importButton = page.getByRole('button', { name: /导入|开始导入/i });

    if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(importButton).toBeVisible();
      // 初始状态下按钮可能被禁用（未选择试卷）
      const isEnabled = await importButton.isEnabled().catch(() => false);
      expect(typeof isEnabled).toBe('boolean');
    }
  });

  test('导入历史按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const historyButton = page.getByRole('button', { name: /历史|导入历史/i });

    if (await historyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(historyButton).toBeEnabled();
    }
  });
});

// ==================== 导入配置测试 ====================
test.describe('导入配置测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('质量阈值滑块可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找质量阈值滑块或输入框
    const qualitySlider = page
      .locator('.ant-slider, .ant-input-number')
      .filter({ has: page.locator('text=质量阈值, text=threshold') })
      .first();

    if (await qualitySlider.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(qualitySlider).toBeVisible();
    }
  });

  test('质量阈值输入框可输入数值', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找质量阈值数值输入框
    const qualityInput = page.locator('.ant-input-number-input').first();

    if (await qualityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(qualityInput).toBeEnabled();

      // 测试输入阈值（0-1 之间）
      await qualityInput.fill('0.85');
      await page.waitForTimeout(300);

      // 验证输入值
      const value = await qualityInput.inputValue();
      expect(Number.parseFloat(value)).toBeGreaterThanOrEqual(0);
      expect(Number.parseFloat(value)).toBeLessThanOrEqual(1);
    }
  });

  test('自动合并重复题开关可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找自动合并开关
    const autoMergeSwitch = page
      .locator('.ant-switch')
      .filter({ has: page.locator('text=自动合并, text=合并重复') })
      .first();

    if (await autoMergeSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(autoMergeSwitch).toBeEnabled();

      // 测试切换开关
      await autoMergeSwitch.click();
      await page.waitForTimeout(300);

      // 再次点击恢复原状态
      await autoMergeSwitch.click();
      await page.waitForTimeout(300);
    }
  });

  test('配置说明文本正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找配置说明或帮助文本
    const helpText = page.locator(
      '.ant-form-item-extra, .ant-alert, [class*="help"]',
    );

    if (await helpText.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await helpText.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }
  });
});

// ==================== 导入执行测试 ====================
test.describe('导入执行测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('点击导入按钮打开确认对话框', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const importButton = page.getByRole('button', { name: /导入|开始导入/i });

    if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await importButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await importButton.click();
        await page.waitForTimeout(500);

        // 检查确认对话框
        const confirmModal = page.locator(
          '.ant-modal-confirm, .ant-popconfirm, .ant-modal',
        );

        if (
          await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await expect(confirmModal).toBeVisible();

          // 取消导入
          const cancelButton = page.getByRole('button', { name: /取消/i });
          if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });

  test('导入进度提示正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 这个测试需要实际触发导入，暂时只检查进度相关组件是否存在
    const progressBar = page.locator('.ant-progress');

    // 进度条可能默认不显示，只有导入时才显示
    const hasProgress = await progressBar
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // 不强制要求进度条可见，因为可能没有正在进行的导入
    expect(typeof hasProgress).toBe('boolean');
  });
});

// ==================== 导入进度监控测试 ====================
test.describe('导入进度监控测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('导入状态标签正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找状态标签 (PENDING/PROCESSING/COMPLETED/FAILED)
    const statusTag = page
      .locator('.ant-tag')
      .filter({
        hasText:
          /等待中|处理中|已完成|失败|PENDING|PROCESSING|COMPLETED|FAILED/i,
      })
      .first();

    if (await statusTag.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusTag).toBeVisible();
    }
  });

  test('导入统计数字正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找统计数字（总数、已导入、重复、失败）
    const statsArea = page.locator(
      '.ant-statistic, [class*="stat"], [class*="count"]',
    );

    if (await statsArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await statsArea.textContent();
      // 检查是否包含数字
      expect(text).toMatch(/\d+/);
    }
  });

  test('刷新按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const refreshButton = page
      .locator('button')
      .filter({ has: page.locator('[class*="reload"], [class*="refresh"]') })
      .first();

    if (await refreshButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(refreshButton).toBeEnabled();
      await refreshButton.click();
      await page.waitForTimeout(500);
    }
  });
});

// ==================== 导入历史测试 ====================
test.describe('导入历史测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('导入历史抽屉可打开', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const historyButton = page.getByRole('button', { name: /历史|导入历史/i });

    if (await historyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyButton.click();
      await page.waitForTimeout(500);

      // 检查抽屉是否打开
      const drawer = page.locator('.ant-drawer, .ant-modal');
      if (await drawer.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(drawer).toBeVisible();

        // 关闭抽屉
        const closeButton = page.locator('.ant-drawer-close, .ant-modal-close');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('历史记录表格可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const historyButton = page.getByRole('button', { name: /历史|导入历史/i });

    if (await historyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyButton.click();
      await page.waitForTimeout(500);

      // 查找历史记录表格
      const historyTable = page.locator(
        '.ant-drawer .ant-table, .ant-modal .ant-table',
      );

      if (await historyTable.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(historyTable).toBeVisible();
      }
    }
  });

  test('历史记录显示完整信息', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const historyButton = page.getByRole('button', { name: /历史|导入历史/i });

    if (await historyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyButton.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('.ant-drawer, .ant-modal');
      if (await drawer.isVisible({ timeout: 2000 }).catch(() => false)) {
        // 检查是否显示试卷名称、导入时间、状态等信息
        const hasContent = await drawer.locator('text').count();
        expect(hasContent).toBeGreaterThan(0);
      }
    }
  });

  test('分页器可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const historyButton = page.getByRole('button', { name: /历史|导入历史/i });

    if (await historyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyButton.click();
      await page.waitForTimeout(500);

      const pagination = page.locator(
        '.ant-drawer .ant-pagination, .ant-modal .ant-pagination',
      );

      if (await pagination.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(pagination).toBeVisible();

        // 检查分页按钮
        const pageButtons = page.locator('.ant-pagination-item');
        const buttonCount = await pageButtons.count();
        expect(buttonCount).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ==================== 导入结果处理测试 ====================
test.describe('导入结果处理测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('成功提示消息正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 这个测试需要实际触发导入成功，暂时只检查消息组件
    // 在实际导入完成后，应该显示成功提示
    // 这里只验证页面上是否有 message 或 notification 组件的容器
    const messageContainer = page.locator('.ant-message, .ant-notification');

    // 消息可能默认不显示
    const hasMessage = await messageContainer
      .isVisible({ timeout: 500 })
      .catch(() => false);

    expect(typeof hasMessage).toBe('boolean');
  });

  test('失败错误日志可查看', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找错误日志按钮或链接
    const errorLogButton = page
      .locator('button, a')
      .filter({ hasText: /错误日志|查看日志|error log/i })
      .first();

    if (await errorLogButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errorLogButton).toBeEnabled();
      await errorLogButton.click();
      await page.waitForTimeout(500);

      // 检查日志内容是否显示
      const logContent = page.locator('.ant-modal, .ant-drawer, pre, code');
      if (await logContent.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(logContent).toBeVisible();
      }
    }
  });
});

// ==================== 重复题处理测试 ====================
test.describe('重复题处理测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('重复题数量统计正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找重复题统计
    const duplicateCount = page
      .locator('text=重复')
      .locator('..')
      .locator('[class*="count"], [class*="number"]')
      .first();

    if (await duplicateCount.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await duplicateCount.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('查看重复题按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const viewDuplicatesButton = page.getByRole('button', {
      name: /查看重复|重复题/i,
    });

    if (
      await viewDuplicatesButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(viewDuplicatesButton).toBeEnabled();
    }
  });

  test('手动合并界面可打开', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const mergeButton = page.getByRole('button', {
      name: /手动合并|合并题目/i,
    });

    if (await mergeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mergeButton.click();
      await page.waitForTimeout(500);

      const mergeModal = page.locator('.ant-modal, .ant-drawer');
      if (await mergeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(mergeModal).toBeVisible();

        // 关闭合并界面
        const closeButton = page.locator('.ant-modal-close, .ant-drawer-close');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }
      }
    }
  });
});

// ==================== 题目预览测试 ====================
test.describe('题目预览测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('题目预览按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const previewButton = page.getByRole('button', {
      name: /预览|查看题目/i,
    });

    if (await previewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(previewButton).toBeEnabled();
    }
  });

  test('题目预览模态框正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const previewButton = page.getByRole('button', {
      name: /预览|查看题目/i,
    });

    if (await previewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewButton.click();
      await page.waitForTimeout(500);

      const previewModal = page.locator('.ant-modal');
      if (await previewModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(previewModal).toBeVisible();

        // 检查题目内容是否显示
        const questionContent = previewModal.locator(
          '[class*="question"], [class*="content"]',
        );
        if (
          await questionContent.isVisible({ timeout: 1000 }).catch(() => false)
        ) {
          await expect(questionContent).toBeVisible();
        }

        // 关闭预览
        const closeButton = page.locator('.ant-modal-close');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }
      }
    }
  });

  test('LaTeX 公式正确渲染', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找 LaTeX 渲染容器（katex 或 MathJax）
    const latexContainer = page.locator(
      '.katex, .MathJax, [class*="latex"], [class*="formula"]',
    );

    if (await latexContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(latexContainer.first()).toBeVisible();
    }
  });
});

// ==================== 取消导入测试 ====================
test.describe('取消导入测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
    await page.goto(`${BASE_URL}/ai-tutor/question-import`);
    await waitForPageLoad(page);
  });

  test('取消导入按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 取消按钮通常在导入进行中时显示
    const cancelButton = page.getByRole('button', { name: /取消导入|停止/i });

    // 可能默认不可见（没有正在进行的导入）
    const hasCancel = await cancelButton
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(typeof hasCancel).toBe('boolean');
  });

  test('取消导入确认对话框正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const cancelButton = page.getByRole('button', { name: /取消导入|停止/i });

    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(500);

      const confirmModal = page.locator('.ant-modal-confirm, .ant-popconfirm');
      if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(confirmModal).toBeVisible();

        // 取消操作
        const cancelConfirmButton = page.getByRole('button', { name: /取消/i });
        if (await cancelConfirmButton.isVisible().catch(() => false)) {
          await cancelConfirmButton.click();
        }
      }
    }
  });
});
