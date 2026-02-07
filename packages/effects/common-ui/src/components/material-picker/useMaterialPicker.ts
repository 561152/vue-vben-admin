import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type { Material, MaterialType } from './MaterialPicker.vue';

export interface UseMaterialPickerOptions {
  /**
   * 素材类型过滤
   * @default 'ALL'
   */
  type?: MaterialType;

  /**
   * 是否支持多选
   * @default false
   */
  multiple?: boolean;

  /**
   * 最多选择数量（仅在 multiple=true 时有效）
   * @default 9
   */
  maxCount?: number;

  /**
   * 是否显示分类树
   * @default true
   */
  showCategories?: boolean;

  /**
   * 选择完成回调
   */
  onSelect?: (materials: Material[]) => void;

  /**
   * 取消回调
   */
  onCancel?: () => void;
}

export interface UseMaterialPickerReturn {
  /**
   * 弹窗是否可见
   */
  visible: Ref<boolean>;

  /**
   * 已选择的素材列表
   */
  selectedMaterials: Ref<Material[]>;

  /**
   * 打开素材选择器
   */
  open: () => void;

  /**
   * 关闭素材选择器
   */
  close: () => void;

  /**
   * 处理素材选择
   */
  handleSelect: (materials: Material[]) => void;

  /**
   * 清空选择
   */
  clear: () => void;
}

/**
 * 素材选择器 Composable
 *
 * @example
 * ```ts
 * const { visible, selectedMaterials, open, handleSelect } = useMaterialPicker({
 *   type: 'IMAGE',
 *   multiple: true,
 *   maxCount: 9,
 *   onSelect: (materials) => {
 *     console.log('Selected materials:', materials);
 *   },
 * });
 *
 * // 打开选择器
 * open();
 *
 * // 在模板中使用
 * <MaterialPicker
 *   v-model:open="visible"
 *   :type="type"
 *   :multiple="multiple"
 *   :max-count="maxCount"
 *   @select="handleSelect"
 * />
 * ```
 */
export function useMaterialPicker(
  options: UseMaterialPickerOptions = {},
): UseMaterialPickerReturn {
  const visible = ref(false);
  const selectedMaterials = ref<Material[]>([]);

  function open() {
    visible.value = true;
  }

  function close() {
    visible.value = false;
  }

  function handleSelect(materials: Material[]) {
    selectedMaterials.value = materials;
    options.onSelect?.(materials);
    visible.value = false;
  }

  function clear() {
    selectedMaterials.value = [];
  }

  return {
    visible,
    selectedMaterials,
    open,
    close,
    handleSelect,
    clear,
  };
}

/**
 * 简化版：单选素材
 *
 * @example
 * ```ts
 * const { visible, selectedMaterial, open, handleSelect } = useSingleMaterialPicker({
 *   type: 'IMAGE',
 *   onSelect: (material) => {
 *     form.value.imageId = material.id;
 *   },
 * });
 * ```
 */
export function useSingleMaterialPicker(options: UseMaterialPickerOptions = {}) {
  const { visible, selectedMaterials, open, close, handleSelect: _handleSelect } = useMaterialPicker({
    ...options,
    multiple: false,
  });

  const selectedMaterial = computed(() => selectedMaterials.value[0] || null);

  function handleSelect(materials: Material[]) {
    _handleSelect(materials);
    if (materials.length > 0 && options.onSelect) {
      options.onSelect(materials);
    }
  }

  return {
    visible,
    selectedMaterial,
    open,
    close,
    handleSelect,
  };
}

/**
 * 简化版：多选素材
 *
 * @example
 * ```ts
 * const { visible, selectedMaterials, open, handleSelect } = useMultipleMaterialPicker({
 *   type: 'IMAGE',
 *   maxCount: 9,
 *   onSelect: (materials) => {
 *     form.value.attachments = materials.map(m => ({
 *       materialId: m.id,
 *       type: m.type,
 *     }));
 *   },
 * });
 * ```
 */
export function useMultipleMaterialPicker(options: UseMaterialPickerOptions = {}) {
  return useMaterialPicker({
    ...options,
    multiple: true,
  });
}
