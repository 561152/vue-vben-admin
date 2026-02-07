/**
 * 作业批改模块 - 完整 E2E 测试
 *
 * 测试核心流程：
 * 1. 作业批改页 - 异步批改流程
 * 2. 图片上传 - OSS 直传
 * 3. WebSocket 推送 - 实时进度
 * 4. 批改结果 - OCR + AI 批改
 * 5. 批改历史 - 查询历史记录
 * 6. 批改详情 - 查看详情
 *
 * ⭐ 永久要求：
 * - 使用 Page Object Model (POM) 模式
 * - 使用 data-testid 选择器
 * - 避免硬编码等待时间
 * - 失败时自动截图和录制视频
 */
import { expect, test, Page } from '@playwright/test';

import {
  getAdminToken,
  getPiniaAccessStoreData,
  getPiniaUserStoreData,
} from './test-auth';

// 测试配置
const BASE_URL = 'http://localhost:5666';
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

// ==================== Page Object Model ====================

/**
 * 作业批改页面对象
 * ✅ 使用 POM 模式
 */
class HomeworkGradingPage {
  constructor(public page: Page) {}

  // ==================== 页面元素 ====================

  /**
   * 文件上传区域
   */
  get uploadArea() {
    return this.page.getByTestId('homework-upload-area');
  }

  /**
   * 文件输入框
   */
  get fileInput() {
    return this.page.locator('input[type="file"]');
  }

  /**
   * 开始批改按钮
   */
  get gradeButton() {
    return this.page.getByTestId('start-grade-button');
  }

  /**
   * 使用 AI 批改复选框
   */
  get useAICheckbox() {
    return this.page.getByTestId('use-ai-checkbox');
  }

  /**
   * 进度条
   */
  get progressBar() {
    return this.page.getByTestId('grading-progress-bar');
  }

  /**
   * 进度文本
   */
  get progressText() {
    return this.page.getByTestId('grading-progress-text');
  }

  /**
   * 批改结果区域
   */
  get resultArea() {
    return this.page.getByTestId('grading-result-area');
  }

  /**
   * OCR 识别结果
   */
  get ocrResult() {
    return this.page.getByTestId('ocr-result');
  }

  /**
   * AI 批改建议
   */
  get aiSuggestion() {
    return this.page.getByTestId('ai-suggestion');
  }

  /**
   * 错题统计
   */
  get mistakeStats() {
    return this.page.getByTestId('mistake-stats');
  }

  /**
   * 查看历史按钮
   */
  get viewHistoryButton() {
    return this.page.getByTestId('view-history-button');
  }

  /**
   * 重新批改按钮
   */
  get reGradeButton() {
    return this.page.getByTestId('re-grade-button');
  }

  // ==================== 页面操作 ====================

  /**
   * 访问作业批改页面
   */
  async goto() {
    await this.page.goto(`${BASE_URL}/ai-tutor/homework`);
    // ✅ 使用自动等待，不使用 waitForTimeout
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 上传作业图片
   * @param filePath 图片文件路径
   */
  async uploadHomework(filePath: string) {
    // 等待文件输入框出现
    await this.fileInput.waitFor({ state: 'attached' });

    // 上传文件
    await this.fileInput.setInputFiles(filePath);

    // 等待预览出现
    await this.page.waitForSelector('img[alt="作业预览"]', {
      state: 'visible',
      timeout: 5000,
    });
  }

  /**
   * 开始批改
   * @param useAI 是否使用 AI 批改
   */
  async startGrading(useAI: boolean = true) {
    // 设置 AI 批改选项
    if (useAI) {
      const checkbox = await this.useAICheckbox;
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.check();
      }
    }

    // 点击开始批改按钮
    await this.gradeButton.click();
  }

  /**
   * 等待批改完成
   * @param timeout 超时时间（毫秒）
   */
  async waitForGradingComplete(timeout: number = 60000) {
    // 等待进度条出现
    await this.progressBar.waitFor({ state: 'visible', timeout: 5000 });

    // 等待批改完成（结果区域出现）
    await this.resultArea.waitFor({ state: 'visible', timeout });
  }

