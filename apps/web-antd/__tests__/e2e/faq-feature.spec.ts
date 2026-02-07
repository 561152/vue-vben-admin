import { test, expect } from '@playwright/test';

/**
 * Phase 4 Task #2: 家长咨询增强 - FAQ功能 E2E Tests
 *
 * 测试常见问题(FAQ)系统的完整功能
 */

test.describe('FAQ功能 - 基础功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // 导航到FAQ页面
    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载FAQ页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=常见问题 (FAQ)')).toBeVisible();

    // 验证搜索栏存在
    await expect(page.locator('input[placeholder*="搜索常见问题"]')).toBeVisible();

    // 验证分类标签存在
    await expect(page.locator('.category-tag')).toHaveCount(9); // 8个分类 + "全部"
  });

  test('应该显示热门问题', async ({ page }) => {
    // 验证热门问题卡片存在
    await expect(page.locator('text=🔥 热门问题')).toBeVisible();

    // 验证至少有1个热门问题
    const popularItems = page.locator('.faq-item');
    await expect(popularItems.first()).toBeVisible();

    // 验证热门问题有查看次数显示
    await expect(page.locator('text=次查看').first()).toBeVisible();
  });

  test('应该显示所有FAQ分类', async ({ page }) => {
    const categories = [
      '全部',
      '学习方法',
      '学习动机',
      '作业指导',
      '考试准备',
      '时间管理',
      '亲子沟通',
      '学科专项',
      '心理辅导',
    ];

    for (const category of categories) {
      await expect(page.locator(`.category-tag:has-text("${category}")`)).toBeVisible();
    }
  });
});

test.describe('FAQ功能 - 搜索功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够搜索FAQ', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索常见问题"]');
    const searchButton = page.locator('button:has-text("搜索")');

    // 输入搜索关键词
    await searchInput.fill('作业');
    await searchButton.click();

    // 等待搜索结果
    await page.waitForTimeout(1000);

    // 验证搜索结果显示
    await expect(page.locator('text=找到').first()).toBeVisible();
    await expect(page.locator('.ant-collapse-item').first()).toBeVisible();
  });

  test('搜索无结果时应该显示空状态', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索常见问题"]');
    const searchButton = page.locator('button:has-text("搜索")');

    // 搜索不存在的关键词
    await searchInput.fill('xyzabc123456');
    await searchButton.click();

    // 等待搜索完成
    await page.waitForTimeout(1000);

    // 验证空状态
    await expect(page.locator('text=没有找到相关问题')).toBeVisible();
    await expect(page.locator('text=咨询 AI 咨询师')).toBeVisible();
  });

  test('应该能够清空搜索', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索常见问题"]');
    const searchButton = page.locator('button:has-text("搜索")');

    // 搜索
    await searchInput.fill('作业');
    await searchButton.click();
    await page.waitForTimeout(1000);

    // 清空搜索（假设有清空按钮）
    const clearButton = page.locator('.ant-input-clear-icon');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // 验证恢复到初始状态（显示热门问题）
      await expect(page.locator('text=🔥 热门问题')).toBeVisible();
    }
  });

  test('应该能够使用回车键搜索', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索常见问题"]');

    // 输入搜索关键词并按回车
    await searchInput.fill('考试');
    await searchInput.press('Enter');

    // 等待搜索结果
    await page.waitForTimeout(1000);

    // 验证搜索结果
    await expect(page.locator('text=找到').first()).toBeVisible();
  });
});

