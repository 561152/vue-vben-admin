<script lang="ts" setup>
import { ref, onMounted } from 'vue';
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
  Upload,
  Popconfirm,
  Image,
  Tabs,
  TabPane,
} from 'ant-design-vue';
import type { UploadFile, UploadProps } from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  LinkOutlined,
  AppstoreOutlined,
  LikeOutlined,
  CommentOutlined,
  StarOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

// Types
interface MaterialItem {
  id: number;
  title: string;
  content: string;
  type: string;
  url: string;
  thumbnail: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  viewCount: number;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

// State
const loading = ref(false);
const materials = ref<MaterialItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// Filters
const filters = ref({
  keyword: '',
  type: '',
  createdBy: '',
  tags: [] as string[],
});

// Modal
const createModalVisible = ref(false);
const editingMaterial = ref<MaterialItem | null>(null);

// Form
const formState = ref({
  title: '',
  content: '',
  type: 'TEXT',
  attachments: [] as UploadFile[],
  tags: [] as string[],
});

// Material types
const materialTypes = [
  { key: 'IMAGE', icon: PictureOutlined, label: '图片' },
  { key: 'VIDEO', icon: VideoCameraOutlined, label: '视频' },
  { key: 'FILE', icon: FileOutlined, label: '文件' },
  { key: 'LINK', icon: LinkOutlined, label: '网页' },
  { key: 'MINIPROGRAM', icon: AppstoreOutlined, label: '小程序' },
];

// Table columns
const columns = [
  { title: '素材内容', dataIndex: 'content', key: 'content', width: 300 },
  {
    title: '点赞',
    dataIndex: 'likeCount',
    key: 'likeCount',
    width: 80,
    sorter: true,
  },
  {
    title: '评论',
    dataIndex: 'commentCount',
    key: 'commentCount',
    width: 80,
    sorter: true,
  },
  {
    title: '收藏',
    dataIndex: 'favoriteCount',
    key: 'favoriteCount',
    width: 80,
    sorter: true,
  },
  {
    title: '浏览',
    dataIndex: 'viewCount',
    key: 'viewCount',
    width: 80,
    sorter: true,
  },
  {
    title: '使用次数',
    dataIndex: 'usageCount',
    key: 'usageCount',
    width: 100,
  },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right' as const,
  },
];

// Tag presets for filtering
const tagPresets = [
  { label: '10月', value: '10月' },
  { label: '11月', value: '11月' },
  { label: '12月', value: '12月' },
  { label: '本地', value: '本地' },
  { label: '外地', value: '外地' },
  { label: '公众号', value: '公众号' },
  { label: '导购', value: '导购' },
  { label: '活动引入', value: '活动引入' },
];

// Category presets
const categoryPresets = [
  { label: '店庆', value: '店庆' },
  { label: '周末', value: '周末' },
];

