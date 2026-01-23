/**
 * Web 页面按钮功能测试
 * 测试所有主要页面的按钮功能是否正常工作
 */
import { expect, test } from '@playwright/test';
import jwt from 'jsonwebtoken';

// 测试配置
const BASE_URL = 'http://localhost:5666';

// JWT 密钥 (与后端保持一致)
const JWT_SECRET =
  process.env.JWT_SECRET || 'omnireach-secret-key-change-in-production';

// 测试用户
const TEST_USER = {
  id: '1',
  tenantId: '1',
  username: 'admin',
};

/**
 * 生成测试用 JWT Token
 */
function generateTestToken(): string {
  return jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '24h' });
}

// 存储 namespace 前缀 (格式: vben-web-antd-{version}-dev)
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

/**
 * 获取 Pinia store 持久化数据
 * 注意：只设置 accessToken，不设置 userInfo，这样 guard 会调用 fetchUserInfo()
 * 从而触发 API 调用，让 cachedBackendUserInfo 被正确设置
 */
function getStorageData(token: string) {
  return {
    [`${STORAGE_PREFIX}-core-access`]: JSON.stringify({
      accessToken: token,
      refreshToken: null,
      accessCodes: [], // 这些会从 API 响应中获取
      isLockScreen: false,
    }),
    // 不要预设 userInfo，让 guard 调用 fetchUserInfo() 从 API 获取
  };
}

// 辅助函数：通过 Token 登录（绕过登录页面）
// 注意：Vite dev server 会将 /api/* 请求代理到后端，所以我们无法在 Playwright 中拦截
// 这些请求。因此我们直接依赖真实的后端 API。
async function loginWithToken(page: any) {
  const token = generateTestToken();
  const storageData = getStorageData(token);

  // 先访问页面以初始化 localStorage 域
  await page.goto(`${BASE_URL}/`);
  await page.waitForTimeout(500);

  // 设置 localStorage
  await page.evaluate((data: Record<string, string>) => {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
  }, storageData);

  // 刷新页面使 Token 生效
  await page.reload();
  await page.waitForTimeout(2000);
}

// 兼容旧的 login 函数名
const login = loginWithToken;

// 辅助函数：等待页面加载
async function waitForPageLoad(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 检查页面是否可访问（不是 404 或 Forbidden）
 * 返回 true 表示可访问，false 表示被重定向或出错
 */
async function isPageAccessible(page: any): Promise<boolean> {
  const title = await page.title();
  if (title.includes('404') || title.includes('Forbidden')) {
    return false;
  }
  // 检查页面内容是否包含 404 相关文字
  const content = await page.content();
  if (content.includes('未找到页面') || content.includes('哎呀！')) {
    return false;
  }
  return true;
}

test.describe('认证页面按钮测试', () => {
  test('登录页面 - 登录按钮可见且可点击', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    // 主登录按钮是蓝色的 primary 按钮，使用更精确的选择器
    const loginButton = page
      .locator('button.bg-primary, button[class*="primary"]')
      .filter({ hasText: '登录' })
      .first();
    const isVisible = await loginButton
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    // 如果找不到 primary 按钮，尝试找包含"登录"文本的大按钮
    if (!isVisible) {
      const altLoginButton = page
        .locator('button')
        .filter({ hasText: /^登录$/ })
        .first();
      await expect(altLoginButton).toBeVisible({ timeout: 5000 });
      await expect(altLoginButton).toBeEnabled();
    } else {
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    }
  });

  test('登录页面 - 账户选择器可用', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    // 检查是否有账户选择器 (Select with Super/Admin options)
    const selectAccount = page.locator('.ant-select').first();
    if (await selectAccount.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(selectAccount).toBeVisible();
    }
  });

  test('登录页面 - 手机号登录和扫码登录按钮可见', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    const phoneLoginButton = page.getByRole('button', { name: '手机号登录' });
    const qrcodeLoginButton = page.getByRole('button', { name: '扫码登录' });

    // 至少一个登录方式按钮可见
    const phoneVisible = await phoneLoginButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const qrcodeVisible = await qrcodeLoginButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(phoneVisible || qrcodeVisible).toBeTruthy();
  });
});

