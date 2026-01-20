import { ref, reactive, computed, type Ref, type ComputedRef } from 'vue';
import { message } from 'ant-design-vue';

/**
 * API 分页响应格式（支持 items 或 data 字段）
 */
interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  total: number;
}

/**
 * useCrudTable 配置选项
 */
interface UseCrudTableOptions<T, P = Record<string, unknown>> {
  /** 获取列表数据的 API */
  fetchApi: (
    params: P & { page: number; pageSize: number },
  ) => Promise<PaginatedResponse<T>>;
  /** 删除数据的 API（可选） */
  deleteApi?: (id: number | string) => Promise<void>;
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 初始筛选条件 */
  initialFilters?: Partial<P>;
  /** 行唯一标识字段 */
  rowKey?: string;
  /** 显示总条数的格式化函数 */
  showTotal?: (total: number) => string;
}

/**
 * useCrudTable 返回类型
 */
interface UseCrudTableReturn<T, P> {
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 表格数据 */
  dataSource: Ref<T[]>;
  /** 分页配置 */
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
    showTotal: (total: number) => string;
  };
  /** 筛选条件 */
  filters: Ref<Partial<P>>;
  /** 一键绑定所有表格属性 */
  tableProps: ComputedRef<{
    dataSource: T[];
    loading: boolean;
    pagination: {
      current: number;
      pageSize: number;
      total: number;
      showSizeChanger: boolean;
      showTotal: (total: number) => string;
    };
    onChange: (pag: { current?: number; pageSize?: number }) => void;
    rowKey: string;
  }>;
  /** 获取数据 */
  fetchData: () => Promise<void>;
  /** 处理表格分页变化 */
  handleTableChange: (pag: { current?: number; pageSize?: number }) => void;
  /** 删除数据 */
  handleDelete: (id: number | string) => Promise<void>;
  /** 重置筛选条件 */
  resetFilters: () => void;
  /** 搜索（重置页码到第一页） */
  search: () => void;
  /** 刷新当前页 */
  refresh: () => void;
}

/**
 * CRM 表格通用逻辑 Composable
 *
 * @example
 * ```ts
 * const { tableProps, filters, search, fetchData } = useCrudTable({
 *   fetchApi: getCustomers,
 *   deleteApi: deleteCustomer,
 *   initialFilters: { status: 'LEAD' },
 * });
 * ```
 *
 * 在模板中一行绑定所有属性：
 * ```vue
 * <a-table v-bind="tableProps" :columns="columns" />
 * ```
 */
export function useCrudTable<
  T extends { id: number | string },
  P = Record<string, unknown>,
>(options: UseCrudTableOptions<T, P>): UseCrudTableReturn<T, P> {
  const {
    fetchApi,
    deleteApi,
    defaultPageSize = 20,
    initialFilters = {} as Partial<P>,
    rowKey = 'id',
    showTotal = (total: number) => `共 ${total} 条`,
  } = options;

  // 状态
  const loading = ref(false);
  const dataSource = ref<T[]>([]) as Ref<T[]>;
  const pagination = reactive({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
    showSizeChanger: true,
    showTotal,
  });
  const filters = ref<Partial<P>>({ ...initialFilters }) as Ref<Partial<P>>;

  /**
   * 获取数据
   */
  async function fetchData(): Promise<void> {
    loading.value = true;
    try {
      const res = await fetchApi({
        ...filters.value,
        page: pagination.current,
        pageSize: pagination.pageSize,
      } as P & { page: number; pageSize: number });

      // 支持 items 或 data 字段
      dataSource.value = res.items || res.data || [];
      pagination.total = res.total || 0;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : '获取数据失败';
      message.error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 分页变化处理
   */
  function handleTableChange(pag: {
    current?: number;
    pageSize?: number;
  }): void {
    if (pag.current !== undefined) pagination.current = pag.current;
    if (pag.pageSize !== undefined) pagination.pageSize = pag.pageSize;
    fetchData();
  }

  /**
   * 删除数据
   */
  async function handleDelete(id: number | string): Promise<void> {
    if (!deleteApi) {
      message.warning('删除功能未配置');
      return;
    }
    try {
      await deleteApi(id);
      message.success('删除成功');
      fetchData();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : '删除失败';
      message.error(errorMessage);
    }
  }

  /**
   * 重置筛选条件
   */
  function resetFilters(): void {
    filters.value = { ...initialFilters };
    pagination.current = 1;
    fetchData();
  }

  /**
   * 搜索（重置页码到第一页）
   */
  function search(): void {
    pagination.current = 1;
    fetchData();
  }

  /**
   * 刷新当前页
   */
  function refresh(): void {
    fetchData();
  }

  /**
   * 表格绑定属性（一键绑定）
   */
  const tableProps = computed(() => ({
    dataSource: dataSource.value,
    loading: loading.value,
    pagination,
    onChange: handleTableChange,
    rowKey,
  }));

  return {
    loading,
    dataSource,
    pagination,
    filters,
    tableProps,
    fetchData,
    handleTableChange,
    handleDelete,
    resetFilters,
    search,
    refresh,
  };
}
