<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { Key } from 'ant-design-vue/es/_util/type';
import {
  Modal,
  Tabs,
  TabPane,
  Table,
  Image,
  Checkbox,
  Button,
  Input,
  Spin,
  Empty,
  Tag,
  Tree,
  message,
} from 'ant-design-vue';
import type { DataNode } from 'ant-design-vue/es/tree';
import {
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  ReloadOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons-vue';
import { request } from '../../utils/request';

// ==================== Types ====================

export type MaterialType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'LINK' | 'MIXED' | 'ALL';

export interface Material {
  id: number;
  name: string;
  description: string | null;
  type: MaterialType;
  content: string | null;
  mediaIds: number[];
  linkUrl: string | null;
  linkTitle: string | null;
  categoryId: number | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  usageCount: number;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  children?: Category[];
  materialCount?: number;
}

// ==================== Props & Emits ====================

const props = withDefaults(
  defineProps<{
    open: boolean;
    type?: MaterialType;
    multiple?: boolean;
    maxCount?: number;
    showCategories?: boolean;
  }>(),
  {
    type: 'ALL',
    multiple: false,
    maxCount: 9,
    showCategories: true,
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', materials: Material[]): void;
}>();

// ==================== State ====================

const loading = ref(false);
const materialList = ref<Material[]>([]);
const categories = ref<Category[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const activeType = ref<MaterialType>(props.type);
const selectedCategoryId = ref<number | null>(null);
const selectedIds = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);

// ==================== Computed ====================

const modalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const maxSelect = computed(() => props.maxCount);

const typeOptions = [
  { key: 'ALL', label: '全部', icon: FileOutlined, color: 'default' },
  { key: 'TEXT', label: '文本', icon: FileTextOutlined, color: 'blue' },
  { key: 'IMAGE', label: '图片', icon: PictureOutlined, color: 'green' },
  { key: 'VIDEO', label: '视频', icon: VideoCameraOutlined, color: 'purple' },
  { key: 'LINK', label: '链接', icon: LinkOutlined, color: 'orange' },
  { key: 'FILE', label: '文件', icon: FileOutlined, color: 'default' },
];

const columns = [
  {
    title: '',
    dataIndex: 'selection',
    key: 'selection',
    width: 50,
  },
  {
    title: '预览',
    dataIndex: 'preview',
    key: 'preview',
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: 200,
  },
  {
    title: '使用次数',
    dataIndex: 'usageCount',
    key: 'usageCount',
    width: 100,
  },
];

const categoryTreeData = computed<DataNode[]>(() => {
  const buildTree = (cats: Category[], parentId: number | null = null): DataNode[] => {
    return cats
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        key: c.id,
        title: `${c.name} ${c.materialCount ? `(${c.materialCount})` : ''}`,
        children: c.children ? buildTree(c.children) : buildTree(cats, c.id),
        icon: expandedKeys.value.includes(c.id) ? FolderOpenOutlined : FolderOutlined,
      }));
  };

  return buildTree(categories.value);
});

// ==================== Methods ====================

