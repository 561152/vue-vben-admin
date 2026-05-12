import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const srcRoot = join(process.cwd(), 'apps/web-antd/src');
const packagesRoot = join(process.cwd(), 'packages');

function collectVueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectVueFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.vue') ? [entryPath] : [];
  });
}

function importsAntDesignModal(source: string) {
  return /import\s*\{[\s\S]*\bModal\b[\s\S]*\}\s*from\s*['"]ant-design-vue['"]/.test(
    source,
  );
}

function findDeprecatedModalVisibleUsages(filePath: string) {
  const source = readFileSync(filePath, 'utf8');

  if (!importsAntDesignModal(source)) {
    return [];
  }

  return [...source.matchAll(/<Modal\b[\s\S]*?>/g)]
    .filter(({ 0: tag }) =>
      /(?:^|\s)(?::visible|v-model:visible|visible)\s*=/.test(tag),
    )
    .map(({ index }) => {
      const line = source.slice(0, index).split('\n').length;
      return `${relative(process.cwd(), filePath)}:${line}`;
    });
}

describe('Ant Design Vue Modal compatibility', () => {
  it('uses open instead of deprecated visible on Modal components', () => {
    const deprecatedUsages = [
      ...collectVueFiles(srcRoot),
      ...collectVueFiles(packagesRoot),
    ].flatMap(findDeprecatedModalVisibleUsages);

    expect(deprecatedUsages).toEqual([]);
  });
});
