<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import {
  Button,
  Space,
  message,
  Tag,
  Card,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tree,
  Empty,
} from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  LinkOutlined,
  FileTextOutlined,
  EyeOutlined,
  SendOutlined,
  FolderOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import { useCrudTable, useModalForm } from '#/composables';

// ==================== 类型定义 ====================

interface MaterialItem {
  id: number;
  name: string;
  description: string | null;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'FILE' | 'MIXED';
  content: string | null;
  mediaIds: number[];
  linkUrl: string | null;
  linkTitle: string | null;
  categoryId: number | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  usageCount: number;
  likeCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryItem {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  children?: CategoryItem[];
  materialCount?: number;
}

interface MaterialFormState {
  name: string;
  description: string;
  type: MaterialItem['type'];
  content: string;
  mediaIds: number[];
  linkUrl: string;
  linkTitle: string;
  categoryId: number | null;
  tags: string[];
  isPublic: boolean;
}

interface MaterialFilters {
  keyword?: string;
  type?: string;
  status?: string;
  categoryId?: number | null;
}

// ==================== 分类状态 ====================

const categories = ref<CategoryItem[]>([]);
const selectedCategoryId = ref<number | null>(null);
const categoryModalVisible = ref(false);
const categoryFormState = ref({
  name: '',
  parentId: null as number | null,
});

// ==================== 常量 ====================

const materialTypes = [
  { key: 'TEXT', icon: FileTextOutlined, label: '文本' },
  { key: 'IMAGE', icon: PictureOutlined, label: '图片' },
  { key: 'VIDEO', icon: VideoCameraOutlined, label: '视频' },
  { key: 'FILE', icon: FileOutlined, label: '文件' },
  { key: 'LINK', icon: LinkOutlined, label: '链接' },
  { key: 'MIXED', icon: FolderOutlined, label: '图文' },
];

const columns = [
  { title: '素材名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '内容预览', dataIndex: 'content', key: 'content', width: 300, ellipsis: true },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '分类', dataIndex: 'categoryName', key: 'categoryName', width: 100 },
  { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 80, sorter: true },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100, sorter: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const },
];

const tagPresets = [
  { label: '产品', value: '产品' },
  { label: '活动', value: '活动' },
  { label: '节日', value: '节日' },
  { label: '促销', value: '促销' },
  { label: '公告', value: '公告' },
];

const typeLabels: Record<MaterialItem['type'], string> = {
  TEXT: '文本',
  IMAGE: '图片',
  VIDEO: '视频',
  FILE: '文件',
  LINK: '链接',
  MIXED: '图文',
};

// ==================== 计算属性 ====================

const categoryTreeData = computed(() => {
  const buildTree = (items: CategoryItem[], parentId: number | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        key: item.id,
        title: `${item.name} (${item.materialCount || 0})`,
        children: buildTree(items, item.id),
      }));
  };
  return [{ key: null, title: '全部分类', children: buildTree(categories.value) }];
});

// ==================== 表格逻辑 ====================

const { tableProps, filters, search, fetchData, handleDelete } = useCrudTable<
  MaterialItem,
  MaterialFilters
>({
  fetchApi: async (params) => {
    const apiParams: Record<string, unknown> = {
      page: params.page,
      pageSize: params.pageSize,
    };
    if (params.keyword) apiParams.keyword = params.keyword;
    if (params.type) apiParams.type = params.type;
    if (params.status) apiParams.status = params.status;
    if (selectedCategoryId.value) apiParams.categoryId = selectedCategoryId.value;

    const res = await requestClient.get<{ data: MaterialItem[]; total: number }>(
      '/crm/materials',
      { params: apiParams },
    );
    return { items: res.data || [], total: res.total || 0 };
  },
  deleteApi: async (id) => {
    await requestClient.delete(`/crm/materials/${id}`);
  },
  initialFilters: { status: 'ACTIVE' },
});

// ==================== Modal 逻辑 ====================

