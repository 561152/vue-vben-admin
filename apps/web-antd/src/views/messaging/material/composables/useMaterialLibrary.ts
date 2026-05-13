import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { requestClient } from '#/api/request';
import type { MaterialItem, CategoryItem, MaterialFilters } from '../types';

export function useMaterialLibrary() {
  // ==================== 视图状态 ====================
  const viewMode = ref<'grid' | 'list'>('grid');
  const selectionMode = ref(false);
  const selectedIds = ref<number[]>([]);

  // ==================== 筛选状态 ====================
  const filters = reactive<MaterialFilters>({
    keyword: '',
    type: undefined,
    status: 'ACTIVE',
    categoryId: undefined,
    tags: [],
    dateRange: undefined,
    minUsageCount: undefined,
    maxUsageCount: undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // ==================== 分类状态 ====================
  const categories = ref<CategoryItem[]>([]);
  const selectedCategoryId = ref<number | null>(null);
  const categoryLoading = ref(false);

  // ==================== 素材列表 ====================
  const materials = ref<MaterialItem[]>([]);
  const loading = ref(false);
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // ==================== 详情抽屉 ====================
  const detailVisible = ref(false);
  const selectedMaterial = ref<MaterialItem | null>(null);

  // ==================== 计算属性 ====================
  const hasSelection = computed(() => selectedIds.value.length > 0);
  const selectedCount = computed(() => selectedIds.value.length);

  // ==================== 方法 ====================

  // 获取素材列表
  async function fetchMaterials() {
    loading.value = true;
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (selectedCategoryId.value !== null)
        params.categoryId = selectedCategoryId.value;
      if (filters.tags?.length) params.tags = filters.tags.join(',');
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
        params.sortOrder = filters.sortOrder;
      }

      const res = await requestClient.get<{
        items: MaterialItem[];
        total: number;
      }>('/messaging/material', { params });

      materials.value = res.items || [];
      pagination.total = res.total || 0;
    } catch (e) {
      console.error('Fetch materials error:', e);
      message.error('获取素材列表失败');
    } finally {
      loading.value = false;
    }
  }

  // 获取分类列表
  async function fetchCategories() {
    categoryLoading.value = true;
    try {
      const res = await requestClient.get<CategoryItem[]>(
        '/messaging/material/categories/tree',
      );
      categories.value = res || [];
    } catch (e) {
      console.error('Fetch categories error:', e);
    } finally {
      categoryLoading.value = false;
    }
  }

  // 切换选择
  function toggleSelection(id: number) {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    } else {
      selectedIds.value.push(id);
    }
  }

  // 全选
  function selectAll() {
    if (selectedIds.value.length === materials.value.length) {
      selectedIds.value = [];
    } else {
      selectedIds.value = materials.value.map((m) => m.id);
    }
  }

  // 清空选择
  function clearSelection() {
    selectedIds.value = [];
    selectionMode.value = false;
  }

  // 进入选择模式
  function enterSelectionMode() {
    selectionMode.value = true;
  }

  // 退出选择模式
  function exitSelectionMode() {
    clearSelection();
  }

  // 打开详情
  function openDetail(material: MaterialItem) {
    selectedMaterial.value = material;
    detailVisible.value = true;
  }

  // 关闭详情
  function closeDetail() {
    detailVisible.value = false;
    selectedMaterial.value = null;
  }

  // 批量删除
  async function batchDelete() {
    if (!selectedIds.value.length) return;

    try {
      await requestClient.delete('/messaging/material', {
        data: { ids: selectedIds.value },
      });
      message.success(`成功删除 ${selectedIds.value.length} 个素材`);
      clearSelection();
      fetchMaterials();
    } catch (e) {
      message.error('删除失败');
    }
  }

  // 批量修改分类
  async function batchChangeCategory(categoryId: number | null) {
    if (!selectedIds.value.length) return;

    try {
      await requestClient.put('/messaging/material/batch/category', {
        ids: selectedIds.value,
        categoryId,
      });
      message.success('分类修改成功');
      fetchMaterials();
    } catch (e) {
      message.error('修改失败');
    }
  }

  // 批量添加标签
  async function batchAddTags(tags: string[]) {
    if (!selectedIds.value.length) return;

    try {
      await requestClient.put('/messaging/material/batch/tags', {
        ids: selectedIds.value,
        tags,
        mode: 'add',
      });
      message.success('标签添加成功');
      fetchMaterials();
    } catch (e) {
      message.error('添加失败');
    }
  }

  // 批量移除标签
  async function batchRemoveTags(tags: string[]) {
    if (!selectedIds.value.length) return;

    try {
      await requestClient.put('/messaging/material/batch/tags', {
        ids: selectedIds.value,
        tags,
        mode: 'remove',
      });
      message.success('标签移除成功');
      fetchMaterials();
    } catch (e) {
      message.error('移除失败');
    }
  }

  // 批量修改状态
  async function batchChangeStatus(status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') {
    if (!selectedIds.value.length) return;

    try {
      await requestClient.put('/messaging/material/batch/status', {
        ids: selectedIds.value,
        status,
      });
      message.success('状态修改成功');
      fetchMaterials();
    } catch (e) {
      message.error('修改失败');
    }
  }

  // 批量导出
  async function batchExport() {
    if (!selectedIds.value.length) return;

    try {
      const res = await requestClient.post(
        '/messaging/material/export',
        { ids: selectedIds.value },
        { responseType: 'blob' },
      );

      // 下载文件
      const blob = new Blob([res], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materials-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  }

  // 删除单个素材
  async function deleteMaterial(id: number) {
    try {
      await requestClient.delete(`/messaging/material/${id}`);
      message.success('删除成功');
      fetchMaterials();
    } catch (e) {
      message.error('删除失败');
    }
  }

  // 更新筛选条件
  function updateFilters(newFilters: Partial<MaterialFilters>) {
    Object.assign(filters, newFilters);
    pagination.page = 1;
    fetchMaterials();
  }

  // 重置筛选
  function resetFilters() {
    filters.keyword = '';
    filters.type = undefined;
    filters.status = 'ACTIVE';
    filters.tags = [];
    filters.dateRange = undefined;
    filters.minUsageCount = undefined;
    filters.maxUsageCount = undefined;
    filters.sortBy = 'updatedAt';
    filters.sortOrder = 'desc';
    selectedCategoryId.value = null;
    pagination.page = 1;
    fetchMaterials();
  }

  return {
    // 状态
    viewMode,
    selectionMode,
    selectedIds,
    filters,
    categories,
    selectedCategoryId,
    categoryLoading,
    materials,
    loading,
    pagination,
    detailVisible,
    selectedMaterial,
    hasSelection,
    selectedCount,

    // 方法
    fetchMaterials,
    fetchCategories,
    toggleSelection,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    openDetail,
    closeDetail,
    batchDelete,
    batchChangeCategory,
    batchAddTags,
    batchRemoveTags,
    batchChangeStatus,
    batchExport,
    deleteMaterial,
    updateFilters,
    resetFilters,
  };
}
