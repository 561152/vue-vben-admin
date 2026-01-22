<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import {
  Button,
  Space,
  Modal,
  message,
  Tag,
  Card,
  Upload,
  Image,
  Row,
  Col,
  Spin,
  Empty,
  Popconfirm,
  Select,
  Input,
  Pagination,
} from 'ant-design-vue';
import {
  PlusOutlined,
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileOutlined,
  InboxOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import type { UploadProps } from 'ant-design-vue';
import {
  getMediaList,
  uploadMedia,
  deleteMedia,
  type WecomMedia,
} from '#/api/crm';
import dayjs from 'dayjs';

const router = useRouter();
const loading = ref(false);
const uploading = ref(false);
const dataSource = ref<WecomMedia[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const uploadModalVisible = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
const filterType = ref<string | undefined>(undefined);
const searchKeyword = ref('');

const typeOptions = [
  { value: 'IMAGE', label: '图片', icon: FileImageOutlined, color: 'blue' },
  { value: 'VIDEO', label: '视频', icon: VideoCameraOutlined, color: 'purple' },
  { value: 'FILE', label: '文件', icon: FileOutlined, color: 'orange' },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (filterType.value) params.type = filterType.value;
    if (searchKeyword.value) params.keyword = searchKeyword.value;

    const res = await getMediaList(params);
    dataSource.value = res.data || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleUpload() {
  uploadModalVisible.value = true;
}

const customUpload: UploadProps['customRequest'] = async (options) => {
  const { file, onSuccess, onError } = options;
  uploading.value = true;

  try {
    const res = await uploadMedia(file as File);
    message.success('上传成功');
    onSuccess?.(res);
    uploadModalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '上传失败');
    onError?.(e);
  } finally {
    uploading.value = false;
  }
};

async function handleDelete(id: number) {
  try {
    await deleteMedia(id);
    message.success('删除成功');
    fetchData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

function handlePreview(item: WecomMedia) {
  if (item.type === 'IMAGE' && item.ossUrl) {
    previewUrl.value = item.ossUrl;
    previewVisible.value = true;
  }
}

function handlePageChange(page: number, pageSize: number) {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
  fetchData();
}

function handleFilter() {
  pagination.value.current = 1;
  fetchData();
}

function handleResetFilter() {
  filterType.value = undefined;
  searchKeyword.value = '';
  pagination.value.current = 1;
  fetchData();
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTypeInfo(type: string) {
  return typeOptions.find((t) => t.value === type) || typeOptions[2];
}

function goToStatistics() {
  router.push('/crm/media/statistics');
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">素材库</h2>
      <Space>
        <Button @click="goToStatistics">
          <BarChartOutlined /> 统计分析
        </Button>
        <Button type="primary" @click="handleUpload">
          <CloudUploadOutlined /> 上传素材
        </Button>
      </Space>
    </div>

    <!-- Filters -->
    <Card class="mb-4" size="small">
      <Space wrap>
        <span class="text-gray-500">类型:</span>
        <Select
          v-model:value="filterType"
          :options="[{ value: '', label: '全部' }, ...typeOptions]"
          placeholder="选择类型"
          style="width: 120px"
          allow-clear
        />
        <span class="ml-4 text-gray-500">名称:</span>
        <Input
          v-model:value="searchKeyword"
          placeholder="搜索素材名称"
          style="width: 200px"
          allow-clear
          @press-enter="handleFilter"
        />
        <Button type="primary" @click="handleFilter">搜索</Button>
        <Button @click="handleResetFilter">重置</Button>
      </Space>
    </Card>

    <!-- Media Grid -->
    <Spin :spinning="loading">
      <div v-if="dataSource.length > 0">
        <Row :gutter="[16, 16]">
          <Col
            v-for="item in dataSource"
            :key="item.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            :xl="4"
          >
            <Card
              hoverable
              class="media-card"
              :body-style="{ padding: '12px' }"
            >
              <!-- Preview Area -->
              <div
                class="media-preview mb-2 flex items-center justify-center rounded bg-gray-100"
                style="height: 120px"
                @click="handlePreview(item)"
              >
                <template v-if="item.type === 'IMAGE' && item.ossUrl">
                  <img
                    :src="item.ossUrl"
                    :alt="item.name"
                    class="max-h-full max-w-full object-contain"
                  />
                </template>
                <template v-else-if="item.type === 'VIDEO'">
                  <VideoCameraOutlined
                    style="font-size: 48px; color: #8c8c8c"
                  />
                </template>
                <template v-else>
                  <FileOutlined style="font-size: 48px; color: #8c8c8c" />
                </template>
              </div>

              <!-- Info -->
              <div class="truncate text-sm font-medium" :title="item.name">
                {{ item.name }}
              </div>
              <div
                class="flex items-center justify-between text-xs text-gray-400"
              >
                <Tag :color="getTypeInfo(item.type).color" size="small">
                  {{ getTypeInfo(item.type).label }}
                </Tag>
                <span>{{ formatFileSize(item.fileSize) }}</span>
              </div>
              <div class="mt-1 text-xs text-gray-400">
                {{ dayjs(item.createdAt).format('YYYY-MM-DD') }}
              </div>

              <!-- Actions -->
              <div class="mt-2 flex justify-end gap-2">
                <Button
                  v-if="item.type === 'IMAGE'"
                  type="text"
                  size="small"
                  @click="handlePreview(item)"
                >
                  <EyeOutlined />
                </Button>
                <Popconfirm
                  title="确定删除此素材吗？"
                  @confirm="handleDelete(item.id)"
                >
                  <Button type="text" size="small" danger>
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          </Col>
        </Row>

        <!-- Pagination -->
        <div class="mt-4 flex justify-end">
          <Pagination
            v-model:current="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            show-size-changer
            show-quick-jumper
            :show-total="(total: number) => `共 ${total} 个素材`"
            @change="handlePageChange"
          />
        </div>
      </div>

      <Empty v-else description="暂无素材" />
    </Spin>

    <!-- Upload Modal -->
    <Modal
      v-model:open="uploadModalVisible"
      title="上传素材"
      :footer="null"
      width="500px"
    >
      <Upload.Dragger
        :custom-request="customUpload"
        :show-upload-list="false"
        :disabled="uploading"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      >
        <Spin :spinning="uploading">
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">
            支持图片、视频、文档等格式<br />
            图片最大 2MB，视频最大 10MB，文件最大 20MB
          </p>
        </Spin>
      </Upload.Dragger>
    </Modal>

    <!-- Image Preview -->
    <Image
      :style="{ display: 'none' }"
      :preview="{
        visible: previewVisible,
        onVisibleChange: (vis: boolean) => (previewVisible = vis),
      }"
      :src="previewUrl"
    />
  </div>
</template>

<style scoped>
.media-card {
  transition: all 0.3s;
}

.media-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.media-preview {
  overflow: hidden;
  cursor: pointer;
}
</style>
