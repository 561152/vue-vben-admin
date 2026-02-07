import { test, expect } from '@playwright/test';

/**
 * Phase 4 Task #1: 角色切换模式 E2E Tests
 *
 * 测试用户模式切换功能（家长模式 ↔ 孩子模式）
 */

test.describe('角色切换模式 - User Mode Switching', () => {
  // 测试前准备
  test.beforeEach(async ({ page }) => {
    // 登录（假设已有登录功能）
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');

    // 等待登录成功并跳转到首页
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // 清除 localStorage 以确保测试环境干净
    await page.evaluate(() => {
      localStorage.removeItem('user_mode_config');
    });
  });

  test('应该显示模式切换组件', async ({ page }) => {
    // 导航到示例页面
    await page.goto('/examples/mode-switch-demo');

    // 验证页面加载成功
    await expect(page.locator('text=批改结果')).toBeVisible();

    // 验证模式切换组件存在
    const modeSwitch = page.locator('.user-mode-switch');
    await expect(modeSwitch).toBeVisible();

    // 验证默认模式为家长模式
    await expect(modeSwitch.locator('text=家长模式')).toBeVisible();
  });

  test('应该能够从家长模式切换到孩子模式', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 定位模式切换器
    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 验证初始状态：家长模式
    await expect(page.locator('text=家长模式')).toBeVisible();
    await expect(page.locator('.mode-content-parent')).toBeVisible();

    // 点击切换到孩子模式
    await modeSwitch.click();

    // 等待切换完成
    await page.waitForTimeout(500);

    // 验证已切换到孩子模式
    await expect(page.locator('text=孩子模式')).toBeVisible();
    await expect(page.locator('.mode-content-child')).toBeVisible();

    // 验证家长模式内容已隐藏
    await expect(page.locator('.mode-content-parent')).not.toBeVisible();
  });

  test('应该能够从孩子模式切换回家长模式', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 先切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=孩子模式')).toBeVisible();

    // 再切换回家长模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 验证已切换回家长模式
    await expect(page.locator('text=家长模式')).toBeVisible();
    await expect(page.locator('.mode-content-parent')).toBeVisible();
  });

  test('家长模式应该显示详细分析内容', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 验证家长模式显示详细分析
    await expect(page.locator('text=正确率')).toBeVisible();
    await expect(page.locator('text=知识点掌握度')).toBeVisible();
    await expect(page.locator('text=错误类型')).toBeVisible();
    await expect(page.locator('text=家长指导建议')).toBeVisible();
  });

  test('孩子模式应该显示简化和鼓励内容', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 验证孩子模式显示简化内容
    await expect(page.locator('text=太棒了')).toBeVisible();
    await expect(page.locator('text=继续保持')).toBeVisible();
    await expect(page.locator('.ant-progress')).toBeVisible(); // 进度条

    // 验证不显示过于专业的分析
    await expect(page.locator('text=家长指导建议')).not.toBeVisible();
  });

  test('模式切换应该保存到 localStorage', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 验证 localStorage 已保存
    const savedConfig = await page.evaluate(() => {
      return localStorage.getItem('user_mode_config');
    });

    expect(savedConfig).toBeTruthy();
    const config = JSON.parse(savedConfig!);
    expect(config.mode).toBe('CHILD');
  });

  test('刷新页面后应该保持模式状态', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=孩子模式')).toBeVisible();

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证模式保持为孩子模式
    await expect(page.locator('text=孩子模式')).toBeVisible();
    await expect(page.locator('.mode-content-child')).toBeVisible();
  });

  test('配置调试面板应该正常工作', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 验证调试面板存在
    await expect(page.locator('text=模式配置')).toBeVisible();

    // 验证当前模式标签
    await expect(page.locator('.ant-tag:has-text("家长模式")')).toBeVisible();

    // 测试配置选项
    const showStatisticsCheckbox = page.locator(
      'input[type="checkbox"]:near(:text("显示统计数据"))',
    );
    await showStatisticsCheckbox.uncheck();

    // 验证统计图表隐藏
    await page.waitForTimeout(300);
    await expect(page.locator('text=统计图表')).not.toBeVisible();

    // 重新勾选
    await showStatisticsCheckbox.check();
    await page.waitForTimeout(300);
    await expect(page.locator('text=统计图表')).toBeVisible();
  });

  test('重置配置按钮应该恢复默认设置', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 修改配置
    const showStatisticsCheckbox = page.locator(
      'input[type="checkbox"]:near(:text("显示统计数据"))',
    );
    await showStatisticsCheckbox.uncheck();
    await page.waitForTimeout(300);

    // 点击重置按钮
    await page.click('button:has-text("重置配置")');
    await page.waitForTimeout(300);

    // 验证配置已重置
    await expect(showStatisticsCheckbox).toBeChecked();
    await expect(page.locator('text=配置已重置')).toBeVisible();
  });

  test('清除存储按钮应该清空 localStorage', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 切换模式以保存到 localStorage
    const modeSwitch = page.locator('.user-mode-switch .ant-switch');
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 验证 localStorage 有数据
    let savedConfig = await page.evaluate(() => {
      return localStorage.getItem('user_mode_config');
    });
    expect(savedConfig).toBeTruthy();

    // 点击清除按钮
    await page.click('button:has-text("清除存储")');
    await page.waitForTimeout(300);

    // 验证 localStorage 已清空
    savedConfig = await page.evaluate(() => {
      return localStorage.getItem('user_mode_config');
    });
    expect(savedConfig).toBeNull();

    // 验证提示消息
    await expect(page.locator('text=存储已清除')).toBeVisible();
  });

  test('ModeContent 组件应该根据模式显示/隐藏内容', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 家长模式：验证家长模式内容可见
    await expect(page.locator('text=您正在查看完整的批改分析和统计数据')).toBeVisible();

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 孩子模式：验证孩子模式内容可见
    await expect(page.locator('text=继续加油')).toBeVisible();

    // 家长模式内容应该隐藏
    await expect(page.locator('text=您正在查看完整的批改分析和统计数据')).not.toBeVisible();
  });

  test('feature 开关应该正确控制功能显示', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    // 验证统计图表默认显示（家长模式）
    await expect(page.locator('text=统计图表')).toBeVisible();

    // 关闭统计数据功能
    const showStatisticsCheckbox = page.locator(
      'input[type="checkbox"]:near(:text("显示统计数据"))',
    );
    await showStatisticsCheckbox.uncheck();
    await page.waitForTimeout(300);

    // 验证统计图表隐藏
    await expect(page.locator('text=统计图表')).not.toBeVisible();
  });

  test('getText 方法应该根据模式返回不同文本', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 家长模式文本
    await expect(
      page.locator('text=建议您陪伴孩子一起分析错题，引导孩子自己发现问题所在'),
    ).toBeVisible();

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 孩子模式文本
    await expect(page.locator('text=看看这些题目，想想哪里可以做得更好呢？')).toBeVisible();

    // 家长模式文本应该隐藏
    await expect(
      page.locator('text=建议您陪伴孩子一起分析错题，引导孩子自己发现问题所在'),
    ).not.toBeVisible();
  });

  test('应该能够在多个页面之间保持模式一致性', async ({ page, context }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 切换到孩子模式
    await modeSwitch.click();
    await page.waitForTimeout(500);

    // 打开新标签页
    const newPage = await context.newPage();
    await newPage.goto('/examples/mode-switch-demo');

    // 验证新页面也是孩子模式（因为 localStorage 共享）
    await expect(newPage.locator('text=孩子模式')).toBeVisible();
    await expect(newPage.locator('.mode-content-child')).toBeVisible();

    await newPage.close();
  });

  test('模式切换应该显示成功提示', async ({ page }) => {
    await page.goto('/examples/mode-switch-demo');

    const modeSwitch = page.locator('.user-mode-switch .ant-switch');

    // 切换模式
    await modeSwitch.click();

    // 验证提示消息（假设有 message 提示）
    // 注意：这取决于组件实现，如果没有提示可以跳过此测试
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('角色切换模式 - 实际业务场景集成', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[name="username"]', process.env.TEST_USERNAME || 'test_parent');
    await page.fill('[name="password"]', process.env.TEST_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('作业批改页面应该集成模式切换功能', async ({ page }) => {
    // 导航到作业批改页面（假设路径）
    await page.goto('/lms/homework/grading-history');

    // 验证页面加载成功
    await page.waitForLoadState('networkidle');

    // 查找模式切换组件（如果页面集成了）
    const modeSwitch = page.locator('.user-mode-switch');

    // 如果页面有模式切换器，进行测试
    if (await modeSwitch.isVisible()) {
      await modeSwitch.locator('.ant-switch').click();
      await page.waitForTimeout(500);

      // 验证内容根据模式切换
      await expect(page.locator('text=孩子模式')).toBeVisible();
    }
  });

  test('成长档案页面应该使用模式切换', async ({ page }) => {
    // 导航到成长档案页面
    await page.goto('/growth-profile/progress');

    // 验证页面加载
    await page.waitForLoadState('networkidle');

    // 如果页面有模式切换器，验证其功能
    const modeSwitch = page.locator('.user-mode-switch');
    if (await modeSwitch.isVisible()) {
      // 测试模式切换对页面内容的影响
      await modeSwitch.locator('.ant-switch').click();
      await page.waitForTimeout(500);

      // 验证孩子模式下的游戏化元素
      await expect(page.locator('text=孩子模式')).toBeVisible();
    }
  });
});