const { visible, formState, isEditing, openCreate, openEdit, submit } =
  useModalForm<MaterialFormState>({
    createApi: async (data) => {
      await requestClient.post('/crm/materials', {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        content: data.content || undefined,
        mediaIds: data.mediaIds.length ? data.mediaIds : undefined,
        linkUrl: data.linkUrl || undefined,
        linkTitle: data.linkTitle || undefined,
        categoryId: data.categoryId || undefined,
        tags: data.tags.length ? data.tags : undefined,
        isPublic: data.isPublic,
      });
    },
    updateApi: async (id, data) => {
      await requestClient.put(`/crm/materials/${id}`, {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        content: data.content || undefined,
        mediaIds: data.mediaIds.length ? data.mediaIds : undefined,
        linkUrl: data.linkUrl || undefined,
        linkTitle: data.linkTitle || undefined,
        categoryId: data.categoryId || undefined,
        tags: data.tags.length ? data.tags : undefined,
        isPublic: data.isPublic,
      });
    },
    initialValues: () => ({
      name: '',
      description: '',
      type: 'TEXT',
      content: '',
      mediaIds: [],
      linkUrl: '',
      linkTitle: '',
      categoryId: null,
      tags: [],
      isPublic: true,
    }),
    afterSubmit: fetchData,
  });

// ==================== 分类相关 ====================

async function fetchCategories() {
  try {
    const res = await requestClient.get<CategoryItem[]>('/crm/materials/categories/tree');
    categories.value = flattenCategories(res);
  } catch (e) {
    console.error(e);
  }
}

function flattenCategories(items: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  function traverse(list: CategoryItem[]) {
    for (const item of list) {
      result.push(item);
      if (item.children?.length) {
        traverse(item.children);
      }
    }
  }
  traverse(items);
  return result;
}

async function handleCreateCategory() {
  if (!categoryFormState.value.name) {
    message.warning('请输入分类名称');
    return;
  }

  try {
    await requestClient.post('/crm/materials/categories', {
      name: categoryFormState.value.name,
      parentId: categoryFormState.value.parentId || undefined,
    });
    message.success('分类创建成功');
    categoryModalVisible.value = false;
    categoryFormState.value = { name: '', parentId: null };
    fetchCategories();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '创建分类失败';
    message.error(errorMessage);
  }
}

// ==================== 事件处理 ====================

function handleEdit(material: MaterialItem) {
  openEdit(material.id, {
    name: material.name,
    description: material.description || '',
    type: material.type,
    content: material.content || '',
    mediaIds: material.mediaIds || [],
    linkUrl: material.linkUrl || '',
    linkTitle: material.linkTitle || '',
    categoryId: material.categoryId,
    tags: material.tags || [],
    isPublic: material.isPublic,
  });
}

function handleCategorySelect(selectedKeys: (string | number)[]) {
  selectedCategoryId.value = selectedKeys[0] as number | null;
  search();
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchCategories();
  fetchData();
});
</script>