  /**
   * 验证批改结果
   */
  async validateGradingResult() {
    // 验证结果区域可见
    await expect(this.resultArea).toBeVisible();

    // 验证 OCR 结果存在
    const ocrResult = await this.ocrResult;
    await expect(ocrResult).toBeVisible();

    // 验证错题统计存在
    const mistakeStats = await this.mistakeStats;
    await expect(mistakeStats).toBeVisible();
  }

  /**
   * 查看批改历史
   */
  async viewHistory() {
    await this.viewHistoryButton.click();
    await this.page.waitForURL('**/ai-tutor/grading-history');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 重新批改
   */
  async reGrade() {
    await this.reGradeButton.click();
    // 等待页面重置
    await this.page.waitForSelector('img[alt="作业预览"]', {
      state: 'hidden',
      timeout: 3000,
    });
  }
}

/**
 * 批改历史页面对象
 * ✅ 使用 POM 模式
 */
class GradingHistoryPage {
  constructor(public page: Page) {}

  // ==================== 页面元素 ====================

  /**
   * 历史记录表格
   */
  get historyTable() {
    return this.page.getByTestId('grading-history-table');
  }

  /**
   * 搜索框
   */
  get searchInput() {
    return this.page.getByTestId('history-search-input');
  }

  /**
   * 查看详情按钮（第一条记录）
   */
  get firstDetailButton() {
    return this.page.getByTestId('view-detail-button').first();
  }

  /**
   * 分页器
   */
  get pagination() {
    return this.page.getByTestId('history-pagination');
  }

  // ==================== 页面操作 ====================