test.describe('FAQ功能 - 分类筛选', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够按分类筛选FAQ', async ({ page }) => {
    // 点击"学习方法"分类
    await page.click('.category-tag:has-text("学习方法")');

    // 等待加载
    await page.waitForTimeout(1000);

    // 验证显示筛选结果
    await expect(page.locator('text=找到').first()).toBeVisible();

    // 验证分类标签高亮（蓝色）
    const learningMethodTag = page.locator('.category-tag:has-text("学习方法")');
    await expect(learningMethodTag).toHaveClass(/ant-tag-blue/);
  });

  test('点击"全部"应该清除分类筛选', async ({ page }) => {
    // 先选择一个分类
    await page.click('.category-tag:has-text("学习方法")');
    await page.waitForTimeout(1000);

    // 点击"全部"
    await page.click('.category-tag:has-text("全部")');
    await page.waitForTimeout(500);

    // 验证恢复到初始状态
    await expect(page.locator('text=🔥 热门问题')).toBeVisible();

    // 验证"全部"标签高亮
    const allTag = page.locator('.category-tag:has-text("全部")');
    await expect(allTag).toHaveClass(/ant-tag-blue/);
  });

  test('应该能够切换不同分类', async ({ page }) => {
    // 选择"学习方法"
    await page.click('.category-tag:has-text("学习方法")');
    await page.waitForTimeout(1000);

    // 切换到"考试准备"
    await page.click('.category-tag:has-text("考试准备")');
    await page.waitForTimeout(1000);

    // 验证"考试准备"标签高亮
    const examTag = page.locator('.category-tag:has-text("考试准备")');
    await expect(examTag).toHaveClass(/ant-tag-blue/);
  });

  test('应该显示筛选结果数量', async ({ page }) => {
    // 选择一个分类
    await page.click('.category-tag:has-text("学习方法")');
    await page.waitForTimeout(1000);

    // 验证结果数量显示
    const resultsCount = page.locator('text=/找到.*个相关问题/');
    await expect(resultsCount).toBeVisible();
  });
});

test.describe('FAQ功能 - FAQ详情和交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够点击热门问题查看详情', async ({ page }) => {
    // 点击第一个热门问题
    const firstFAQ = page.locator('.faq-item').first();
    await firstFAQ.click();

    // 等待内容展开
    await page.waitForTimeout(1000);

    // 验证答案显示
    await expect(page.locator('.ant-collapse-content-active').first()).toBeVisible();
  });

  test('应该能够展开和收起FAQ答案', async ({ page }) => {
    // 搜索一个FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    const firstPanel = page.locator('.ant-collapse-item').first();

    // 展开
    await firstPanel.locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);
    await expect(firstPanel.locator('.ant-collapse-content-active')).toBeVisible();

    // 收起
    await firstPanel.locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);
    await expect(firstPanel.locator('.ant-collapse-content-active')).not.toBeVisible();
  });

  test('FAQ答案应该显示完整信息', async ({ page }) => {
    // 搜索并展开一个FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    const firstPanel = page.locator('.ant-collapse-item').first();
    await firstPanel.locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);

    // 验证答案区域包含必要元素
    const answerArea = firstPanel.locator('.faq-answer');
    await expect(answerArea.locator('.ant-alert')).toBeVisible(); // 答案内容
    await expect(answerArea.locator('text=这个回答有帮助吗')).toBeVisible(); // 反馈区域
  });

  test('应该能够提交"有帮助"反馈', async ({ page }) => {
    // 搜索并展开FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    await page.locator('.ant-collapse-item').first().locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);

    // 点击"有帮助"按钮
    const helpfulButton = page.locator('button:has-text("有帮助")').first();
    await helpfulButton.click();

    // 验证反馈提示
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=感谢您的反馈')).toBeVisible();

    // 验证按钮状态变化（高亮）
    await expect(helpfulButton).toHaveClass(/feedback-active/);
  });

  test('应该能够提交"没帮助"反馈', async ({ page }) => {
    // 搜索并展开FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    await page.locator('.ant-collapse-item').first().locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);

    // 点击"没帮助"按钮
    const notHelpfulButton = page.locator('button:has-text("没帮助")').first();
    await notHelpfulButton.click();

    // 验证反馈提示
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=我们会改进')).toBeVisible();
  });

  test('应该显示相关问题链接', async ({ page }) => {
    // 搜索并展开FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    await page.locator('.ant-collapse-item').first().locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);

    // 查找相关问题区域
    const relatedSection = page.locator('.related-questions');

    // 如果有相关问题，验证可点击
    if (await relatedSection.isVisible()) {
      await expect(relatedSection.locator('button[type="link"]').first()).toBeVisible();
    }
  });

  test('应该能够点击相关问题跳转', async ({ page }) => {
    // 搜索并展开FAQ
    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    await page.locator('.ant-collapse-item').first().locator('.ant-collapse-header').click();
    await page.waitForTimeout(500);

    // 如果有相关问题链接，点击它
    const relatedLink = page.locator('.related-questions button[type="link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();
      await page.waitForTimeout(1000);

      // 验证相关问题已展开
      await expect(page.locator('.ant-collapse-content-active')).toBeVisible();
    }
  });
});

