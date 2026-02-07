import { ref, type Ref } from 'vue';

export interface LruCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  storageKey?: string; // localStorage key for persistence
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * LRU (Least Recently Used) Cache Composable
 * 用于缓存最近使用过的数据，支持容量限制和持久化
 */
export function useLruCache<T>(options: LruCacheOptions = {}) {
  const { maxSize = 5, ttl, storageKey } = options;

  // 从 localStorage 恢复缓存
  const loadFromStorage = (): Map<string, CacheEntry<T>> => {
    if (!storageKey) return new Map();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheEntry<T>[];
        // 检查过期
        const now = Date.now();
        const valid = parsed.filter(
          (entry) => !ttl || now - entry.timestamp < ttl,
        );
        return new Map(valid.map((e) => [e.key, e]));
      }
    } catch {
      // 忽略解析错误
    }
    return new Map();
  };

  // 缓存存储
  const cache = ref<Map<string, CacheEntry<T>>>(loadFromStorage()) as Ref<
    Map<string, CacheEntry<T>>
  >;

  /**
   * 保存到 localStorage
   */
  const persist = () => {
    if (!storageKey) return;
    try {
      const entries = Array.from(cache.value.values());
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      // 存储失败时忽略（可能是容量不足）
    }
  };

  /**
   * 获取缓存项（会更新访问顺序）
   */
  const get = (key: string): T | undefined => {
    const entry = cache.value.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (ttl && Date.now() - entry.timestamp > ttl) {
      cache.value.delete(key);
      persist();
      return undefined;
    }

    // 更新访问计数
    entry.accessCount++;

    // 移动到最后（最近使用）
    cache.value.delete(key);
    cache.value.set(key, entry);

    return entry.value;
  };

  /**
   * 设置缓存项
   */
  const set = (key: string, value: T) => {
    // 如果已存在，先删除
    if (cache.value.has(key)) {
      cache.value.delete(key);
    }

    // 如果达到容量上限，删除最旧的
    while (cache.value.size >= maxSize) {
      const firstKey = cache.value.keys().next().value;
      if (firstKey !== undefined) {
        cache.value.delete(firstKey);
      }
    }

    // 添加新项
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 1,
    };
    cache.value.set(key, entry);

    persist();
  };

  /**
   * 删除缓存项
   */
  const remove = (key: string) => {
    cache.value.delete(key);
    persist();
  };

  /**
   * 清空缓存
   */
  const clear = () => {
    cache.value.clear();
    persist();
  };

  /**
   * 检查是否存在
   */
  const has = (key: string): boolean => {
    const entry = cache.value.get(key);
    if (!entry) return false;

    // 检查是否过期
    if (ttl && Date.now() - entry.timestamp > ttl) {
      cache.value.delete(key);
      persist();
      return false;
    }

    return true;
  };

  /**
   * 获取所有缓存项（按使用顺序）
   */
  const getAll = (): CacheEntry<T>[] => {
    const now = Date.now();
    const entries: CacheEntry<T>[] = [];

    for (const [key, entry] of cache.value.entries()) {
      // 跳过过期项
      if (ttl && now - entry.timestamp > ttl) {
        cache.value.delete(key);
        continue;
      }
      entries.push(entry);
    }

    persist();
    return entries;
  };

  /**
   * 获取缓存大小
   */
  const size = (): number => cache.value.size;

  /**
   * 获取缓存键列表
   */
  const keys = (): string[] => Array.from(cache.value.keys());

  return {
    cache,
    get,
    set,
    remove,
    clear,
    has,
    getAll,
    size,
    keys,
  };
}

/**
 * 创建提示词编辑缓存（专用封装）
 */
export function usePromptEditCache() {
  return useLruCache<{
    id?: string;
    name: string;
    key: string;
    templateContent: string;
    variables: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: unknown;
    }>;
    modelConfig?: Record<string, unknown>;
    category?: string;
    tags?: string[];
    description?: string;
    updatedAt: number;
  }>({
    maxSize: 5,
    storageKey: 'prompt-edit-cache',
    ttl: 24 * 60 * 60 * 1000, // 24小时过期
  });
}

export default useLruCache;