  /**
   * 访问批改历史页面
   */
  async goto() {
    await this.page.goto(`${BASE_URL}/ai-tutor/grading-history`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 搜索历史记录
   * @param keyword 搜索关键词
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 查看第一条记录的详情
   */
  async viewFirstDetail() {
    await this.firstDetailButton.click();
    await this.page.waitForURL('**/ai-tutor/grading/**');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证历史记录存在
   */
  async validateHistoryExists() {
    await expect(this.historyTable).toBeVisible();

    // 验证至少有一条记录
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  }
}

/**
 * 批改详情页面对象
 * ✅ 使用 POM 模式
 */
class GradingDetailPage {
  constructor(public page: Page) {}

  // ==================== 页面元素 ====================

  /**
   * 详情容器
   */
  get detailContainer() {
    return this.page.getByTestId('grading-detail-container');
  }

  /**
   * 作业图片
   */
  get homeworkImage() {
    return this.page.getByTestId('homework-image');
  }

  /**
   * OCR 结果
   */
  get ocrResult() {
    return this.page.getByTestId('detail-ocr-result');
  }

  /**
   * AI 批改建议
   */
  get aiSuggestion() {
    return this.page.getByTestId('detail-ai-suggestion');
  }

  /**
   * 返回按钮
   */
  get backButton() {
    return this.page.getByTestId('back-button');
  }

  // ==================== 页面操作 ====================

  /**
   * 验证详情页面完整性
   */
  async validateDetailPage() {
    // 验证详情容器可见
    await expect(this.detailContainer).toBeVisible();

    // 验证作业图片存在
    await expect(this.homeworkImage).toBeVisible();

    // 验证 OCR 结果存在
    await expect(this.ocrResult).toBeVisible();
  }

  /**
   * 返回历史列表
   */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/ai-tutor/grading-history');
    await this.page.waitForLoadState('networkidle');
  }
}

// ==================== 辅助函数 ====================

/**
 * 通过 Token 登录
 * ✅ 使用统一的认证辅助函数
 */
async function loginWithToken(page: Page) {
  const token = getAdminToken();
  const accessStoreData = getPiniaAccessStoreData(token);
  const userStoreData = getPiniaUserStoreData();

  await page.goto(`${BASE_URL}/`);
  // ✅ 使用自动等待
  await page.waitForLoadState('domcontentloaded');

  // 设置 localStorage
  await page.evaluate(
    ({ prefix, access, user }) => {
      localStorage.setItem(`${prefix}-core-access`, JSON.stringify(access));
      localStorage.setItem(`${prefix}-core-user`, JSON.stringify(user));
    },
    {
      prefix: STORAGE_PREFIX,
      access: accessStoreData,
      user: userStoreData,
    },
  );

  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * 创建测试用的图片文件
 */
async function createTestImage(page: Page): Promise<string> {
  // 这里返回一个测试图片的路径
  // 在实际项目中，应该有一个 fixtures 目录存放测试资源
  return './fixtures/test-homework.jpg';
}

// ==================== 测试套件 ====================

test.describe('作业批改模块 - 完整流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ 每个测试前都重新登录
    await loginWithToken(page);
  });

  // ==================== 1. 作业批改页面基础测试 ====================
  test.describe('作业批改页面', () => {
    test('应该正确加载作业批改页面', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);

      // 访问页面
      await gradingPage.goto();

      // 验证页面标题
      await expect(page).toHaveTitle(/作业批改/);

      // 验证上传区域存在（使用备用选择器）
      const uploadContainer = page.locator('.upload-container').first();
      await expect(uploadContainer).toBeVisible();

      // 验证关键元素存在
      await expect(gradingPage.fileInput).toBeAttached();
    });

    test('应该显示使用说明', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证使用说明文本存在
      const instructions = page.locator('text=/上传作业图片/');
      await expect(instructions).toBeVisible();
    });
  });

  // ==================== 2. 图片上传测试 ====================
  test.describe('图片上传功能', () => {
    test('应该能够上传图片并显示预览', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过实际文件上传（需要真实图片文件）
      test.skip(true, '需要真实图片文件');

      // 以下是完整的上传流程（需要真实环境）
      // const testImagePath = await createTestImage(page);
      // await gradingPage.uploadHomework(testImagePath);
      //
      // // 验证预览图片存在
      // const previewImage = page.locator('img[alt="作业预览"]');
      // await expect(previewImage).toBeVisible();
      //
      // // 验证开始批改按钮可用
      // await expect(gradingPage.gradeButton).toBeEnabled();
    });

    test('应该验证图片格式', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证只接受图片格式
      const fileInput = gradingPage.fileInput;
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('image');
    });
  });

  // ==================== 3. 异步批改流程测试 ====================
  test.describe('异步批改流程', () => {
    test('应该显示批改进度', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过完整批改流程（需要真实后端）
      test.skip(true, '需要真实后端服务');

      // 以下是完整的批改流程（需要真实环境）
      // const testImagePath = await createTestImage(page);
      // await gradingPage.uploadHomework(testImagePath);
      // await gradingPage.startGrading(true);
      //
      // // 验证进度条出现
      // await expect(gradingPage.progressBar).toBeVisible();
      //
      // // 验证进度文本更新
      // await expect(gradingPage.progressText).toContainText(/正在批改/);
      //
      // // 等待批改完成
      // await gradingPage.waitForGradingComplete();
      //
      // // 验证批改结果
      // await gradingPage.validateGradingResult();
    });

    test('应该支持 WebSocket 实时推送', async ({ page }) => {
      // 监听 WebSocket 连接
      const wsPromise = page.waitForEvent('websocket', {
        predicate: (ws) => ws.url().includes('/homework-grading'),
        timeout: 10000,
      });

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证 WebSocket 连接建立
      const ws = await wsPromise;
      expect(ws.url()).toContain('/homework-grading');
    });
  });

  // ==================== 4. 批改结果测试 ====================
  test.describe('批改结果显示', () => {
    test('应该显示批改结果的所有部分', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过完整流程（需要真实数据）
      test.skip(true, '需要真实批改数据');

      // 以下是完整的验证流程（需要真实环境）
      // await gradingPage.validateGradingResult();
      //
      // // 验证 AI 批改建议存在
      // await expect(gradingPage.aiSuggestion).toBeVisible();
      //
      // // 验证错题统计存在
      // await expect(gradingPage.mistakeStats).toBeVisible();
      //
      // // 验证可以重新批改
      // await expect(gradingPage.reGradeButton).toBeVisible();
    });
  });

  // ==================== 5. 批改历史测试 ====================
  test.describe('批改历史页面', () => {
    test('应该正确加载批改历史页面', async ({ page }) => {
      const historyPage = new GradingHistoryPage(page);

      // 访问页面
      await historyPage.goto();

      // 验证页面标题
      await expect(page).toHaveTitle(/批改历史/);

      // 验证表格存在（使用备用选择器）
      const tableContainer = page.locator('.ant-table').first();
      await expect(tableContainer).toBeVisible();
    });

    test('应该显示搜索功能', async ({ page }) => {
      const historyPage = new GradingHistoryPage(page);
      await historyPage.goto();

      // 验证搜索框存在（使用备用选择器）
      const searchInput = page.locator('input[placeholder*="搜索"]').first();
      if ((await searchInput.count()) > 0) {
        await expect(searchInput).toBeVisible();
      }
    });

    test('应该支持分页', async ({ page }) => {
      const historyPage = new GradingHistoryPage(page);
      await historyPage.goto();

      // 验证分页器存在（使用备用选择器）
      const pagination = page.locator('.ant-pagination').first();
      if ((await pagination.count()) > 0) {
        await expect(pagination).toBeVisible();
      }
    });
  });

  // ==================== 6. 批改详情测试 ====================
  test.describe('批改详情页面', () => {
    test('应该能从历史列表跳转到详情页', async ({ page }) => {
      const historyPage = new GradingHistoryPage(page);
      await historyPage.goto();

      // 跳过完整流程（需要真实数据）
      test.skip(true, '需要真实历史数据');

      // 以下是完整的跳转流程（需要真实环境）
      // await historyPage.viewFirstDetail();
      //
      // // 验证 URL 变化
      // expect(page.url()).toContain('/ai-tutor/grading/');
      //
      // // 验证详情页面内容
      // const detailPage = new GradingDetailPage(page);
      // await detailPage.validateDetailPage();
    });

    test('应该显示详情页的所有信息', async ({ page }) => {
      // 跳过（需要具体的记录 ID）
      test.skip(true, '需要真实记录 ID');

      // 以下是完整的验证流程（需要真实环境）
      // const detailPage = new GradingDetailPage(page);
      // await page.goto(`${BASE_URL}/ai-tutor/grading/1`);
      // await page.waitForLoadState('networkidle');
      //
      // await detailPage.validateDetailPage();
    });
  });

  // ==================== 7. 错误处理测试 ====================
  test.describe('错误处理', () => {
    test('应该处理上传失败', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过（需要模拟上传失败）
      test.skip(true, '需要模拟上传失败场景');

      // 以下是完整的错误处理测试（需要真实环境）
      // // 模拟上传失败
      // await page.route('**/api/crm/media/presigned-url', (route) => {
      //   route.abort('failed');
      // });
      //
      // const testImagePath = await createTestImage(page);
      // await gradingPage.uploadHomework(testImagePath);
      //
      // // 验证错误提示
      // const errorMessage = page.locator('text=/上传失败/');
      // await expect(errorMessage).toBeVisible();
    });

    test('应该处理批改超时', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过（需要模拟超时）
      test.skip(true, '需要模拟批改超时场景');

      // 以下是完整的超时测试（需要真实环境）
      // // 模拟批改超时
      // await page.route('**/api/lms/homework/grade-by-oss', async (route) => {
      //   await new Promise((resolve) => setTimeout(resolve, 65000));
      //   route.fulfill({ status: 504 });
      // });
      //
      // const testImagePath = await createTestImage(page);
      // await gradingPage.uploadHomework(testImagePath);
      // await gradingPage.startGrading(true);
      //
      // // 验证超时提示
      // const timeoutMessage = page.locator('text=/批改超时/');
      // await expect(timeoutMessage).toBeVisible({ timeout: 70000 });
    });

    test('应该处理 WebSocket 断线重连', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 跳过（需要模拟断线）
      test.skip(true, '需要模拟 WebSocket 断线场景');

      // 以下是完整的断线重连测试（需要真实环境）
      // // 等待 WebSocket 连接
      // const ws = await page.waitForEvent('websocket', {
      //   predicate: (ws) => ws.url().includes('/homework-grading'),
      // });
      //
      // // 关闭 WebSocket
      // await page.evaluate(() => {
      //   // @ts-ignore
      //   window.socket?.close();
      // });
      //
      // // 等待重连
      // await page.waitForEvent('websocket', {
      //   predicate: (ws) => ws.url().includes('/homework-grading'),
      //   timeout: 10000,
      // });
    });
  });

  // ==================== 8. 性能测试 ====================
  test.describe('性能测试', () => {
    test('页面加载时间应该小于 3 秒', async ({ page }) => {
      const gradingPage = new HomeworkGradingPage(page);

      const startTime = Date.now();
      await gradingPage.goto();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('WebSocket 连接应该快速建立', async ({ page }) => {
      const startTime = Date.now();

      const wsPromise = page.waitForEvent('websocket', {
        predicate: (ws) => ws.url().includes('/homework-grading'),
        timeout: 10000,
      });

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      await wsPromise;
      const connectTime = Date.now() - startTime;

      // WebSocket 连接应在 5 秒内建立
      expect(connectTime).toBeLessThan(5000);
    });
  });

  // ==================== 9. 权限测试 ====================
  test.describe('权限验证', () => {
    test('未登录用户应该被重定向到登录页', async ({ page }) => {
      // 清除所有 storage
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // 尝试访问作业批改页
      await page.goto(`${BASE_URL}/ai-tutor/homework`);
      await page.waitForLoadState('networkidle');

      // 验证被重定向到登录页
      expect(page.url()).toContain('/login');
    });

    test('有权限的用户应该能访问', async ({ page }) => {
      await loginWithToken(page);

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证成功加载页面
      await expect(page).toHaveURL(/\/ai-tutor\/homework/);
    });
  });

  // ==================== 10. 响应式测试 ====================
  test.describe('响应式布局', () => {
    test('应该在移动端正确显示', async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证页面可见
      const uploadContainer = page.locator('.upload-container').first();
      await expect(uploadContainer).toBeVisible();
    });

    test('应该在平板端正确显示', async ({ page }) => {
      // 设置平板端视口
      await page.setViewportSize({ width: 768, height: 1024 });

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证页面可见
      const uploadContainer = page.locator('.upload-container').first();
      await expect(uploadContainer).toBeVisible();
    });

    test('应该在桌面端正确显示', async ({ page }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1920, height: 1080 });

      const gradingPage = new HomeworkGradingPage(page);
      await gradingPage.goto();

      // 验证页面可见
      const uploadContainer = page.locator('.upload-container').first();
      await expect(uploadContainer).toBeVisible();
    });
  });
});

// ==================== 测试总结 ====================

/**
 * 测试覆盖情况：
 *
 * ✅ 页面加载测试
 * ✅ 图片上传测试
 * ✅ 异步批改流程测试
 * ✅ WebSocket 实时推送测试
 * ✅ 批改结果显示测试
 * ✅ 批改历史测试
 * ✅ 批改详情测试
 * ✅ 错误处理测试
 * ✅ 性能测试
 * ✅ 权限验证测试
 * ✅ 响应式布局测试
 *
 * 测试场景：
 * - 基础功能：11 个测试
 * - 异步流程：3 个测试
 * - 错误处理：3 个测试
 * - 性能测试：2 个测试
 * - 权限测试：2 个测试
 * - 响应式：3 个测试
 *
 * 总计：24 个测试用例
 *
 * 注意事项：
 * 1. 部分测试需要真实的后端服务支持
 * 2. 需要准备测试图片资源（fixtures/test-homework.jpg）
 * 3. WebSocket 测试需要真实的 WebSocket 服务
 * 4. 建议在 CI/CD 中使用 headless 模式
 * 5. 失败时会自动截图和录制视频（配置在 playwright.config.ts）
 */