test.describe('FAQ功能 - 与咨询师集成', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('咨询师页面应该有FAQ入口按钮', async ({ page }) => {
    // 导航到咨询师页面
    await page.goto('/ai-doctor/counselor');
    await page.waitForLoadState('networkidle');

    // 验证FAQ按钮存在
    const faqButton = page.locator('button[title="常见问题"]');
    await expect(faqButton).toBeVisible();
  });

  test('应该能够从咨询师页面跳转到FAQ', async ({ page }) => {
    await page.goto('/ai-doctor/counselor');
    await page.waitForLoadState('networkidle');

    // 点击FAQ按钮
    const faqButton = page.locator('button[title="常见问题"]');
    await faqButton.click();

    // 验证跳转到FAQ页面
    await expect(page).toHaveURL('/ai-doctor/counselor/faq');
    await expect(page.locator('text=常见问题 (FAQ)')).toBeVisible();
  });

  test('会话设置区域应该显示FAQ快速链接', async ({ page }) => {
    await page.goto('/ai-doctor/counselor');
    await page.waitForLoadState('networkidle');

    // 验证快速链接存在（如果未开始会话）
    const faqTip = page.locator('.faq-tip');
    if (await faqTip.isVisible()) {
      await expect(faqTip.locator('text=查看常见问题')).toBeVisible();

      // 点击快速链接
      await faqTip.locator('a:has-text("查看常见问题")').click();

      // 验证跳转到FAQ页面
      await expect(page).toHaveURL('/ai-doctor/counselor/faq');
    }
  });

  test('FAQ页面空状态应该能跳转回咨询师', async ({ page }) => {
    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');

    // 搜索不存在的内容以触发空状态
    await page.fill('input[placeholder*="搜索常见问题"]', 'xyzabc123456');
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);

    // 点击"咨询 AI 咨询师"按钮
    const consultButton = page.locator('button:has-text("咨询 AI 咨询师")');
    await consultButton.click();

    // 验证跳转回咨询师页面
    await expect(page).toHaveURL('/ai-doctor/counselor');
  });
});

test.describe('FAQ功能 - 性能和加载', () => {
  test('FAQ页面应该在合理时间内加载', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 记录加载时间
    const startTime = Date.now();

    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // 验证加载时间 < 3秒
    expect(loadTime).toBeLessThan(3000);

    // 验证内容已加载
    await expect(page.locator('text=常见问题 (FAQ)')).toBeVisible();
    await expect(page.locator('.category-tag')).toHaveCount(9);
  });

  test('搜索响应应该及时', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ai-doctor/counselor/faq');
    await page.waitForLoadState('networkidle');

    // 记录搜索响应时间
    const startTime = Date.now();

    await page.fill('input[placeholder*="搜索常见问题"]', '作业');
    await page.click('button:has-text("搜索")');

    // 等待搜索结果
    await page.waitForSelector('text=找到', { timeout: 2000 });

    const searchTime = Date.now() - startTime;

    // 验证搜索时间 < 2秒
    expect(searchTime).toBeLessThan(2000);
  });
});
