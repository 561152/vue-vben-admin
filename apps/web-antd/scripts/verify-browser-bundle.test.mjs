import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { scanBrowserBundle } from './verify-browser-bundle.mjs';

const tmpRoots = [];

function makeDist(files) {
  const root = mkdtempSync(join(tmpdir(), 'web-bundle-guard-'));
  tmpRoots.push(root);

  for (const [file, content] of Object.entries(files)) {
    const fullPath = join(root, file);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }

  return root;
}

afterEach(() => {
  while (tmpRoots.length > 0) {
    rmSync(tmpRoots.pop(), { force: true, recursive: true });
  }
});

describe('scanBrowserBundle', () => {
  it('flags Node-only runtime markers in browser JavaScript assets', () => {
    const dist = makeDist({
      'js/chunk.js': [
        'const loader = createJiti(import.meta.url);',
        'const require = createRequire(import.meta.url);',
        'import("node:module");',
        'console.log("__vite-browser-external");',
      ].join('\n'),
    });

    const result = scanBrowserBundle(dist);

    assert.equal(result.ok, false);
    assert.deepEqual(
      result.violations.map((violation) => violation.id).sort(),
      [
        'create-jiti',
        'create-require',
        'node-module-builtin',
        'vite-browser-external',
      ].sort(),
    );
  });

  it('ignores source maps and non-runtime assets', () => {
    const dist = makeDist({
      'index.html': '<script type="module" src="/js/chunk.js"></script>',
      'js/chunk.js': 'console.log("browser chunk");',
      'js/chunk.js.map': '{"sourcesContent":["createRequire(\\"node:module\\")"]}',
      'assets/logo.txt': 'jiti',
    });

    const result = scanBrowserBundle(dist);

    assert.equal(result.ok, true);
    assert.equal(result.filesScanned, 2);
  });
});
