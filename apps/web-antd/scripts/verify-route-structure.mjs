#!/usr/bin/env node
/**
 * 路由结构架构守卫脚本
 *
 * 目的：永久防止 "无权限也显示菜单" 的回归问题。
 *
 * 运行方式：node scripts/verify-route-structure.mjs
 * 退出码：0 = 通过，1 = 有违规
 *
 * 背景：filterTree 过滤子节点后，父节点如果自身通过 appModule 检查，
 * 会被保留但 children 变成空数组 []。cleanEmptyParentRoutes 依赖
 * route.redirect 来识别并清理这种空父节点。
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = join(__dirname, '../src/router/routes/modules');

const violations = [];
const routeFiles = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.ts'));

for (const file of routeFiles) {
  const content = readFileSync(join(ROUTES_DIR, file), 'utf-8');

  // 提取每个路由对象（简化解析，基于常见模式）
  // 匹配：{ name: '...', path: '...', redirect: '...', meta: { ... }, children: [...] }
  const routeBlocks = content.match(/\{\s*\n\s*meta:[\s\S]*?children:\s*\[[\s\S]*?\]\s*,?\s*\n\s*\}/g) || [];

  for (const block of routeBlocks) {
    // 提取 name
    const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const routeName = nameMatch ? nameMatch[1] : 'anonymous';

    // 提取 appModule
    const appModuleMatch = block.match(/appModule:\s*['"`]([^'"`]+)['"`]/);
    const hasAppModule = !!appModuleMatch;

    // 提取 redirect
    const hasRedirect = /redirect:/.test(block);

    // 规则 1：有 appModule 的分组路由必须有 redirect
    if (hasAppModule && !hasRedirect && block.includes('children:')) {
      violations.push(
        `${file}: parent route "${routeName}" has appModule "${appModuleMatch[1]}" but missing "redirect" — cleanEmptyParentRoutes cannot clean it when children are filtered`,
      );
    }

    // 规则 2：有 appModule 的分组路由的子节点必须有 permissions（除非 hideInMenu）
    // 没有 appModule 的父路由是公共路由（如 Dashboard），子路由不需要 permissions
    if (hasAppModule && block.includes('children:')) {
      // 提取 children 块
      const childrenMatch = block.match(/children:\s*\[([\s\S]*)\]/);
      if (childrenMatch) {
        const childrenContent = childrenMatch[1];
        // 匹配每个子路由对象
        const childBlocks = childrenContent.match(/\{\s*\n[\s\S]*?\n\s*\}/g) || [];

        for (const child of childBlocks) {
          // 跳过 hideInMenu
          if (/hideInMenu:\s*true/.test(child)) continue;

          const childNameMatch = child.match(/name:\s*['"`]([^'"`]+)['"`]/);
          const childName = childNameMatch ? childNameMatch[1] : 'anonymous';

          // 检查 permissions
          const hasPermissions = /permissions:\s*\[/.test(child);

          if (!hasPermissions) {
            violations.push(
              `${file}: child route "${childName}" under "${routeName}" (appModule: ${appModuleMatch[1]}) lacks permissions — will be visible to all users subscribed to the module`,
            );
          }
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ Route Structure Violations Found:\n');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(`\n  Total: ${violations.length} violation(s)`);
  console.error('\nFix: Add "redirect" to parent routes with appModule,');
  console.error('     and "permissions" to child routes without hideInMenu.\n');
  process.exit(1);
} else {
  console.log(`✅ All ${routeFiles.length} route modules passed structure verification.`);
  process.exit(0);
}
