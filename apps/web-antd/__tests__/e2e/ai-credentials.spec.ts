/**
 * AI 凭据管理 - E2E 测试
 *
 * 覆盖三个核心场景（plan Task 3.11 / 3.12 / 3.13）：
 *   - 租户配置一条 OPENAI 凭据 → 测试连接 → 设置为默认 LLM 模型
 *   - 删除被场景引用的凭据 → 看到 occupied[] 提示
 *   - 编辑凭据 apiKey 留空 → 后端保留旧 key（响应不变）
 *
 * 永久要求（来自 .claude/rules/testing.md）：
 *   - 使用 Page Object Model + data-testid 选择器
 *   - 避免硬编码等待时间
 *
 * 注：本套件依赖运行中的 dev server (5666) + API + 已迁移的 DB schema
 *     (PR3 Phase B)。在缺少这些依赖的环境下会预期失败。
 */
import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { getAdminToken, getPiniaAccessStoreData, getPiniaUserStoreData } from './test-auth';

const BASE_URL = 'http://localhost:5666';
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

class TenantAiConfigPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/system/ai-config`);
    await this.tabCredentials.waitFor({ state: 'visible' });
  }

  get tabCredentials() {
    return this.page.getByTestId('tab-credentials');
  }

  get tabDefaults() {
    return this.page.getByTestId('tab-defaults');
  }

  get tabScenarios() {
    return this.page.getByTestId('tab-scenarios');
  }

  get addButton() {
    return this.page.getByTestId('cred-list-add');
  }

  get dialog() {
    return this.page.getByTestId('credential-dialog');
  }

  cardForId(id: number) {
    return this.page.locator(`[data-testid="credential-card"]`).filter({
      has: this.page.locator(`[data-testid="cred-edit-${id}"]`),
    });
  }

  get occupiedDialog() {
    return this.page.getByTestId('cred-occupied-dialog');
  }
}

async function loginAsTenantAdmin(page: Page) {
  const token = getAdminToken();
  await page.addInitScript(
    ({ prefix, accessKey, accessVal, userKey, userVal }) => {
      window.localStorage.setItem(`${prefix}-access`, accessVal);
      window.localStorage.setItem(`${prefix}-user`, userVal);
      window.localStorage.setItem(`${prefix}-token`, accessKey);
    },
    {
      prefix: STORAGE_PREFIX,
      accessKey: token,
      accessVal: JSON.stringify(getPiniaAccessStoreData(token)),
      userKey: 'user',
      userVal: JSON.stringify(getPiniaUserStoreData()),
    },
  );
}

test.describe('AI 凭据管理 - 租户视图', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantAdmin(page);
  });

  test('Task 3.11: 租户配置 OPENAI 凭据 + 测试连接 + 设为默认 LLM', async ({ page }) => {
    const aiConfig = new TenantAiConfigPage(page);
    await aiConfig.goto();

    // Step 1: 打开新增对话框
    await aiConfig.addButton.click();
    await expect(aiConfig.dialog).toBeVisible();

    // Step 2: 选 provider OPENAI（baseUrl 自动填充）
    await page.getByTestId('cred-select-provider').selectOption('OPENAI');
    await expect(page.getByTestId('cred-input-baseUrl')).toHaveValue(
      'https://api.openai.com/v1',
    );

    // Step 3: 填写显示名 + apiKey
    await page.getByTestId('cred-input-displayName').fill('OpenAI Default');
    await page.getByTestId('cred-input-apiKey').fill('sk-test-fixture-key');

    // Step 4: 添加模型（gpt-4o LLM）
    await page.getByTestId('model-quick-add').click();
    await page.getByTestId('preset-checkbox-gpt-4o-LLM').check();
    await page.getByTestId('preset-confirm').click();

    // Step 5: 提交
    await page.getByTestId('cred-submit').click();
    await expect(aiConfig.dialog).toBeHidden();

    // Step 6: 列表应出现新卡片
    const newCard = page.locator('[data-testid="credential-card"]').filter({
      hasText: 'OpenAI Default',
    });
    await expect(newCard).toBeVisible();

    // Step 7: 测试连接（结果取决于后端 mock，仅验证按钮可用）
    await newCard.getByTestId('test-connection-btn').click();

    // Step 8: 切到默认模型 tab，绑定 LLM
    await aiConfig.tabDefaults.click();
    await page.getByTestId('defaults-save').click();
    await expect(page.getByText('默认模型已保存')).toBeVisible({ timeout: 5000 });
  });

  test('Task 3.12: 删除被场景引用的凭据 → 看到 occupied 提示', async ({ page }) => {
    const aiConfig = new TenantAiConfigPage(page);
    await aiConfig.goto();

    // 假设 fixture 数据：id=99 的凭据已被 scenario 绑定
    const card = aiConfig.cardForId(99);
    await card.getByTestId('cred-delete-99').click();
    await page.getByTestId('cred-delete-confirm-99').click();

    // 服务端应返回 409 occupied[]
    await expect(aiConfig.occupiedDialog).toBeVisible();
    await expect(aiConfig.occupiedDialog).toContainText('LLM_CHAT');
  });

  test('Task 3.13: 编辑模式 apiKey 留空 → 后端保留旧 key', async ({ page }) => {
    const aiConfig = new TenantAiConfigPage(page);
    await aiConfig.goto();

    // 假设 fixture 数据：id=42 已存在
    const card = aiConfig.cardForId(42);
    const oldHint = await card.locator('.meta-value').nth(1).innerText();

    await card.getByTestId('cred-edit-42').click();
    await expect(aiConfig.dialog).toBeVisible();

    // apiKey 留空，只改 displayName
    await page.getByTestId('cred-input-apiKey').fill('');
    await page.getByTestId('cred-input-displayName').fill('Updated Name');
    await page.getByTestId('cred-submit').click();
    await expect(aiConfig.dialog).toBeHidden();

    // 卡片显示新名称，apiKeyHint 不变
    const updated = page.locator('[data-testid="credential-card"]').filter({
      hasText: 'Updated Name',
    });
    await expect(updated).toBeVisible();
    await expect(updated.locator('.meta-value').nth(1)).toHaveText(oldHint);
  });
});
