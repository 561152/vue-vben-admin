import { test } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5666';

test('调试页面内容', async ({ page }) => {
  console.log('=== 开始页面内容调试 ===');

  // 访问首页
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const homeUrl = page.url();
  console.log('首页 URL:', homeUrl);

  const homeHtml = await page.content();
  fs.writeFileSync('/root/member/test-screenshots/home-page.html', homeHtml);
  console.log('首页 HTML 已保存，长度:', homeHtml.length);

  const homeText = await page.locator('body').textContent();
  console.log('首页文本前 500 字符:', homeText?.substring(0, 500));

  // 访问审批页
  await page.goto(`${BASE_URL}/education/paper/approval-tasks`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const approvalUrl = page.url();
  console.log('\n审批页 URL:', approvalUrl);

  const approvalHtml = await page.content();
  fs.writeFileSync('/root/member/test-screenshots/approval-page.html', approvalHtml);
  console.log('审批页 HTML 已保存，长度:', approvalHtml.length);

  const approvalText = await page.locator('body').textContent();
  console.log('审批页文本前 500 字符:', approvalText?.substring(0, 500));

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

  await page.reload();
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    console.log('\n=== 页面错误 ===');
    errors.forEach((err, index) => console.log(`${index + 1}. ${err}`));
  } else {
    console.log('\n没有 JavaScript 错误');
  }

  // 检查页面中是否包含特定文本
  const bodyText = await page.locator('body').textContent() || '';
  console.log('\n=== 页面内容检查 ===');
  console.log('包含"审批":', bodyText.includes('审批'));
  console.log('包含"任务":', bodyText.includes('任务'));
  console.log('包含"待审批":', bodyText.includes('待审批'));
  console.log('包含"登录":', bodyText.includes('登录'));
  console.log('包含"404":', bodyText.includes('404'));
  console.log('包含"Not Found":', bodyText.includes('Not Found'));

  // 检查所有可见的表格
  const tables = page.locator('table');
  const tableCount = await tables.count();
  console.log('\n页面中表格数量:', tableCount);

  // 检查所有按钮
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('页面中按钮数量:', buttonCount);

  if (buttonCount > 0 && buttonCount < 20) {
    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await buttons.nth(i).textContent();
      console.log(`按钮 ${i + 1}: ${buttonText}`);
    }
  }

  // 截图
  await page.screenshot({
    path: '/root/member/test-screenshots/debug-full-page.png',
    fullPage: true,
  });
});