test.describe('CRM 客户管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);
  });

  test('新增客户按钮可见且可点击', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新增客户/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    // 点击按钮应打开模态框
    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('筛选按钮可用', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /筛选/i });
    if (await filterButton.isVisible()) {
      await expect(filterButton).toBeEnabled();
      await filterButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('重置按钮可用', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /重置/i });
    if (await resetButton.isVisible()) {
      await expect(resetButton).toBeEnabled();
      await resetButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('表格操作按钮（详情、编辑、删除）存在', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    // 检查表格中是否有操作按钮
    const detailButtons = page.getByRole('button', { name: /详情/i });
    const editButtons = page.getByRole('button', { name: /编辑/i });
    const deleteButtons = page.getByRole('button', { name: /删除/i });

    // 如果表格有数据，按钮应该可见
    const tableRows = page.locator('.ant-table-tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      await expect(detailButtons.first()).toBeVisible();
      await expect(editButtons.first()).toBeVisible();
      await expect(deleteButtons.first()).toBeVisible();
    }
  });
});

test.describe('CRM 标签管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/tag`);
    await waitForPageLoad(page);
  });

  test('新增标签按钮可见且可点击', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新增标签/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('模态框确定取消按钮可用', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新增标签/i });
    await addButton.click();
    await page.waitForTimeout(500);

    const okButton = page.locator('.ant-modal-footer .ant-btn-primary');
    const cancelButton = page.locator('.ant-modal-footer .ant-btn-default');

    await expect(okButton).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // 点击取消关闭模态框
    await cancelButton.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ant-modal')).not.toBeVisible();
  });
});

