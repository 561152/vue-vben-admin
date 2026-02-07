import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5666';
const STORAGE_PREFIX = 'vben-web-antd-5.5.9-dev';

function getAdminToken(): string {
  return jwt.sign(
    {
      sub: 1,
      username: 'boss',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    },
    'test-secret',
  );
}

test('调试审批页面', async ({ page }) => {
  // 设置认证
  const token = getAdminToken();
  const accessStore = {
    accessCodes: ['APPROVAL:PAPER_GRADING:APPROVE', 'approval:paper_grading:approve'],
    accessToken: token,
  };
  const userStore = {
    userId: 1,
    username: 'boss',
  };

  await page.goto(BASE_URL);
  await page.evaluate(
    ({ prefix, accessStore, userStore }) => {
      localStorage.setItem(`${prefix}__access-store__`, JSON.stringify(accessStore));
      localStorage.setItem(`${prefix}__user-store__`, JSON.stringify(userStore));
    },
    { prefix: STORAGE_PREFIX, accessStore, userStore },
  );

  // 导航到审批页面（新路由）
  await page.goto(`${BASE_URL}/approval/paper-grading`);
  await page.waitForLoadState('networkidle');

  // 等待一下让页面完全加载
  await page.waitForTimeout(3000);

  // 截图
  await page.screenshot({ path: '/root/member/debug-approval-page.png', fullPage: true });

  // 打印页面 HTML
  const html = await page.content();
  console.log('页面 HTML 长度:', html.length);

  // 打印页面标题
  const title = await page.title();
  console.log('页面标题:', title);

  // 检查是否有错误
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  // 等待一下收集错误
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    console.log('页面错误:');
    errors.forEach((err) => console.log('  -', err));
  }

  // 检查是否有审批相关的元素
  const bodyText = await page.locator('body').textContent();
  console.log('页面文本包含"审批":', bodyText?.includes('审批'));
  console.log('页面文本包含"任务":', bodyText?.includes('任务'));

  // 尝试查找表格
  const tableCount = await page.locator('table').count();
  console.log('页面中表格数量:', tableCount);

  // 尝试查找特定的 data-testid
  const taskTable = page.getByTestId('approval-task-table');
  const isVisible = await taskTable.isVisible().catch(() => false);
  console.log('approval-task-table 是否可见:', isVisible);

  // 如果不可见，打印当前 URL
  const currentUrl = page.url();
  console.log('当前 URL:', currentUrl);

  // 检查 API 调用
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      apiCalls.push(`${request.method()} ${request.url()}`);
    }
  });
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const url = response.url();
      console.log(`API 响应: ${status} ${url}`);
      if (status >= 400) {
        const text = await response.text().catch(() => '无法读取响应体');
        console.log(`  错误响应: ${text.substring(0, 200)}`);
      }
    }
  });

  // 重新加载页面触发 API 调用
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('API 调用:');
  apiCalls.forEach((call) => console.log('  -', call));
});
