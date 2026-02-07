/**
 * MaterialPicker 集成 E2E 测试
 *
 * 测试 MaterialPicker 组件在以下模块的集成：
 * 1. 群发消息 (mass-message)
 * 2. 朋友圈 (moments)
 * 3. 单发消息 (direct-message)
 * 4. 定时消息 (scheduled-message)
 *
 * 验证要点：
 * - 素材选择器正常打开
 * - 素材列表正确加载
 * - 素材选择功能正常
 * - materialId 正确传递到后端
 */

import { expect, test } from '@playwright/test';
import { getAdminToken, getPiniaAccessStoreData, getPiniaUserStoreData } from './test-auth';

// 测试配置
const BASE_URL = 'http://localhost:5666';
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 设置测试认证
 */
async function setupAuth(page: any) {
  const token = getAdminToken();

  // 设置 localStorage
  await page.addInitScript((data: any) => {
    localStorage.setItem('VBEN_ACCESS_STORE', JSON.stringify(data.accessStore));
    localStorage.setItem('VBEN_USER_STORE', JSON.stringify(data.userStore));
  }, {
    accessStore: getPiniaAccessStoreData(token),
    userStore: getPiniaUserStoreData(),
  });
}

/**
 * 等待页面完全加载
 */
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // 额外等待确保所有动画完成
}

/**
 * Mock 素材库 API 响应
 */
async function mockMaterialsAPI(page: any) {
  await page.route('**/crm/materials*', async (route: any) => {
    const url = new URL(route.request().url());
    const type = url.searchParams.get('type');

    // 模拟素材数据
    const mockMaterials = [
      {
        id: 1,
        name: '春季促销活动海报',
        description: '春季大促销海报素材',
        type: type || 'IMAGE',
        content: null,
        mediaIds: [101],
        linkUrl: null,
        linkTitle: null,
        categoryId: 1,
        categoryName: '营销活动',
        tags: ['促销', '活动', '春季'],
        viewCount: 128,
        usageCount: 45,
        status: 'ACTIVE',
        isPublic: true,
        createdAt: '2026-01-20T10:00:00Z',
        updatedAt: '2026-01-29T10:00:00Z',
      },
      {
        id: 2,
        name: '新品发布宣传图',
        description: '新品上市宣传素材',
        type: type || 'IMAGE',
        content: null,
        mediaIds: [102],
        linkUrl: null,
        linkTitle: null,
        categoryId: 1,
        categoryName: '营销活动',
        tags: ['新品', '宣传'],
        viewCount: 89,
        usageCount: 32,
        status: 'ACTIVE',
        isPublic: true,
        createdAt: '2026-01-22T10:00:00Z',
        updatedAt: '2026-01-29T10:00:00Z',
      },
      {
        id: 3,
        name: '会员专属优惠',
        description: '会员专属优惠素材',
        type: type || 'IMAGE',
        content: null,
        mediaIds: [103],
        linkUrl: null,
        linkTitle: null,
        categoryId: 2,
        categoryName: '会员活动',
        tags: ['会员', '优惠'],
        viewCount: 56,
        usageCount: 21,
        status: 'ACTIVE',
        isPublic: true,
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-29T10:00:00Z',
      },
    ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: mockMaterials,
        total: mockMaterials.length,
      }),
    });
  });

  // Mock 分类树 API
  await page.route('**/crm/material-categories/tree*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 1,
            name: '营销活动',
            parentId: null,
            children: [],
          },
          {
            id: 2,
            name: '会员活动',
            parentId: null,
            children: [],
          },
        ],
      }),
    });
  });
}