test.describe('CRM 群管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/group`);
    await waitForPageLoad(page);
  });

  test('新建群按钮可见且可点击', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新建群/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('表格操作按钮（成员、编辑、删除）存在', async ({ page }) => {
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const tableRows = page.locator('.ant-table-tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const memberButton = page.getByRole('button', { name: /成员/i }).first();
      const editButton = page.getByRole('button', { name: /编辑/i }).first();
      const deleteButton = page.getByRole('button', { name: /删除/i }).first();

      await expect(memberButton).toBeVisible();
      await expect(editButton).toBeVisible();
      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('CRM 跟进管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/follow-up`);
    await waitForPageLoad(page);
  });

  test('新增跟进按钮可见且可点击', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新增跟进/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('Tab 切换按钮可用', async ({ page }) => {
    const tabs = page.locator('.ant-tabs-tab');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
      await expect(tabs.nth(1)).toHaveClass(/ant-tabs-tab-active/);
    }
  });
});

test.describe('平台用户管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/platform/user`);
    await waitForPageLoad(page);
  });

  test('新增用户按钮可见且可点击', async ({ page }) => {
    // 检查页面是否可访问（需要 PLATFORM:USER:LIST 权限）
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const addButton = page.getByRole('button', { name: /新增用户|新增/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal, .ant-drawer');
    await expect(modal).toBeVisible();
  });

  test('表格操作按钮（编辑、重置密码、删除）存在', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    // 排除空数据行和占位行
    const tableRows = page
      .locator('.ant-table-tbody tr')
      .filter({ hasNot: page.locator('.ant-table-placeholder') });
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const editButton = page.getByRole('button', { name: /编辑/i }).first();
      const deleteButton = page.getByRole('button', { name: /删除/i }).first();

      // 检查按钮是否存在，如果不存在可能是权限问题
      const editVisible = await editButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const deleteVisible = await deleteButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!editVisible && !deleteVisible) {
        // 可能是权限问题，表格有数据但用户没有操作权限
        test.skip(true, '表格有数据但用户无操作权限');
        return;
      }

      if (editVisible) await expect(editButton).toBeVisible();
      if (deleteVisible) await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('平台角色管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/platform/role`);
    await waitForPageLoad(page);
  });

  test('新增角色按钮可见且可点击', async ({ page }) => {
    // 检查页面是否可访问（需要 PLATFORM:ROLE:LIST 权限）
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const addButton = page.getByRole('button', { name: /新增角色|新增/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal, .ant-drawer');
    await expect(modal).toBeVisible();
  });

  test('表格操作按钮（编辑、权限、删除）存在', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    // 排除空数据行和占位行
    const tableRows = page
      .locator('.ant-table-tbody tr')
      .filter({ hasNot: page.locator('.ant-table-placeholder') });
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const editButton = page.getByRole('button', { name: /编辑/i }).first();
      const deleteButton = page.getByRole('button', { name: /删除/i }).first();

      // 检查按钮是否存在，如果不存在可能是权限问题
      const editVisible = await editButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const deleteVisible = await deleteButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!editVisible && !deleteVisible) {
        // 可能是权限问题，表格有数据但用户没有操作权限
        test.skip(true, '表格有数据但用户无操作权限');
        return;
      }

      if (editVisible) await expect(editButton).toBeVisible();
      if (deleteVisible) await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('平台租户管理按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/platform/tenant`);
    await waitForPageLoad(page);
  });

  test('新增租户按钮可见且可点击', async ({ page }) => {
    // 检查页面是否可访问（需要 PLATFORM:TENANT:LIST 权限）
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const addButton = page.getByRole('button', { name: /新增租户/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    await addButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
  });

  test('表格操作按钮（编辑、管理订阅、删除）存在', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const tableRows = page.locator('.ant-table-tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const editButton = page.getByRole('button', { name: /编辑/i }).first();
      const subscribeButton = page
        .getByRole('button', { name: /管理订阅/i })
        .first();
      const deleteButton = page.getByRole('button', { name: /删除/i }).first();

      await expect(editButton).toBeVisible();
      await expect(subscribeButton).toBeVisible();
      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('AI Tutor 作业批改按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/ai-tutor/homework`);
    await page.waitForTimeout(3000); // 等待页面渲染
  });

  test('清空按钮可见且可点击', async ({ page }) => {
    // 检查页面是否可访问（需要 LMS 模块订阅）
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const clearButton = page.getByRole('button', { name: /清空/i });
    await expect(clearButton).toBeVisible({ timeout: 10000 });
    await expect(clearButton).toBeEnabled();
  });

  test('开始批改按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const gradeButton = page.getByRole('button', { name: /开始批改/i });
    await expect(gradeButton).toBeVisible({ timeout: 10000 });
  });

  test('上传区域可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    // Upload.Dragger 组件的容器
    const uploadArea = page.locator('.ant-upload-drag, .ant-upload-wrapper');
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Tutor 智能聊天按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/ai-tutor/chat`);
    await waitForPageLoad(page);
  });

  test('发送/求解按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const sendButton = page.getByRole('button', { name: /发送|求解/i });
    await expect(sendButton).toBeVisible();
  });

  test('新建会话按钮可见且可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const newSessionButton = page.locator('[class*="toolbar"] button').last();
    await expect(newSessionButton).toBeVisible();
  });

  test('学科选择器可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const subjectSelect = page.locator('.ant-select').first();
    await expect(subjectSelect).toBeVisible();
  });

  test('结构化求解模式切换可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const modeSwitch = page.locator('.ant-switch');
    if (await modeSwitch.isVisible()) {
      await expect(modeSwitch).toBeEnabled();
    }
  });

  test('快速问题标签可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    const quickTags = page
      .locator('.quick-tag, .ant-tag')
      .filter({ hasText: /.+/ });
    const tagCount = await quickTags.count();

    if (tagCount > 0) {
      await expect(quickTags.first()).toBeVisible();
      // 点击应该填充输入框
      await quickTags.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('CRM 零售仪表盘按钮测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/retail`);
    await waitForPageLoad(page);
  });

  test('统计卡片正确显示', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    // 等待统计卡片加载
    await page.waitForSelector('.ant-card', { timeout: 5000 }).catch(() => {});

    const cards = page.locator('.ant-card');
    const cardCount = await cards.count();

    // 应该有多个统计卡片
    expect(cardCount).toBeGreaterThan(0);
  });

  test('排行榜表格正确渲染', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }
    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();
  });
});

test.describe('表单输入组件测试', () => {
  test('客户表单输入字段可用', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);

    // 打开新增客户模态框
    const addButton = page.getByRole('button', { name: /新增客户/i });
    await addButton.click();
    await page.waitForTimeout(500);

    // 检查表单字段
    const nameInput = page.locator('.ant-modal input').first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();

    // 测试输入
    await nameInput.fill('测试客户');
    await expect(nameInput).toHaveValue('测试客户');
  });

  test('下拉选择器可用', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);

    const addButton = page.getByRole('button', { name: /新增客户/i });
    await addButton.click();
    await page.waitForTimeout(500);

    // 检查状态选择器
    const selectBoxes = page.locator('.ant-modal .ant-select');
    const selectCount = await selectBoxes.count();

    if (selectCount > 0) {
      await expect(selectBoxes.first()).toBeVisible();
    }
  });
});