async function fetchMaterialList() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
    };

    if (activeType.value && activeType.value !== 'ALL') {
      params.type = activeType.value;
    }

    if (keyword.value) {
      params.keyword = keyword.value;
    }

    if (selectedCategoryId.value) {
      params.categoryId = selectedCategoryId.value;
    }

    const res = await request.get<{
      data: Material[];
      total: number;
    }>('/crm/materials', { params });

    materialList.value = res.data || [];
    total.value = res.total || 0;
  } catch (e) {
    console.error(e);
    materialList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function fetchCategories() {
  try {
    const res = await request.get<Category[]>('/crm/materials/categories/tree');
    categories.value = res || [];
  } catch (e) {
    console.error(e);
    categories.value = [];
  }
}

function getTypeIcon(type: MaterialType) {
  const icons: Record<MaterialType, any> = {
    TEXT: FileTextOutlined,
    IMAGE: PictureOutlined,
    VIDEO: VideoCameraOutlined,
    FILE: FileOutlined,
    LINK: LinkOutlined,
    MIXED: FileOutlined,
    ALL: FileOutlined,
  };
  return icons[type] || FileOutlined;
}

function getTypeColor(type: MaterialType): string {
  const colors: Record<MaterialType, string> = {
    TEXT: 'blue',
    IMAGE: 'green',
    VIDEO: 'purple',
    LINK: 'orange',
    FILE: 'default',
    MIXED: 'cyan',
    ALL: 'default',
  };
  return colors[type] || 'default';
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleTypeChange(type: Key) {
  activeType.value = type as MaterialType;
  page.value = 1;
  selectedIds.value = [];
  fetchMaterialList();
}

function handleCategorySelect(selectedKeys: number[]) {
  selectedCategoryId.value = selectedKeys[0] || null;
  page.value = 1;
  fetchMaterialList();
}

function handleSearch() {
  page.value = 1;
  fetchMaterialList();
}

function handlePageChange(p: number, ps: number) {
  page.value = p;
  pageSize.value = ps;
  fetchMaterialList();
}

function handleSelect(id: number, checked: boolean) {
  if (checked) {
    if (props.multiple) {
      if (selectedIds.value.length >= maxSelect.value) {
        message.warning(`最多只能选择 ${maxSelect.value} 个素材`);
        return;
      }
      selectedIds.value = [...selectedIds.value, id];
    } else {
      selectedIds.value = [id];
    }
  } else {
    selectedIds.value = selectedIds.value.filter((i) => i !== id);
  }
}

function handleConfirm() {
  const selected = materialList.value.filter((m) => selectedIds.value.includes(m.id));

  if (selected.length === 0) {
    message.warning('请选择素材');
    return;
  }

  emit('select', selected);
  emit('update:open', false);
  selectedIds.value = [];
}

function handleCancel() {
  emit('update:open', false);
  selectedIds.value = [];
}

// ==================== Watchers ====================

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.type) {
        activeType.value = props.type;
      }
      selectedIds.value = [];
      selectedCategoryId.value = null;
      page.value = 1;
      keyword.value = '';
      fetchCategories();
      fetchMaterialList();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="modalOpen"
    title="选择素材"
    :width="showCategories ? 1000 : 800"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="material-picker-modal">
      <div class="flex gap-4">
        <!-- Category Tree -->
        <div v-if="showCategories" class="w-48 flex-shrink-0">
          <div class="mb-2 font-medium">分类</div>
          <div class="h-[500px] overflow-auto border rounded p-2">
            <Tree
              v-model:expandedKeys="expandedKeys"
              :tree-data="categoryTreeData"
              :show-icon="true"
              @select="handleCategorySelect"
            >
              <template #icon="{ expanded }">
                <FolderOpenOutlined v-if="expanded" />
                <FolderOutlined v-else />
              </template>
            </Tree>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Type Tabs -->
          <Tabs v-if="!type || type === 'ALL'" v-model:activeKey="activeType" @change="handleTypeChange">
            <TabPane v-for="opt in typeOptions" :key="opt.key">
              <template #tab>
                <span class="flex items-center gap-1">
                  <component :is="opt.icon" />
                  {{ opt.label }}
                </span>
              </template>
            </TabPane>
          </Tabs>

          <!-- Search Bar -->
          <div class="mb-4 flex items-center gap-2">
            <Input
              v-model:value="keyword"
              placeholder="搜索素材名称或内容"
              style="width: 280px"
              allow-clear
              @press-enter="handleSearch"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </Input>
            <Button @click="handleSearch">搜索</Button>
            <Button @click="fetchMaterialList">
              <ReloadOutlined />
              刷新
            </Button>

            <div class="ml-auto text-sm text-gray-500">
              已选择 {{ selectedIds.length }}
              <span v-if="multiple"> / {{ maxSelect }}</span>
            </div>
          </div>

          <!-- Material Table -->
          <Spin :spinning="loading">
            <Table
              :columns="columns"
              :data-source="materialList"
              :pagination="{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t: number) => `共 ${t} 条`,
                onChange: handlePageChange,
              }"
              :scroll="{ y: 400 }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'selection'">
                  <Checkbox
                    :checked="selectedIds.includes(record.id)"
                    @change="
                      (e: { target: { checked: boolean } }) => handleSelect(record.id, e.target.checked)
                    "
                  />
                </template>

                <template v-if="column.key === 'preview'">
                  <!-- TODO: Add preview based on material type and mediaIds -->
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded bg-gray-100"
                  >
                    <component
                      :is="getTypeIcon(record.type)"
                      class="text-xl"
                      :class="[`text-${getTypeColor(record.type)}-500`]"
                    />
                  </div>
                </template>

                <template v-if="column.key === 'name'">
                  <div class="flex flex-col gap-1">
                    <span class="font-medium">{{ record.name }}</span>
                    <span v-if="record.description" class="text-xs text-gray-400">
                      {{ record.description }}
                    </span>
                  </div>
                </template>

                <template v-if="column.key === 'type'">
                  <Tag :color="getTypeColor(record.type)" size="small">
                    {{ record.type }}
                  </Tag>
                </template>

                <template v-if="column.key === 'tags'">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="tag in record.tags.slice(0, 3)" :key="tag" size="small">
                      {{ tag }}
                    </Tag>
                    <Tag v-if="record.tags.length > 3" size="small">
                      +{{ record.tags.length - 3 }}
                    </Tag>
                  </div>
                </template>

                <template v-if="column.key === 'usageCount'">
                  <span class="text-blue-500">{{ record.usageCount }}</span>
                </template>
              </template>

              <template #emptyText>
                <Empty description="暂无素材">
                  <Button type="primary" size="small">去创建</Button>
                </Empty>
              </template>
            </Table>
          </Spin>

          <!-- Footer -->
          <div class="mt-4 flex justify-end gap-2">
            <Button @click="handleCancel">取消</Button>
            <Button
              type="primary"
              :disabled="selectedIds.length === 0"
              @click="handleConfirm"
            >
              确认选择 ({{ selectedIds.length }})
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.material-picker-modal :deep(.ant-table-row) {
  cursor: pointer;
}

.material-picker-modal :deep(.ant-table-row:hover) {
  background-color: #f0f7ff;
}

.material-picker-modal :deep(.ant-tree) {
  background: transparent;
}

.material-picker-modal :deep(.ant-tree-node-content-wrapper) {
  flex: 1;
}
</style>
