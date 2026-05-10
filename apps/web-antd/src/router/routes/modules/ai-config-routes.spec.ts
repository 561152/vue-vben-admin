import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import platformRoutes from './platform';
import systemRoutes from './system';

function findChild(parent: RouteRecordRaw, name: string): RouteRecordRaw | undefined {
  return parent.children?.find((c) => c.name === name);
}

describe('AI config routes', () => {
  it('tenant route /system/ai-config exists, requires SETTINGS:AI_CONFIG:MANAGE permission', () => {
    const system = systemRoutes[0];
    expect(system).toBeDefined();
    const aiConfig = findChild(system!, 'AiConfig');
    expect(aiConfig).toBeDefined();
    expect(aiConfig!.path).toBe('ai-config');
    expect(aiConfig!.meta?.permissions).toContain('SETTINGS:AI_CONFIG:MANAGE');
  });

  it('platform route /platform/ai-config exists, requires PLATFORM:AI_CONFIG:VIEW permission', () => {
    const platform = platformRoutes[0];
    expect(platform).toBeDefined();
    const aiConfig = findChild(platform!, 'PlatformAiConfig');
    expect(aiConfig).toBeDefined();
    expect(aiConfig!.path).toBe('ai-config');
    expect(aiConfig!.meta?.permissions).toContain('PLATFORM:AI_CONFIG:VIEW');
    expect(aiConfig!.meta?.appModule).toBe('PLATFORM');
  });

  it('platform AI config route lazy-loads index.vue', () => {
    const platform = platformRoutes[0];
    const aiConfig = findChild(platform!, 'PlatformAiConfig');
    expect(aiConfig?.component).toBeTypeOf('function');
  });
});