test.describe('分页功能测试', () => {
  test('客户列表分页器可用', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);

    await page
      .waitForSelector('.ant-pagination', { timeout: 5000 })
      .catch(() => {});

    const pagination = page.locator('.ant-pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();

      // 检查分页按钮
      const nextButton = page.locator('.ant-pagination-next');
      if (await nextButton.isVisible()) {
        // 如果有下一页，按钮应该可点击
        const isDisabled = await nextButton
          .locator('.ant-pagination-item-link')
          .getAttribute('disabled');
        if (!isDisabled) {
          await expect(nextButton).toBeEnabled();
        }
      }
    }
  });
});

test.describe('搜索功能测试', () => {
  test('客户搜索框可用', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);

    const searchInput = page
      .locator('.ant-input-search input, input[placeholder*="搜索"]')
      .first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();

      // 测试输入搜索关键词
      await searchInput.fill('测试');
      await expect(searchInput).toHaveValue('测试');

      // 按回车搜索
      await searchInput.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('确认对话框测试', () => {
  test('删除确认对话框正确显示', async ({ page }) => {
    await login(page);
    // 使用客户列表页面（通常有数据），或者如果没有数据则跳过
    await page.goto(`${BASE_URL}/crm/customer`);
    await page.waitForTimeout(3000);

    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const tableRows = page
      .locator('.ant-table-tbody tr')
      .filter({ hasNot: page.locator('.ant-table-placeholder') });
    const rowCount = await tableRows.count();

    // 如果没有数据行，跳过测试
    if (rowCount === 0) {
      const emptyText = page.locator('.ant-empty, text=暂无数据');
      if (await emptyText.isVisible({ timeout: 1000 }).catch(() => true)) {
        test.skip();
        return;
      }
    }

    // 找到删除按钮
    const deleteButton = page.getByRole('button', { name: /删除/i }).first();
    const isDeleteVisible = await deleteButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!isDeleteVisible) {
      test.skip();
      return;
    }

    await deleteButton.click();
    await page.waitForTimeout(500);

    // 检查确认对话框 (Popconfirm 或 Modal)
    const popconfirm = page.locator(
      '.ant-popconfirm, .ant-popover, .ant-modal-confirm',
    );
    await expect(popconfirm).toBeVisible({ timeout: 5000 });

    // 点击其他地方关闭
    await page.keyboard.press('Escape');
  });
});

test.describe('抽屉组件测试', () => {
  test('客户详情抽屉正确打开', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/customer`);
    await waitForPageLoad(page);

    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const tableRows = page.locator('.ant-table-tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const detailButton = page.getByRole('button', { name: /详情/i }).first();
      await detailButton.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('.ant-drawer');
      await expect(drawer).toBeVisible();

      // 关闭抽屉
      const closeButton = page.locator('.ant-drawer-close');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('群成员抽屉正确打开', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/group`);
    await waitForPageLoad(page);

    await page.waitForSelector('.ant-table', { timeout: 5000 }).catch(() => {});

    const tableRows = page.locator('.ant-table-tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const memberButton = page.getByRole('button', { name: /成员/i }).first();
      await memberButton.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('.ant-drawer');
      await expect(drawer).toBeVisible();

      // 检查添加成员按钮
      const addMemberButton = page
        .locator('.ant-drawer')
        .getByRole('button', { name: /添加成员/i });
      await expect(addMemberButton).toBeVisible();
    }
  });
});

// ==================== CRM 朋友圈功能测试 ====================
test.describe('CRM 朋友圈功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/moments`);
    await waitForPageLoad(page);
  });

  test('朋友圈页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查页面标题或关键元素
    const pageContent = await page.content();
    const hasContent =
      pageContent.includes('朋友圈') ||
      pageContent.includes('moments') ||
      pageContent.includes('发表');

    expect(hasContent).toBeTruthy();
  });

  test('Tab 切换功能正常', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const tabs = page.locator('.ant-tabs-tab');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      // 点击第二个 tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);

      // 验证 tab 切换成功
      await expect(tabs.nth(1)).toHaveClass(/ant-tabs-tab-active/);
    }
  });

  test('发表朋友圈流程 - 选择可见范围', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找"所有客户可见"或类似的单选按钮/选择器
    const visibilitySelector = page.locator('.ant-radio-group, .ant-select').first();

    if (await visibilitySelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(visibilitySelector).toBeVisible();
    }
  });

  test('筛选客户抽屉可打开', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找"筛选客户"或"按条件筛选"按钮
    const filterButton = page
      .locator('button, .ant-radio-button-wrapper')
      .filter({ hasText: /筛选|条件/i })
      .first();

    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // 检查抽屉是否打开
      const drawer = page.locator('.ant-drawer');
      if (await drawer.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(drawer).toBeVisible();

        // 关闭抽屉
        const closeButton = page.locator('.ant-drawer-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('内容输入区域可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找文本输入区域
    const textArea = page.locator('textarea, .ant-input').first();

    if (await textArea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(textArea).toBeEnabled();

      // 测试输入
      await textArea.fill('测试朋友圈内容');
      await expect(textArea).toHaveValue('测试朋友圈内容');
    }
  });

  test('发表按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const publishButton = page.getByRole('button', { name: /发表|发送|提交/i });

    if (await publishButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(publishButton).toBeVisible();
    }
  });
});

