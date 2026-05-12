import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  getAdminToken,
  getPiniaAccessStoreData,
  getPiniaUserStoreData,
} from '../test-auth';

const BASE_URL = 'http://localhost:5666';
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

async function loginWithToken(page: Page) {
  const token = getAdminToken();
  const accessStoreData = getPiniaAccessStoreData(token);
  const userStoreData = getPiniaUserStoreData();

  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('domcontentloaded');

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

async function openFirstExecutionDrawer(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/ai-studio/execution`);
  await page.waitForLoadState('networkidle');

  try {
    await page.waitForSelector('.ant-table-row', { timeout: 10_000 });
  } catch {
    return false;
  }

  const viewButton = page
    .locator('button')
    .filter({ has: page.locator('.anticon-eye') })
    .first();

  if (!(await viewButton.isVisible().catch(() => false))) {
    return false;
  }

  await viewButton.click();
  // Drawer 渲染 + ExecutionControlPanel mount
  try {
    await page
      .locator('[data-testid="execution-control-panel"]')
      .first()
      .waitFor({ timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

async function findRowByStatus(
  page: Page,
  status:
    | 'RUNNING'
    | 'PAUSED'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'PENDING',
): Promise<Locator | null> {
  await page.goto(`${BASE_URL}/ai-studio/execution`);
  await page.waitForLoadState('networkidle');

  try {
    await page.waitForSelector('.ant-table-row', { timeout: 10_000 });
  } catch {
    return null;
  }

  const candidate = page
    .locator('.ant-table-row')
    .filter({ hasText: status })
    .first();
  if ((await candidate.count()) === 0) return null;
  return candidate;
}

test.describe('AI Studio Phase 2E - Suspend/Resume/Cancel', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithToken(page);
  });

  test('ExecutionControlPanel 在 Drawer 中渲染状态 tag 与对应控制按钮', async ({
    page,
  }) => {
    const opened = await openFirstExecutionDrawer(page);
    if (!opened) {
      test.skip(true, '当前环境无执行记录或无法打开详情 Drawer');
      return;
    }

    const panel = page
      .locator('[data-testid="execution-control-panel"]')
      .first();
    await expect(panel).toBeVisible();

    const statusTag = panel.locator('[data-testid="execution-status-tag"]');
    await expect(statusTag).toBeVisible();
    const statusText = (await statusTag.innerText()).trim();

    const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(statusText);
    const btnSuspend = panel.locator('[data-testid="btn-suspend"]');
    const btnResume = panel.locator('[data-testid="btn-resume"]');
    const btnCancel = panel.locator('[data-testid="btn-cancel"]');

    if (statusText === 'RUNNING') {
      await expect(btnSuspend).toBeVisible();
      await expect(btnResume).toHaveCount(0);
    } else if (statusText === 'PAUSED') {
      await expect(btnResume).toBeVisible();
      await expect(btnSuspend).toHaveCount(0);
    } else {
      await expect(btnSuspend).toHaveCount(0);
      await expect(btnResume).toHaveCount(0);
    }

    if (terminal) {
      await expect(btnCancel).toHaveCount(0);
    } else {
      await expect(btnCancel).toBeVisible();
    }
  });

  test('终态执行只展示状态 tag,不展示取消按钮', async ({ page }) => {
    // 优先找 COMPLETED 行;退化到 FAILED / CANCELLED
    const target =
      (await findRowByStatus(page, 'COMPLETED')) ??
      (await findRowByStatus(page, 'FAILED')) ??
      (await findRowByStatus(page, 'CANCELLED'));

    if (!target) {
      test.skip(true, '当前环境无终态执行记录');
      return;
    }

    const viewBtn = target
      .locator('button')
      .filter({ has: page.locator('.anticon-eye') })
      .first();
    if (!(await viewBtn.isVisible().catch(() => false))) {
      test.skip(true, '终态行未找到查看按钮');
      return;
    }
    await viewBtn.click();

    const panel = page
      .locator('[data-testid="execution-control-panel"]')
      .first();
    await panel.waitFor({ timeout: 10_000 });

    await expect(
      panel.locator('[data-testid="execution-status-tag"]'),
    ).toBeVisible();
    await expect(panel.locator('[data-testid="btn-cancel"]')).toHaveCount(0);
    await expect(panel.locator('[data-testid="btn-suspend"]')).toHaveCount(0);
    await expect(panel.locator('[data-testid="btn-resume"]')).toHaveCount(0);
  });

  test('暂停按钮弹出确认弹窗,取消则不发起请求', async ({ page }) => {
    const target = await findRowByStatus(page, 'RUNNING');
    if (!target) {
      test.skip(true, '当前环境无 RUNNING 执行');
      return;
    }

    const viewBtn = target
      .locator('button')
      .filter({ has: page.locator('.anticon-eye') })
      .first();
    if (!(await viewBtn.isVisible().catch(() => false))) {
      test.skip(true, 'RUNNING 行未找到查看按钮');
      return;
    }
    await viewBtn.click();

    const panel = page
      .locator('[data-testid="execution-control-panel"]')
      .first();
    await panel.waitFor({ timeout: 10_000 });

    let requestSeen = false;
    const onRequest = (request: import('@playwright/test').Request) => {
      if (
        request.url().includes('/executions/') &&
        request.url().endsWith('/suspend')
      ) {
        requestSeen = true;
      }
    };
    page.on('request', onRequest);

    await panel.locator('[data-testid="btn-suspend"]').click();

    // ant-design-vue Modal.confirm 渲染为 .ant-modal-confirm 容器
    const confirmDialog = page.locator('.ant-modal-confirm').last();
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('确认暂停执行');

    // 点击"取消"按钮
    await confirmDialog
      .locator('button')
      .filter({ hasText: /取\s*消/ })
      .first()
      .click();
    await expect(confirmDialog).toHaveCount(0);

    page.off('request', onRequest);
    expect(requestSeen).toBe(false);
  });

  test('Resume 弹窗:非法 JSON 输入展示内联错误', async ({ page }) => {
    const target = await findRowByStatus(page, 'PAUSED');
    if (!target) {
      test.skip(true, '当前环境无 PAUSED 执行,无法验证 Resume 弹窗');
      return;
    }

    const viewBtn = target
      .locator('button')
      .filter({ has: page.locator('.anticon-eye') })
      .first();
    if (!(await viewBtn.isVisible().catch(() => false))) {
      test.skip(true, 'PAUSED 行未找到查看按钮');
      return;
    }
    await viewBtn.click();

    const panel = page
      .locator('[data-testid="execution-control-panel"]')
      .first();
    await panel.waitFor({ timeout: 10_000 });

    await panel.locator('[data-testid="btn-resume"]').click();

    const textarea = page.locator('[data-testid="resume-data-input"] textarea');
    await expect(textarea).toBeVisible();

    // case 1: parse error (单引号)
    await textarea.fill(`{'bad': 'json'}`);
    await page
      .locator('.ant-modal-footer button')
      .filter({ hasText: /确\s*定|OK/ })
      .first()
      .click();
    const err = page.locator('[data-testid="resume-error"]');
    await expect(err).toBeVisible();
    await expect(err).toContainText('JSON 解析失败');

    // case 2: array (合法 JSON 但非 object) -> 类型错误
    await textarea.fill(`[1, 2, 3]`);
    await page
      .locator('.ant-modal-footer button')
      .filter({ hasText: /确\s*定|OK/ })
      .first()
      .click();
    await expect(err).toContainText('必须是 JSON 对象');
  });
});
