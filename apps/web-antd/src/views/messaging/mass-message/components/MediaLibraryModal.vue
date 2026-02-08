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
  message,
} from 'ant-design-vue';
import {
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { getMediaList, type WecomMedia } from '#/api/crm';

// ==================== Props & Emits ====================

const props = defineProps<{
  open: boolean;
  type?: 'image' | 'video' | 'file';
  multiple?: boolean;
  maxCount?: number;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', media: WecomMedia[]): void;
}>();

// ==================== State ====================

const loading = ref(false);
const mediaList = ref<WecomMedia[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const activeType = ref<string>(props.type || 'image');
const selectedIds = ref<number[]>([]);

// ==================== Computed ====================

const modalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const maxSelect = computed(() => props.maxCount || 9);

const typeOptions = [
  { key: 'image', label: '图片', icon: PictureOutlined, color: 'blue' },
  { key: 'video', label: '视频', icon: VideoCameraOutlined, color: 'purple' },
  { key: 'file', label: '文件', icon: FileOutlined, color: 'default' },
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
    title: '大小',
    dataIndex: 'fileSize',
    key: 'fileSize',
    width: 100,
  },
  {
    title: '上传时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
  },
];

// ==================== Methods ====================

async function fetchMediaList() {
  loading.value = true;
  try {
    const typeMap: Record<string, string> = {
      image: 'IMAGE',
      video: 'VIDEO',
      file: 'FILE',
    };

    const res = await getMediaList({
      type: typeMap[activeType.value],
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });

    mediaList.value = res.items || [];
    total.value = res.total || 0;
  } catch (e) {
    console.error(e);
    mediaList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
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
  activeType.value = String(type);
  page.value = 1;
  selectedIds.value = [];
  fetchMediaList();
}

function handleSearch() {
  page.value = 1;
  fetchMediaList();
}

function handlePageChange(p: number, ps: number) {
  page.value = p;
  pageSize.value = ps;
  fetchMediaList();
}

function handleSelect(id: number, checked: boolean) {
  if (checked) {
    if (props.multiple) {
      if (selectedIds.value.length >= maxSelect.value) {
        message.warning(`最多只能选择 ${maxSelect.value} 个`);
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
  const selected = mediaList.value.filter((m) =>
    selectedIds.value.includes(m.id),
  );

  // If some selected items are from previous pages, we need to fetch them
  // For simplicity, we'll just use what we have in current list
  // In a real app, you might want to keep track of all selected items across pages

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
      page.value = 1;
      keyword.value = '';
      fetchMediaList();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="modalOpen"
    title="从素材库选择"
    :width="800"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="media-library-modal">
      <!-- Type Tabs -->
      <Tabs
        v-if="!type"
        v-model:activeKey="activeType"
        @change="handleTypeChange"
      >
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
          placeholder="搜索素材名称"
          style="width: 240px"
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </Input>
        <Button @click="handleSearch">搜索</Button>
        <Button @click="fetchMediaList"> <ReloadOutlined /> 刷新 </Button>

        <div class="ml-auto text-sm text-gray-500">
          已选择 {{ selectedIds.length }}
          <span v-if="multiple"> / {{ maxSelect }}</span>
        </div>
      </div>

      <!-- Media Table -->
      <Spin :spinning="loading">
        <Table
          :columns="columns"
          :data-source="mediaList"
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
                  (e: { target: { checked: boolean } }) =>
                    handleSelect(record.id, e.target.checked)
                "
              />
            </template>

            <template v-if="column.key === 'preview'">
              <Image
                v-if="record.type === 'IMAGE' && record.ossUrl"
                :src="record.ossUrl"
                :width="48"
                :height="48"
                class="rounded object-cover"
              />
              <div
                v-else-if="record.type === 'VIDEO'"
                class="flex h-12 w-12 items-center justify-center rounded bg-gray-100"
              >
                <VideoCameraOutlined class="text-xl text-purple-500" />
              </div>
              <div
                v-else
                class="flex h-12 w-12 items-center justify-center rounded bg-gray-100"
              >
                <FileOutlined class="text-xl text-gray-400" />
              </div>
            </template>

            <template v-if="column.key === 'name'">
              <div class="flex items-center gap-2">
                <span>{{ record.name }}</span>
                <Tag v-if="record.wecomMediaId" color="green" size="small">
                  已同步
                </Tag>
              </div>
            </template>

            <template v-if="column.key === 'fileSize'">
              {{ formatFileSize(record.fileSize) }}
            </template>

            <template v-if="column.key === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>

          <template #emptyText>
            <Empty description="暂无素材">
              <Button type="primary" size="small">去上传</Button>
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
  </Modal>
</template>

<style scoped>
.media-library-modal :deep(.ant-table-row) {
  cursor: pointer;
}

.media-library-modal :deep(.ant-table-row:hover) {
  background-color: #f0f7ff;
}
</style>