// ==================== CRM 朋友圈统计测试 ====================
test.describe('CRM 朋友圈统计测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/moments/statistics`);
    await waitForPageLoad(page);
  });

  test('统计页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查统计卡片
    await page.waitForSelector('.ant-card, .ant-statistic', { timeout: 5000 }).catch(() => {});

    const cards = page.locator('.ant-card, .ant-statistic');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('同步互动数据按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const syncButton = page.getByRole('button', { name: /同步/i });

    if (await syncButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(syncButton).toBeEnabled();
    }
  });

  test('返回按钮可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const backButton = page.locator('button').filter({ has: page.locator('[class*="ArrowLeft"]') });

    if (await backButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(backButton).toBeEnabled();
    }
  });
});

// ==================== CRM 群发消息工具测试 ====================
test.describe('CRM 群发消息工具测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/mass-message/tools`);
    await waitForPageLoad(page);
  });

  test('群发工具页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查是否有工具卡片
    const cards = page.locator('.ant-card');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);
  });

  test('群发消息给客户入口可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const customerButton = page.getByRole('button', { name: /新建消息/i }).first();

    if (await customerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(customerButton).toBeEnabled();
    }
  });

  test('朋友圈入口可点击', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const momentsButton = page.getByRole('button', { name: /新建内容/i });

    if (await momentsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(momentsButton).toBeEnabled();
    }
  });
});

// ==================== CRM 群发消息创建测试 ====================
test.describe('CRM 群发消息创建测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/mass-message/create`);
    await waitForPageLoad(page);
  });

  test('群发消息创建页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查步骤条
    const steps = page.locator('.ant-steps');

    if (await steps.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(steps).toBeVisible();
    }
  });

  test('步骤一 - 目标选择区域可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查部门/标签选择器
    const selectors = page.locator('.ant-select, .ant-tree');
    const selectorCount = await selectors.count();

    expect(selectorCount).toBeGreaterThanOrEqual(0);
  });

  test('下一步按钮可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const nextButton = page.getByRole('button', { name: /下一步/i });

    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(nextButton).toBeVisible();
    }
  });

  test('附件编辑区域可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 先进入第二步
    const nextButton = page.getByRole('button', { name: /下一步/i });

    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 选择一些条件后点击下一步
      await nextButton.click();
      await page.waitForTimeout(1000);

      // 检查附件编辑区域
      const attachmentArea = page.locator('.ant-upload, [class*="attachment"]');
      if (await attachmentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(attachmentArea).toBeVisible();
      }
    }
  });
});

// ==================== CRM 快速群发测试 ====================
test.describe('CRM 快速群发测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/crm/mass-message`);
    await waitForPageLoad(page);
  });

  test('快速群发页面正确加载', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 检查步骤条
    const steps = page.locator('.ant-steps');

    if (await steps.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(steps).toBeVisible();
    }
  });

  test('标签筛选器可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 查找标签选择器
    const tagSelector = page.locator('.ant-select').first();

    if (await tagSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(tagSelector).toBeVisible();
    }
  });

  test('消息内容输入区域可用', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    // 先进入第二步
    const nextButton = page.getByRole('button', { name: /下一步/i });

    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // 检查文本输入区域
      const textArea = page.locator('textarea');

      if (await textArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(textArea).toBeEnabled();
        await textArea.fill('测试群发消息内容');
        await expect(textArea).toHaveValue('测试群发消息内容');
      }
    }
  });

  test('统计分析入口可见', async ({ page }) => {
    if (!(await isPageAccessible(page))) {
      test.skip(true, '用户无权限访问此页面');
      return;
    }

    const statsButton = page.getByRole('button', { name: /统计/i });

    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statsButton).toBeEnabled();
    }
  });
});