<template>
  <div class="flex h-full gap-4 p-5">
    <!-- Left: Category Tree -->
    <Card class="w-64 flex-shrink-0" title="素材分类">
      <template #extra>
        <Button type="link" size="small" @click="categoryModalVisible = true">
          <PlusOutlined /> 添加
        </Button>
      </template>
      <Tree
        v-if="categoryTreeData.length"
        :tree-data="categoryTreeData"
        :selected-keys="[selectedCategoryId]"
        default-expand-all
        @select="handleCategorySelect"
      />
      <Empty v-else description="暂无分类" />
    </Card>

    <!-- Right: Material List -->
    <Card class="flex-1" title="素材列表">
      <template #extra>
        <Button type="primary" @click="openCreate">
          <PlusOutlined /> 添加素材
        </Button>
      </template>

      <!-- Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-4 rounded bg-gray-50 p-4">
        <Input
          v-model:value="filters.keyword"
          placeholder="搜索素材名称/内容"
          style="width: 200px"
          allow-clear
          @press-enter="search"
        />

        <Select
          v-model:value="filters.type"
          placeholder="素材类型"
          style="width: 120px"
          allow-clear
        >
          <Select.Option v-for="t in materialTypes" :key="t.key" :value="t.key">
            {{ t.label }}
          </Select.Option>
        </Select>

        <Select
          v-model:value="filters.status"
          placeholder="状态"
          style="width: 100px"
          allow-clear
        >
          <Select.Option value="ACTIVE">启用</Select.Option>
          <Select.Option value="DRAFT">草稿</Select.Option>
          <Select.Option value="ARCHIVED">归档</Select.Option>
        </Select>

        <Button type="primary" @click="search">搜索</Button>
      </div>

      <!-- Table -->
      <Table v-bind="tableProps" :columns="columns" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="font-medium">{{ record.name }}</div>
            <div v-if="record.tags?.length" class="mt-1">
              <Tag v-for="tag in record.tags.slice(0, 3)" :key="tag" size="small">
                {{ tag }}
              </Tag>
              <span v-if="record.tags.length > 3" class="text-xs text-gray-400">
                +{{ record.tags.length - 3 }}
              </span>
            </div>
          </template>

          <template v-if="column.key === 'content'">
            <div class="line-clamp-2 text-sm text-gray-600">
              {{ record.content || record.linkUrl || '-' }}
            </div>
          </template>

          <template v-if="column.key === 'type'">
            <Tag :color="record.type === 'TEXT' ? 'blue' : record.type === 'IMAGE' ? 'green' : 'orange'">
              {{ typeLabels[record.type] }}
            </Tag>
          </template>

          <template v-if="column.key === 'viewCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <EyeOutlined />
              {{ record.viewCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'usageCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <SendOutlined />
              {{ record.usageCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-if="column.key === 'actions'">
            <Space>
              <Button
                type="link"
                size="small"
                @click="handleEdit(record as MaterialItem)"
              >
                <EditOutlined /> 编辑
              </Button>
              <Popconfirm
                title="确定要删除吗？"
                @confirm="handleDelete((record as MaterialItem).id)"
              >
                <Button type="link" size="small" danger>
                  <DeleteOutlined /> 删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create/Edit Modal -->
    <Modal
      v-model:open="visible"
      :title="isEditing ? '编辑素材' : '添加素材'"
      width="700px"
      @ok="submit"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="素材名称" required>
          <Input
            v-model:value="formState.name"
            placeholder="输入素材名称"
            :maxlength="100"
          />
        </Form.Item>

        <Form.Item label="素材描述">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="简要描述素材用途"
            :rows="2"
            :maxlength="500"
          />
        </Form.Item>

        <Form.Item label="素材类型">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="type in materialTypes"
              :key="type.key"
              :type="formState.type === type.key ? 'primary' : 'default'"
              @click="formState.type = type.key as MaterialItem['type']"
            >
              <component :is="type.icon" /> {{ type.label }}
            </Button>
          </div>
        </Form.Item>

        <Form.Item v-if="['TEXT', 'MIXED'].includes(formState.type)" label="文本内容">
          <Input.TextArea
            v-model:value="formState.content"
            placeholder="输入素材文本内容..."
            :rows="4"
            :maxlength="2000"
            show-count
          />
        </Form.Item>

        <Form.Item v-if="formState.type === 'LINK'" label="链接地址">
          <Input v-model:value="formState.linkUrl" placeholder="https://" />
        </Form.Item>

        <Form.Item v-if="formState.type === 'LINK'" label="链接标题">
          <Input v-model:value="formState.linkTitle" placeholder="链接显示标题" />
        </Form.Item>

        <Form.Item label="所属分类">
          <Select
            v-model:value="formState.categoryId"
            placeholder="选择分类"
            allow-clear
            style="width: 200px"
          >
            <Select.Option
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="标签">
          <Select
            v-model:value="formState.tags"
            mode="tags"
            placeholder="添加标签，便于分类管理"
            :token-separators="[',', '，']"
          >
            <Select.Option v-for="tag in tagPresets" :key="tag.value" :value="tag.value">
              {{ tag.label }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- Category Modal -->
    <Modal
      v-model:open="categoryModalVisible"
      title="添加分类"
      @ok="handleCreateCategory"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="分类名称" required>
          <Input v-model:value="categoryFormState.name" placeholder="输入分类名称" />
        </Form.Item>
        <Form.Item label="上级分类">
          <Select
            v-model:value="categoryFormState.parentId"
            placeholder="选择上级分类（可选）"
            allow-clear
          >
            <Select.Option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
