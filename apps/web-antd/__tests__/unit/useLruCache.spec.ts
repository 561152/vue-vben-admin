import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLruCache, usePromptEditCache } from '#/composables/useLruCache';

// Mock localStorage for Node.js environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useLruCache', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should set and get values', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');
    const value = cache.get('key1');

    expect(value).toBe('value1');
  });

  it('should return undefined for non-existent keys', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    const value = cache.get('non-existent');

    expect(value).toBeUndefined();
  });

  it('should respect max size limit', () => {
    const cache = useLruCache<string>({ maxSize: 2 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3'); // Should evict key1

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
  });

  it('should track access order', () => {
    const cache = useLruCache<string>({ maxSize: 2 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    // Access key1 to make it recently used
    cache.get('key1');

    // Add key3, should evict key2 (least recently used)
    cache.set('key3', 'value3');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key3')).toBe('value3');
  });

  it('should remove values', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');
    cache.remove('key1');

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it('should clear all values', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it('should check existence with has()', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');

    expect(cache.has('key1')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should get all entries', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const all = cache.getAll();

    expect(all).toHaveLength(2);
    expect(all[0].key).toBe('key1');
    expect(all[1].key).toBe('key2');
  });

  it('should return keys list', () => {
    const cache = useLruCache<string>({ maxSize: 3 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const keys = cache.keys();

    expect(keys).toEqual(['key1', 'key2']);
  });
});

describe('usePromptEditCache', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should cache prompt data', () => {
    const cache = usePromptEditCache();

    const promptData = {
      id: 'test-id',
      name: 'Test Prompt',
      key: 'test-prompt',
      templateContent: 'Hello {{name}}!',
      variables: [{ name: 'name', type: 'string' as const, required: true }],
      updatedAt: Date.now(),
    };

    cache.set('edit-test-id', promptData);
    const retrieved = cache.get('edit-test-id');

    expect(retrieved).toEqual(promptData);
  });
});
