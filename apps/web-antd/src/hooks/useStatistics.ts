import { ref, onMounted, type Ref } from 'vue';
import { requestClient } from '#/api/request';

/**
 * API 端点配置
 */
export interface StatisticsEndpoints<T extends Record<string, unknown>> {
  [key: string]: string;
}

/**
 * 统计数据加载状态
 */
export interface UseStatisticsReturn<T extends Record<string, unknown>> {
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 数据对象（key 与 endpoints 对应） */
  data: { [K in keyof T]: Ref<T[K] | null> };
  /** 重新加载数据 */
  reload: () => Promise<void>;
}

/**
 * 通用统计数据加载 Hook
 *
 * @param endpoints - API 端点映射，key 是数据名称，value 是 API 路径
 * @param autoLoad - 是否在 onMounted 时自动加载数据，默认 true
 *
 * @example
 * ```ts
 * interface TagStats {
 *   overview: TagOverview;
 *   analysis: UsageAnalysis;
 *   unused: UnusedTag[];
 * }
 *
 * const { loading, data, reload } = useStatistics<TagStats>({
 *   overview: '/customer/tag/statistics/overview',
 *   analysis: '/customer/tag/statistics/usage-analysis',
 *   unused: '/customer/tag/statistics/unused',
 * });
 *
 * // 在模板中使用: data.overview.value, data.analysis.value
 * ```
 */
export function useStatistics<T extends Record<string, unknown>>(
  endpoints: StatisticsEndpoints<T>,
  autoLoad = true,
): UseStatisticsReturn<T> {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 创建数据对象
  const data = {} as { [K in keyof T]: Ref<T[K] | null> };
  for (const key of Object.keys(endpoints)) {
    (data as Record<string, Ref<unknown>>)[key] = ref(null);
  }

  async function reload(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const keys = Object.keys(endpoints);
      const promises = keys.map((key) =>
        requestClient.get<T[typeof key]>(endpoints[key]),
      );

      const results = await Promise.all(promises);

      keys.forEach((key, index) => {
        (data as Record<string, Ref<unknown>>)[key].value = results[index];
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载统计数据失败';
      console.error('加载统计数据失败:', e);
    } finally {
      loading.value = false;
    }
  }

  if (autoLoad) {
    onMounted(reload);
  }

  return {
    loading,
    error,
    data,
    reload,
  };
}

/**
 * 格式化日期为中文格式
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

/**
 * 格式化日期时间为中文格式
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN');
}

/**
 * 计算百分比
 */
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
