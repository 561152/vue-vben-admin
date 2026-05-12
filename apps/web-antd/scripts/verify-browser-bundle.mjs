#!/usr/bin/env node
/**
 * Browser bundle guard.
 *
 * Keeps Node-only runtime helpers out of production browser assets. Build tools
 * may use these dependencies, but emitted JS/HTML must not.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST_DIR = join(__dirname, '../dist');

const RUNTIME_EXTENSIONS = new Set(['.html', '.js', '.mjs']);
const IGNORED_SUFFIXES = ['.map'];

const FORBIDDEN_MARKERS = [
  {
    id: 'jiti-package',
    label: 'jiti runtime package',
    pattern: /\bjiti(?:\/lib\/jiti\.mjs)?\b/,
  },
  {
    id: 'create-jiti',
    label: 'createJiti helper',
    pattern: /\bcreateJiti\b/,
  },
  {
    id: 'create-require',
    label: 'Node createRequire helper',
    pattern: /\bcreateRequire\b/,
  },
  {
    id: 'node-module-builtin',
    label: 'node:module builtin',
    pattern: /node:module/,
  },
  {
    id: 'vite-browser-external',
    label: 'Vite browser external placeholder',
    pattern: /__vite-browser-external/,
  },
];

function extensionOf(filePath) {
  const match = filePath.match(/(\.[^.\/]+)$/);
  return match?.[1] ?? '';
}

function shouldScanFile(filePath) {
  if (IGNORED_SUFFIXES.some((suffix) => filePath.endsWith(suffix))) {
    return false;
  }

  return RUNTIME_EXTENSIONS.has(extensionOf(filePath));
}

function listRuntimeFiles(rootDir) {
  const files = [];
  const entries = readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listRuntimeFiles(fullPath));
      continue;
    }

    if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function scanBrowserBundle(distDir = DEFAULT_DIST_DIR) {
  const violations = [];

  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    return {
      filesScanned: 0,
      ok: false,
      violations: [
        {
          id: 'missing-dist',
          label: 'missing dist directory',
          file: distDir,
        },
      ],
    };
  }

  const files = listRuntimeFiles(distDir);

  for (const file of files) {
    const content = readFileSync(file, 'utf8');

    for (const marker of FORBIDDEN_MARKERS) {
      if (marker.pattern.test(content)) {
        violations.push({
          id: marker.id,
          label: marker.label,
          file: relative(distDir, file),
        });
      }
    }
  }

  return {
    filesScanned: files.length,
    ok: violations.length === 0,
    violations,
  };
}

function printResult(result) {
  if (result.ok) {
    console.log(
      `✅ Browser bundle guard passed (${result.filesScanned} runtime files scanned).`,
    );
    return;
  }

  console.error('\n❌ Browser Bundle Violations Found:\n');
  for (const violation of result.violations) {
    console.error(`  - ${violation.file}: ${violation.label}`);
  }
  console.error(`\n  Total: ${result.violations.length} violation(s)`);
  console.error(
    '  Fix: keep Node-only tooling dependencies out of emitted browser assets.\n',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = process.argv[2] ? join(process.cwd(), process.argv[2]) : DEFAULT_DIST_DIR;
  const result = scanBrowserBundle(distDir);
  printResult(result);
  process.exit(result.ok ? 0 : 1);
}