// API calls
async function fetchMaterials() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    if (filters.value.keyword) params.keyword = filters.value.keyword;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.createdBy) params.createdBy = filters.value.createdBy;
    if (filters.value.tags.length) params.tags = filters.value.tags.join(',');

    const res = await requestClient.get<{ items: MaterialItem[]; total: number }>(
      '/materials',
      { params },
    );
    materials.value = res.items || [];
    total.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!formState.value.content && formState.value.attachments.length === 0) {
    message.warning('请输入内容或添加附件');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      title: formState.value.title,
      content: formState.value.content,
      type: formState.value.type,
      attachments: formState.value.attachments.map((f) => ({
        type: f.type,
        url: f.response?.url || f.url,
        name: f.name,
      })),
      tags: formState.value.tags,
    };

    if (editingMaterial.value) {
      await requestClient.put(`/materials/${editingMaterial.value.id}`, payload);
      message.success('素材更新成功');
    } else {
      await requestClient.post('/materials', payload);
      message.success('素材创建成功');
    }

    createModalVisible.value = false;
    resetForm();
    fetchMaterials();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/materials/${id}`);
    message.success('删除成功');
    fetchMaterials();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

function handleEdit(material: MaterialItem) {
  editingMaterial.value = material;
  formState.value = {
    title: material.title,
    content: material.content,
    type: material.type,
    attachments: [],
    tags: material.tags || [],
  };
  createModalVisible.value = true;
}

function handleOpenCreate() {
  editingMaterial.value = null;
  resetForm();
  createModalVisible.value = true;
}

function resetForm() {
  formState.value = {
    title: '',
    content: '',
    type: 'TEXT',
    attachments: [],
    tags: [],
  };
}

function handlePageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
  fetchMaterials();
}

function handleUploadChange(info: { fileList: UploadFile[] }) {
  formState.value.attachments = info.fileList;
}

onMounted(() => {
  fetchMaterials();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-bold">素材库</h2>
      <p class="text-gray-500">可添加产品、活动、节日问候等内容，便于成员群发消息时使用，提升营销效率</p>
    </div>

    <Card>
      <!-- Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-4 rounded bg-gray-50 p-4">
        <div class="flex items-center gap-2">
          <span class="font-medium">筛选条件:</span>
          <Input
            v-model:value="filters.keyword"
            placeholder="活动标题【包含】"
            style="width: 160px"
            allow-clear
          />
        </div>

        <Input placeholder="创建人【在之中】" style="width: 160px" allow-clear />

        <Input placeholder="创建时间【大于等于】" style="width: 180px" allow-clear />

        <Input placeholder="创建时间【小于】" style="width: 160px" allow-clear />

        <Button type="primary" @click="fetchMaterials">筛选</Button>
      </div>

      <!-- Tags filter -->
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="text-gray-500">选择标签:</span>
        <Tag
          v-for="tag in tagPresets"
          :key="tag.value"
          :color="filters.tags.includes(tag.value) ? 'blue' : 'default'"
          class="cursor-pointer"
          @click="
            filters.tags.includes(tag.value)
              ? filters.tags.splice(filters.tags.indexOf(tag.value), 1)
              : filters.tags.push(tag.value)
          "
        >
          {{ tag.label }}
        </Tag>
      </div>

      <!-- Category filter -->
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="text-gray-500">地区:</span>
        <Tag class="cursor-pointer">本地</Tag>
        <Tag class="cursor-pointer">外地</Tag>
        <span class="ml-4 text-gray-500">入会路径:</span>
        <Tag class="cursor-pointer">公众号</Tag>
        <Tag class="cursor-pointer">导购</Tag>
        <Tag class="cursor-pointer">活动引入</Tag>
      </div>

      <!-- Actions -->
      <div class="mb-4 flex justify-between">
        <Button type="primary" @click="handleOpenCreate">
          <PlusOutlined /> 添加素材
        </Button>
      </div>

      <!-- Table -->
      <Table
        :columns="columns"
        :data-source="materials"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'content'">
            <div class="flex items-start gap-2">
              <Image
                v-if="record.thumbnail"
                :src="record.thumbnail"
                :width="60"
                :height="60"
                class="rounded flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="font-medium line-clamp-1">{{ record.title }}</div>
                <div class="text-gray-500 text-sm line-clamp-2">{{ record.content }}</div>
                <div v-if="record.tags?.length" class="mt-1">
                  <Tag v-for="tag in record.tags.slice(0, 3)" :key="tag" size="small">
                    {{ tag }}
                  </Tag>
                </div>
              </div>
            </div>
          </template>

          <template v-if="column.key === 'likeCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <LikeOutlined />
              {{ record.likeCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'commentCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <CommentOutlined />
              {{ record.commentCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'favoriteCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <StarOutlined />
              {{ record.favoriteCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'viewCount'">
            <div class="flex items-center gap-1 text-gray-500">
              <EyeOutlined />
              {{ record.viewCount || 0 }}
            </div>
          </template>

          <template v-if="column.key === 'actions'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                <EditOutlined /> 编辑
              </Button>
              <Popconfirm
                title="确定要删除吗？"
                @confirm="handleDelete(record.id)"
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
      v-model:open="createModalVisible"
      :title="editingMaterial ? '编辑素材' : '添加素材'"
      width="600px"
      @ok="handleCreate"
      :confirmLoading="loading"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="素材标题">
          <Input
            v-model:value="formState.title"
            placeholder="可输入产品、活动、节日问候等内容"
          />
        </Form.Item>

        <Form.Item label="素材内容">
          <Input.TextArea
            v-model:value="formState.content"
            placeholder="输入素材内容..."
            :rows="4"
            :maxlength="2000"
            show-count
          />
        </Form.Item>

        <Form.Item label="添加附件">
          <div class="rounded border border-dashed p-4">
            <div class="flex gap-2">
              <Button
                v-for="type in materialTypes"
                :key="type.key"
                class="flex flex-col items-center justify-center h-16 w-16"
                :type="formState.type === type.key ? 'primary' : 'default'"
                @click="formState.type = type.key"
              >
                <component :is="type.icon" class="text-lg" />
                <span class="text-xs mt-1">{{ type.label }}</span>
              </Button>
            </div>
            <div class="mt-4">
              <Upload
                v-model:fileList="formState.attachments"
                list-type="picture-card"
                :max-count="9"
                @change="handleUploadChange"
              >
                <div>
                  <PlusOutlined />
                  <div class="mt-1 text-xs">添加图片等附件</div>
                </div>
              </Upload>
            </div>
          </div>
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
  </div>
</template>