test.describe('MaterialPicker 集成测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await mockMaterialsAPI(page);
  });

  /**
   * 测试 1: 群发消息模块 (mass-message)
   */
  test.describe('群发消息模块', () => {
    test('应该能打开素材选择器并选择图片', async ({ page }) => {
      // 1. 访问群发消息创建页面
      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);

      // 2. 进入到"编辑消息内容"步骤
      await page.click('button:has-text("下一步")');
      await waitForPageLoad(page);

      // 3. 点击"图片库"按钮打开 MaterialPicker
      const imageLibButton = page.locator('button:has-text("图片库")').first();
      await expect(imageLibButton).toBeVisible();
      await imageLibButton.click();

      // 4. 验证 MaterialPicker Modal 打开
      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // 5. 验证素材列表加载
      await page.waitForTimeout(1000);
      const materialCards = modal.locator('.ant-card');
      await expect(materialCards.first()).toBeVisible();

      // 6. 选择第一个素材
      await materialCards.first().click();

      // 7. 点击确定按钮
      const confirmButton = modal.locator('button:has-text("确定")');
      await confirmButton.click();

      // 8. 验证 Modal 关闭
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // 9. 验证附件已添加到列表
      const attachmentCards = page.locator('.attachment-editor .ant-card');
      await expect(attachmentCards).toHaveCount(1, { timeout: 3000 });
    });

    test('应该能选择多个素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);
      await page.click('button:has-text("下一步")');
      await waitForPageLoad(page);

      // 打开素材库
      await page.click('button:has-text("图片库")');
      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);

      // 选择多个素材
      const materialCards = modal.locator('.ant-card');
      await materialCards.nth(0).click();
      await page.waitForTimeout(300);
      await materialCards.nth(1).click();

      // 确定
      await modal.locator('button:has-text("确定")').click();

      // 验证添加了 2 个附件
      const attachmentCards = page.locator('.attachment-editor .ant-card');
      await expect(attachmentCards).toHaveCount(2, { timeout: 3000 });
    });

    test('应该在提交时包含 materialId', async ({ page, request }) => {
      // Intercept POST request
      let requestBody: any = null;
      await page.route('**/mass-message/send', async (route) => {
        const postData = route.request().postDataJSON();
        requestBody = postData;

        // Mock success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);

      // 跳到内容编辑步骤
      await page.click('button:has-text("下一步")');
      await waitForPageLoad(page);

      // 添加文本内容
      await page.fill('textarea[placeholder*="输入消息内容"]', '测试消息内容');

      // 选择素材
      await page.click('button:has-text("图片库")');
      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);
      await modal.locator('.ant-card').first().click();
      await modal.locator('button:has-text("确定")').click();

      // 进入确认步骤
      await page.click('button:has-text("下一步")');
      await waitForPageLoad(page);

      // 提交
      await page.click('button:has-text("通知成员发送")');
      await page.waitForTimeout(1000);

      // 验证请求包含 materialId
      expect(requestBody).toBeTruthy();
      expect(requestBody.content.attachments).toBeDefined();
      expect(requestBody.content.attachments.length).toBeGreaterThan(0);
      expect(requestBody.content.attachments[0].materialId).toBeDefined();
      expect(requestBody.content.attachments[0].materialId).toBe(1);
    });
  });

  /**
   * 测试 2: 朋友圈模块 (moments)
   */
  test.describe('朋友圈模块', () => {
    test('应该能打开素材选择器并选择素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/moments`);
      await waitForPageLoad(page);

      // 点击"新建内容" Tab (默认已选中)
      // 点击图片按钮
      const imageButton = page.locator('button:has-text("图片")').first();
      await expect(imageButton).toBeVisible();
      await imageButton.click();

      // 验证 MaterialPicker 打开
      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // 选择素材
      await page.waitForTimeout(1000);
      await modal.locator('.ant-card').first().click();
      await modal.locator('button:has-text("确定")').click();

      // 验证附件卡片显示
      const attachmentCards = page.locator('.ant-card[class*="w-32"]');
      await expect(attachmentCards).toHaveCount(1, { timeout: 3000 });
    });

    test('应该能删除已选择的附件', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/moments`);
      await waitForPageLoad(page);

      // 选择素材
      await page.click('button:has-text("图片")');
      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);
      await modal.locator('.ant-card').first().click();
      await modal.locator('button:has-text("确定")').click();

      // 验证附件添加
      const attachmentCards = page.locator('.ant-card[class*="w-32"]');
      await expect(attachmentCards).toHaveCount(1);

      // 点击删除按钮
      const deleteButton = attachmentCards.first().locator('button[danger]');
      await deleteButton.click();

      // 验证附件被删除
      await expect(attachmentCards).toHaveCount(0, { timeout: 2000 });
    });

    test('应该限制最多9个附件', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/moments`);
      await waitForPageLoad(page);

      // 添加9个附件
      for (let i = 0; i < 9; i++) {
        await page.click('button:has-text("图片")');
        const modal = page.locator('.ant-modal:has-text("选择素材")');
        await expect(modal).toBeVisible();
        await page.waitForTimeout(500);
        await modal.locator('.ant-card').first().click();
        await modal.locator('button:has-text("确定")').click();
        await page.waitForTimeout(300);
      }

      // 验证有9个附件
      const attachmentCards = page.locator('.ant-card[class*="w-32"]');
      await expect(attachmentCards).toHaveCount(9);

      // 验证按钮被禁用
      const imageButton = page.locator('button:has-text("图片")').first();
      await expect(imageButton).toBeDisabled();
    });
  });

  /**
   * 测试 3: 单发消息模块 (direct-message)
   */
  test.describe('单发消息模块', () => {
    test('Customer Mode 应该支持选择素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/direct-message`);
      await waitForPageLoad(page);

      // 点击发送消息按钮
      await page.click('button:has-text("发送消息")');

      // 等待 Modal 打开
      const sendModal = page.locator('.ant-modal:has-text("发送消息")');
      await expect(sendModal).toBeVisible();

      // 确保在 Customer Mode (默认)
      await page.waitForTimeout(500);

      // 点击选择素材按钮
      const selectMaterialButton = sendModal.locator('button:has-text("选择素材")').first();
      await selectMaterialButton.click();

      // 验证 MaterialPicker 打开
      const pickerModal = page.locator('.ant-modal').last();
      await expect(pickerModal).toBeVisible();

      // 选择素材
      await page.waitForTimeout(1000);
      await pickerModal.locator('.ant-card').first().click();
      await pickerModal.locator('button:has-text("确定")').click();

      // 验证附件标签显示
      const attachmentTags = sendModal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(1, { timeout: 3000 });
    });

    test('Employee Mode 应该支持选择素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/direct-message`);
      await waitForPageLoad(page);

      // 打开发送消息 Modal
      await page.click('button:has-text("发送消息")');
      const sendModal = page.locator('.ant-modal:has-text("发送消息")');
      await expect(sendModal).toBeVisible();

      // 切换到 Employee Mode
      await sendModal.locator('div[role="tab"]:has-text("按员工发送")').click();
      await page.waitForTimeout(500);

      // 选择素材
      const selectMaterialButton = sendModal.locator('button:has-text("选择素材")').first();
      await selectMaterialButton.click();

      const pickerModal = page.locator('.ant-modal').last();
      await expect(pickerModal).toBeVisible();
      await page.waitForTimeout(1000);
      await pickerModal.locator('.ant-card').first().click();
      await pickerModal.locator('button:has-text("确定")').click();

      // 验证附件标签
      const attachmentTags = sendModal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(1, { timeout: 3000 });
    });

    test('Test Mode 应该支持选择素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/direct-message`);
      await waitForPageLoad(page);

      // 打开发送消息 Modal
      await page.click('button:has-text("发送消息")');
      const sendModal = page.locator('.ant-modal:has-text("发送消息")');
      await expect(sendModal).toBeVisible();

      // 切换到 Test Mode
      await sendModal.locator('div[role="tab"]:has-text("测试发送")').click();
      await page.waitForTimeout(500);

      // 选择素材
      const selectMaterialButton = sendModal.locator('button:has-text("选择素材")').first();
      await selectMaterialButton.click();

      const pickerModal = page.locator('.ant-modal').last();
      await expect(pickerModal).toBeVisible();
      await page.waitForTimeout(1000);
      await pickerModal.locator('.ant-card').first().click();
      await pickerModal.locator('button:has-text("确定")').click();

      // 验证附件标签
      const attachmentTags = sendModal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(1, { timeout: 3000 });
    });
  });

  /**
   * 测试 4: 定时消息模块 (scheduled-message)
   */
  test.describe('定时消息模块', () => {
    test('应该能在创建时选择素材', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/scheduled-message`);
      await waitForPageLoad(page);

      // 点击新建按钮
      await page.click('button:has-text("新建定时消息")');

      // 等待 Modal 打开
      const modal = page.locator('.ant-modal:has-text("新建定时消息")');
      await expect(modal).toBeVisible();

      // 填写基本信息
      await modal.locator('input[placeholder*="任务名称"]').fill('测试定时消息');
      await modal.locator('textarea[placeholder*="消息内容"]').fill('测试内容');

      // 选择素材
      const selectMaterialButton = modal.locator('button:has-text("选择素材")');
      await selectMaterialButton.click();

      const pickerModal = page.locator('.ant-modal').last();
      await expect(pickerModal).toBeVisible();
      await page.waitForTimeout(1000);
      await pickerModal.locator('.ant-card').first().click();
      await pickerModal.locator('button:has-text("确定")').click();

      // 验证附件标签
      const attachmentTags = modal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(1, { timeout: 3000 });
    });

    test('应该能删除已选择的附件', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/scheduled-message`);
      await waitForPageLoad(page);

      await page.click('button:has-text("新建定时消息")');
      const modal = page.locator('.ant-modal:has-text("新建定时消息")');
      await expect(modal).toBeVisible();

      // 选择素材
      await modal.locator('button:has-text("选择素材")').click();
      const pickerModal = page.locator('.ant-modal').last();
      await expect(pickerModal).toBeVisible();
      await page.waitForTimeout(1000);
      await pickerModal.locator('.ant-card').first().click();
      await pickerModal.locator('button:has-text("确定")').click();

      // 验证附件添加
      let attachmentTags = modal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(1);

      // 点击关闭图标删除
      const closeIcon = attachmentTags.first().locator('.anticon-close');
      await closeIcon.click();

      // 验证附件被删除
      attachmentTags = modal.locator('.ant-tag');
      await expect(attachmentTags).toHaveCount(0, { timeout: 2000 });
    });
  });

  /**
   * 测试 5: MaterialPicker 通用功能
   */
  test.describe('MaterialPicker 通用功能', () => {
    test('应该支持搜索功能', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);
      await page.click('button:has-text("下一步")');
      await page.click('button:has-text("图片库")');

      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);

      // 输入搜索关键词
      const searchInput = modal.locator('input[placeholder*="搜索"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('春季');
        await page.waitForTimeout(500);

        // 验证搜索结果（实际需要 mock API 返回过滤结果）
        const materialCards = modal.locator('.ant-card');
        await expect(materialCards).toHaveCount(1);
      }
    });

    test('应该支持分类筛选', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);
      await page.click('button:has-text("下一步")');
      await page.click('button:has-text("图片库")');

      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);

      // 点击分类树节点（如果可见）
      const categoryTree = modal.locator('.ant-tree');
      if (await categoryTree.isVisible()) {
        const treeNode = categoryTree.locator('.ant-tree-node-content-wrapper').first();
        await treeNode.click();
        await page.waitForTimeout(500);

        // 验证素材列表更新
        const materialCards = modal.locator('.ant-card');
        await expect(materialCards.first()).toBeVisible();
      }
    });

    test('应该显示素材使用统计', async ({ page }) => {
      await page.goto(`${BASE_URL}/crm/mass-message/create`);
      await waitForPageLoad(page);
      await page.click('button:has-text("下一步")');
      await page.click('button:has-text("图片库")');

      const modal = page.locator('.ant-modal:has-text("选择素材")');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(1000);

      // 验证素材卡片显示统计信息
      const firstCard = modal.locator('.ant-card').first();
      const statsText = await firstCard.textContent();

      // 应该包含浏览次数或使用次数
      expect(statsText).toMatch(/(浏览|使用|次)/);
    });
  });
});
