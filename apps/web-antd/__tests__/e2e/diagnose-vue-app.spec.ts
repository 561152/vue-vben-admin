import { test } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5666';

test('诊断 Vue 应用挂载问题', async ({ page }) => {
  const diagnostics: any = {
    console: { logs: [], warnings: [], errors: [] },
    network: { requests: [], failed: [] },
    localStorage: {},
    errors: [],
  };

  // 捕获所有控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      diagnostics.console.errors.push(text);
      console.log(`[ERROR] ${text}`);
    } else if (type === 'warning') {
      diagnostics.console.warnings.push(text);
      console.log(`[WARN] ${text}`);
    } else if (type === 'log' || type === 'info') {
      diagnostics.console.logs.push(text);
      console.log(`[LOG] ${text}`);
    }
  });

  // 捕获页面错误
  page.on('pageerror', (error) => {
    diagnostics.errors.push({
      message: error.message,
      stack: error.stack,
    });
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // 捕获网络请求
  page.on('request', (request) => {
    diagnostics.network.requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    });
  });

  page.on('requestfailed', (request) => {
    diagnostics.network.failed.push({
      url: request.url(),
      error: request.failure()?.errorText || 'Unknown error',
    });
    console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });

  console.log('=== 开始诊断 Vue 应用 ===\n');

  // 访问首页
  console.log('访问首页...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 检查 Vue 应用是否挂载
  const appMounted = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      exists: !!app,
      hasChildren: app ? app.children.length > 0 : false,
      innerHTML: app ? app.innerHTML.substring(0, 200) : '',
      classList: app ? Array.from(app.classList) : [],
    };
  });

  console.log('\n=== Vue 应用挂载状态 ===');
  console.log('App 元素存在:', appMounted.exists);
  console.log('App 有子元素:', appMounted.hasChildren);
  console.log('App 子元素数量:', appMounted.hasChildren ? '> 0' : '0');
  console.log('App class 列表:', appMounted.classList);
  console.log('App 内容前 200 字符:', appMounted.innerHTML || '(空)');

  diagnostics.appMounted = appMounted;

  // 检查 localStorage
  const localStorageData = await page.evaluate(() => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // 尝试解析 JSON
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value.substring(0, 100);
            }
          }
        } catch (e: any) {
          data[key] = `Error: ${e.message}`;
        }
      }
    }
    return data;
  });

  console.log('\n=== LocalStorage 数据 ===');
  Object.keys(localStorageData).forEach((key) => {
    if (key.includes('vben')) {
      console.log(`${key}:`, JSON.stringify(localStorageData[key]).substring(0, 150));
    }
  });

  diagnostics.localStorage = localStorageData;

  // 检查是否有 Vue 实例
  const vueInfo = await page.evaluate(() => {
    return {
      hasVue: typeof (window as any).__VUE__ !== 'undefined',
      hasVueDevtools: typeof (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
      hasApp: typeof (window as any).__APP__ !== 'undefined',
      windowKeys: Object.keys(window).filter((k) => k.includes('VUE') || k.includes('vue') || k.includes('APP')),
    };
  });

  console.log('\n=== Vue 实例检查 ===');
  console.log('window.__VUE__:', vueInfo.hasVue);
  console.log('Vue DevTools Hook:', vueInfo.hasVueDevtools);
  console.log('window.__APP__:', vueInfo.hasApp);
  console.log('Vue 相关的 window 属性:', vueInfo.windowKeys);

  diagnostics.vueInfo = vueInfo;

  // 检查路由
  const routerInfo = await page.evaluate(() => {
    return {
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
    };
  });

  console.log('\n=== 路由信息 ===');
  console.log('当前 URL:', routerInfo.currentUrl);
  console.log('路径:', routerInfo.pathname);
  console.log('Hash:', routerInfo.hash || '(无)');
  console.log('查询参数:', routerInfo.search || '(无)');

  diagnostics.routerInfo = routerInfo;

  // 等待更长时间，看是否有延迟加载
  console.log('\n等待 5 秒，检查是否有延迟加载...');
  await page.waitForTimeout(5000);

  const appMountedAfterWait = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app ? app.children.length > 0 : false;
  });

  console.log('等待后 App 是否有子元素:', appMountedAfterWait);

  // 访问审批页面
  console.log('\n访问审批任务页面...');
  await page.goto(`${BASE_URL}/education/paper/approval-tasks`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  const approvalPageMounted = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      hasChildren: app ? app.children.length > 0 : false,
      innerHTML: app ? app.innerHTML.substring(0, 200) : '',
    };
  });

  console.log('\n=== 审批页面挂载状态 ===');
  console.log('App 有子元素:', approvalPageMounted.hasChildren);
  console.log('App 内容:', approvalPageMounted.innerHTML || '(空)');

  diagnostics.approvalPageMounted = approvalPageMounted;

  // 检查是否有任何 Vue 组件实例
  const componentCheck = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-v-*], [class*="v-"], .vue-component');
    return {
      vueElementsCount: elements.length,
      sampleElements: Array.from(elements).slice(0, 5).map((el) => ({
        tagName: el.tagName,
        classList: Array.from(el.classList).slice(0, 3),
      })),
    };
  });

  console.log('\n=== Vue 组件检查 ===');
  console.log('带 Vue 标记的元素数量:', componentCheck.vueElementsCount);
  console.log('示例元素:', JSON.stringify(componentCheck.sampleElements, null, 2));

  diagnostics.componentCheck = componentCheck;

  // 保存完整诊断报告
  fs.writeFileSync(
    '/root/member/test-screenshots/vue-diagnostics.json',
    JSON.stringify(diagnostics, null, 2)
  );

  console.log('\n=== 诊断报告已保存 ===');
  console.log('文件: /root/member/test-screenshots/vue-diagnostics.json');

  // 总结
  console.log('\n=== 诊断总结 ===');
  console.log('Vue 应用已挂载:', appMounted.hasChildren || appMountedAfterWait);
  console.log('控制台错误数:', diagnostics.console.errors.length);
  console.log('页面错误数:', diagnostics.errors.length);
  console.log('失败的网络请求数:', diagnostics.network.failed.length);

  if (diagnostics.console.errors.length > 0) {
    console.log('\n主要错误:');
    diagnostics.console.errors.slice(0, 3).forEach((err: string, i: number) => {
      console.log(`${i + 1}. ${err.substring(0, 200)}`);
    });
  }

  if (diagnostics.network.failed.length > 0) {
    console.log('\n失败的请求:');
    diagnostics.network.failed.slice(0, 3).forEach((req: any, i: number) => {
      console.log(`${i + 1}. ${req.url}`);
      console.log(`   错误: ${req.error}`);
    });
  }
});
