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

test('调试审批页面 - 捕获错误', async ({ page }) => {
  // 收集所有日志
  const consoleLogs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push(`[${type}] ${text}`);
    if (type === 'error' || type === 'warning') {
      console.log(`[${type}] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    const errorMsg = error.message;
    errors.push(errorMsg);
    console.log('[页面错误]', errorMsg);
  });

  page.on('requestfailed', (request) => {
    console.log('[请求失败]', request.url(), request.failure()?.errorText);
  });

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

  console.log('=== 开始导航到审批页面 ===');

  // 导航到审批页面（新路由）
  try {
    await page.goto(`${BASE_URL}/approval/paper-grading`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  } catch (e: any) {
    console.log('[导航错误]', e.message);
  }

  // 等待一下让页面完全加载
  await page.waitForTimeout(5000);

  console.log('=== 页面加载完成 ===');

  // 检查路由是否正确
  const currentUrl = page.url();
  console.log('当前 URL:', currentUrl);

  // 检查是否有错误信息显示
  const errorMessages = await page.locator('.ant-message-error, .ant-alert-error').allTextContents();
  if (errorMessages.length > 0) {
    console.log('错误消息:', errorMessages);
  }

  // 检查页面主体内容
  const bodyText = await page.locator('body').textContent();
  console.log('页面文本前 200 字符:', bodyText?.substring(0, 200));

  // 检查是否有 404 或其他错误页面
  const pageText = bodyText || '';
  if (pageText.includes('404') || pageText.includes('Not Found') || pageText.includes('找不到')) {
    console.log('!!! 页面显示 404 错误 !!!');
  }

  // 打印所有收集的错误
  if (errors.length > 0) {
    console.log('\n=== 页面 JavaScript 错误 ===');
    errors.forEach((err, index) => console.log(`${index + 1}. ${err}`));
  }

  // 检查 localStorage 是否设置成功
  const storedData = await page.evaluate((prefix) => {
    const access = localStorage.getItem(`${prefix}__access-store__`);
    const user = localStorage.getItem(`${prefix}__user-store__`);
    return { access: access ? JSON.parse(access) : null, user: user ? JSON.parse(user) : null };
  }, STORAGE_PREFIX);

  console.log('\n=== LocalStorage 数据 ===');
  console.log('Access Store:', JSON.stringify(storedData.access, null, 2));
  console.log('User Store:', JSON.stringify(storedData.user, null, 2));

  // 打印重要的控制台日志
  console.log('\n=== 控制台日志 (前 30 条) ===');
  consoleLogs.slice(0, 30).forEach((log) => console.log(log));
});
