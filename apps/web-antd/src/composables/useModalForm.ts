import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { message } from 'ant-design-vue';

/**
 * useModalForm 配置选项
 */
interface UseModalFormOptions<T> {
  /** 创建数据的 API（可选） */
  createApi?: (data: T) => Promise<unknown>;
  /** 更新数据的 API（可选） */
  updateApi?: (id: number | string, data: T) => Promise<unknown>;
  /** 获取初始表单值的函数 */
  initialValues: () => T;
  /** 提交成功后的回调 */
  afterSubmit?: () => void;
  /** 创建成功提示文案 */
  createSuccessMessage?: string;
  /** 更新成功提示文案 */
  updateSuccessMessage?: string;
}

/**
 * useModalForm 返回类型
 */
interface UseModalFormReturn<T> {
  /** Modal 可见状态 */
  visible: Ref<boolean>;
  /** 提交加载状态 */
  loading: Ref<boolean>;
  /** 表单状态 */
  formState: Ref<T>;
  /** 正在编辑的记录 ID */
  editingId: Ref<number | string | null>;
  /** 是否为编辑模式 */
  isEditing: ComputedRef<boolean>;
  /** Modal 标题（新增/编辑） */
  modalTitle: ComputedRef<string>;
  /** 打开新增 Modal */
  openCreate: () => void;
  /** 打开编辑 Modal */
  openEdit: (id: number | string, data: Partial<T>) => void;
  /** 关闭 Modal */
  close: () => void;
  /** 提交表单 */
  submit: () => Promise<void>;
  /** 重置表单到初始值 */
  resetForm: () => void;
}

/**
 * Modal 表单通用逻辑 Composable
 *
 * @example
 * ```ts
 * const { visible, formState, modalTitle, openCreate, openEdit, submit } = useModalForm({
 *   createApi: createCustomer,
 *   updateApi: updateCustomer,
 *   initialValues: () => ({ name: '', phone: '', status: 'LEAD' }),
 *   afterSubmit: fetchData,
 * });
 * ```
 *
 * 在模板中：
 * ```vue
 * <a-modal v-model:open="visible" :title="modalTitle" @ok="submit">
 *   <a-form>
 *     <a-form-item label="名称">
 *       <a-input v-model:value="formState.name" />
 *     </a-form-item>
 *   </a-form>
 * </a-modal>
 * ```
 */
export function useModalForm<T>(
  options: UseModalFormOptions<T>,
): UseModalFormReturn<T> {
  const {
    createApi,
    updateApi,
    initialValues,
    afterSubmit,
    createSuccessMessage = '创建成功',
    updateSuccessMessage = '更新成功',
  } = options;

  const visible = ref(false);
  const loading = ref(false);
  const formState = ref<T>(initialValues()) as Ref<T>;
  const editingId = ref<number | string | null>(null);

  const isEditing = computed(() => editingId.value !== null);
  const modalTitle = computed(() => (isEditing.value ? '编辑' : '新增'));

  /**
   * 打开新增 Modal
   */
  function openCreate(): void {
    editingId.value = null;
    formState.value = initialValues();
    visible.value = true;
  }

  /**
   * 打开编辑 Modal
   */
  function openEdit(id: number | string, data: Partial<T>): void {
    editingId.value = id;
    formState.value = { ...initialValues(), ...data };
    visible.value = true;
  }

  /**
   * 关闭 Modal
   */
  function close(): void {
    visible.value = false;
    editingId.value = null;
  }

  /**
   * 重置表单到初始值
   */
  function resetForm(): void {
    formState.value = initialValues();
  }

  /**
   * 提交表单
   */
  async function submit(): Promise<void> {
    loading.value = true;
    try {
      if (isEditing.value && updateApi) {
        await updateApi(editingId.value!, formState.value);
        message.success(updateSuccessMessage);
      } else if (createApi) {
        await createApi(formState.value);
        message.success(createSuccessMessage);
      } else {
        message.warning('提交功能未配置');
        return;
      }
      close();
      afterSubmit?.();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : '操作失败';
      message.error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    formState,
    editingId,
    isEditing,
    modalTitle,
    openCreate,
    openEdit,
    close,
    submit,
    resetForm,
  };
}
