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
  Upload,
  DatePicker,
  Tabs,
  TabPane,
  Radio,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Image,
  Badge,
} from 'ant-design-vue';
import type { UploadProps, UploadFile } from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  CommentOutlined,
  EyeOutlined,
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  LinkOutlined,
  AppstoreOutlined,
  BellOutlined,
  ExportOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

// Types
interface MomentTask {
  id: number;
  name: string;
  text: string;
  attachments: any[];
  visibleType: string;
  senderList: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdBy: string;
  createdAt: string;
}

interface MaterialItem {
  id: number;
  title: string;
  type: string;
  url: string;
  thumbnail: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdBy: string;
  createdAt: string;
}

// State
const activeTab = ref('create');
const loading = ref(false);
const moments = ref<MomentTask[]>([]);
const materials = ref<MaterialItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// Filters
const filters = ref({
  createdBy: '',
  status: '',
  dateRange: null as [string, string] | null,
  minLikes: undefined as number | undefined,
  minComments: undefined as number | undefined,
  minViews: undefined as number | undefined,
});

// Create form
const createForm = ref({
  visibleType: 'ALL',
  customerIds: [] as number[],
  text: '',
  attachments: [] as UploadFile[],
});

// Modal
const customerSelectVisible = ref(false);

// Attachment types
const attachmentTypes = [
  { key: 'image', icon: PictureOutlined, label: '图片' },
  { key: 'video', icon: VideoCameraOutlined, label: '视频' },
  { key: 'file', icon: FileOutlined, label: '文件' },
  { key: 'link', icon: LinkOutlined, label: '网页' },
  { key: 'miniprogram', icon: AppstoreOutlined, label: '小程序' },
];

// Status map
const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待发送', color: 'default' },
  SUBMITTED: { label: '已提交', color: 'processing' },
  POLLING: { label: '处理中', color: 'processing' },
  PUBLISHED: { label: '已发布', color: 'success' },
  COMPLETED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
  CANCELLED: { label: '已取消', color: 'default' },
};

// Table columns
const historyColumns = [
  { title: '内容', dataIndex: 'text', key: 'text', ellipsis: true, width: 300 },
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
    title: '浏览',
    dataIndex: 'viewCount',
    key: 'viewCount',
    width: 80,
    sorter: true,
  },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '发表情况', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
  },
];

const materialColumns = [
  { title: '内容', dataIndex: 'title', key: 'title', ellipsis: true },
  {
    title: '点赞',
    dataIndex: 'likeCount',
    key: 'likeCount',
    sorter: true,
  },
  {
    title: '评论',
    dataIndex: 'commentCount',
    key: 'commentCount',
    sorter: true,
  },
  {
    title: '收藏',
    key: 'favoriteCount',
  },
  {
    title: '浏览',
    dataIndex: 'viewCount',
    key: 'viewCount',
    sorter: true,
  },
  { title: '使用次数', key: 'usageCount' },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'actions',
    width: 150,
  },
];

// API calls
async function fetchMoments() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    if (filters.value.createdBy) params.createdBy = filters.value.createdBy;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.dateRange) {
      params.startDate = filters.value.dateRange[0];
      params.endDate = filters.value.dateRange[1];
    }
    if (filters.value.minLikes) params.minLikes = filters.value.minLikes;
    if (filters.value.minComments)
      params.minComments = filters.value.minComments;
    if (filters.value.minViews) params.minViews = filters.value.minViews;

    const res = await requestClient.get<{ items: MomentTask[]; total: number }>(
      '/moments',
      { params },
    );
    moments.value = res.items || [];
    total.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchMaterials() {
  loading.value = true;
  try {
    const res = await requestClient.get<{
      items: MaterialItem[];
      total: number;
    }>('/moments/materials', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
      },
    });
    materials.value = res.items || [];
    total.value = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function handlePublish() {
  if (!createForm.value.text && createForm.value.attachments.length === 0) {
    message.warning('请输入内容或添加附件');
    return;
  }

  loading.value = true;
  try {
    await requestClient.post('/moments', {
      text: createForm.value.text,
      visibleType: createForm.value.visibleType,
      customerIds: createForm.value.customerIds,
      attachments: createForm.value.attachments.map((f) => ({
        type: f.type,
        url: f.response?.url || f.url,
        name: f.name,
      })),
    });
    message.success('已通知成员发表');
    createForm.value = {
      visibleType: 'ALL',
      customerIds: [],
      text: '',
      attachments: [],
    };
  } catch (e: any) {
    message.error(e.message || '发布失败');
  } finally {
    loading.value = false;
  }
}

async function handleRemind(id: number) {
  try {
    await requestClient.post(`/moments/${id}/remind`);
    message.success('已发送提醒');
  } catch (e: any) {
    message.error(e.message || '提醒失败');
  }
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/moments/${id}`);
    message.success('删除成功');
    fetchMoments();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

function handleTabChange(key: string) {
  activeTab.value = key;
  currentPage.value = 1;
  if (key === 'history') {
    fetchMoments();
  } else if (key === 'materials') {
    fetchMaterials();
  }
}

function handlePageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
  if (activeTab.value === 'history') {
    fetchMoments();
  } else if (activeTab.value === 'materials') {
    fetchMaterials();
  }
}

function handleUploadChange(info: { fileList: UploadFile[] }) {
  createForm.value.attachments = info.fileList;
}

function handleSelectCustomers() {
  customerSelectVisible.value = true;
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY年MM月DD日');
}

onMounted(() => {
  // Default to create tab, no data fetch needed
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-bold">企业发表到客户的朋友圈</h2>
      <p class="text-gray-500">
        管理员或负责人编辑内容，选择可见的客户，成员确认后发表到客户的朋友圈
      </p>
    </div>

    <Card>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- Create Tab -->
        <TabPane key="create" tab="新建内容">
          <div class="max-w-3xl">
            <Form layout="vertical">
              <Form.Item label="可见的客户">
                <div class="flex items-center">
                  <Radio.Group v-model:value="createForm.visibleType">
                    <Radio value="ALL">公开</Radio>
                    <Radio value="FILTERED">按条件筛选的客户</Radio>
                  </Radio.Group>
                  <Button
                    v-if="createForm.visibleType === 'FILTERED'"
                    type="link"
                    @click="handleSelectCustomers"
                  >
                    选择客户
                  </Button>
                </div>
              </Form.Item>

              <Form.Item label="内容">
                <Input.TextArea
                  v-model:value="createForm.text"
                  placeholder="输入内容..."
                  :rows="4"
                  :maxlength="2000"
                  show-count
                />
              </Form.Item>

              <Form.Item>
                <div class="rounded border border-dashed p-4">
                  <div class="mb-2 text-gray-500">
                    + 添加图片/视频/网页（仅支持pg图片格式... mp4的视频格式）
                  </div>
                  <div class="flex gap-2">
                    <Button
                      v-for="type in attachmentTypes"
                      :key="type.key"
                      class="flex h-16 w-16 flex-col items-center justify-center"
                    >
                      <component :is="type.icon" class="text-lg" />
                      <span class="mt-1 text-xs">{{ type.label }}</span>
                    </Button>
                  </div>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  :loading="loading"
                  @click="handlePublish"
                >
                  通知成员发表
                </Button>
              </Form.Item>
            </Form>
          </div>
        </TabPane>

        <!-- History Tab -->
        <TabPane key="history" tab="企业发表记录">
          <!-- Filters -->
          <div class="mb-4 flex flex-wrap gap-4">
            <Select
              v-model:value="filters.createdBy"
              placeholder="创建人：全部"
              style="width: 140px"
              allow-clear
            >
              <Select.Option value="">全部</Select.Option>
            </Select>

            <Select
              v-model:value="filters.status"
              placeholder="发表情况：全部"
              style="width: 140px"
              allow-clear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="PUBLISHED">已发布</Select.Option>
              <Select.Option value="PENDING">待发送</Select.Option>
            </Select>

            <DatePicker.RangePicker
              v-model:value="filters.dateRange"
              format="YYYY年MM月DD日"
              placeholder="['开始时间', '结束时间']"
            />

            <div class="flex items-center gap-2 rounded bg-orange-50 px-3 py-1">
              <span class="text-orange-600">点赞量【大于等于】</span>
              <Input
                v-model:value="filters.minLikes"
                type="number"
                style="width: 80px"
                size="small"
              />
            </div>

            <div class="flex items-center gap-2 rounded bg-orange-50 px-3 py-1">
              <span class="text-orange-600">评论量【大于等于】</span>
              <Input
                v-model:value="filters.minComments"
                type="number"
                style="width: 80px"
                size="small"
              />
            </div>

            <div class="flex items-center gap-2 rounded bg-orange-50 px-3 py-1">
              <span class="text-orange-600">浏览量【大于等于】</span>
              <Input
                v-model:value="filters.minViews"
                type="number"
                style="width: 80px"
                size="small"
              />
            </div>

            <Button type="primary" @click="fetchMoments">查询</Button>

            <Button class="ml-auto"> <ExportOutlined /> 导出 </Button>
          </div>

          <!-- Actions -->
          <div class="mb-4">
            <Button type="link" class="text-red-500">
              <BellOutlined /> 提醒成员发表
            </Button>
            <span class="ml-4 text-red-500">支持提醒成员发表的功能</span>
          </div>

          <Table
            :columns="historyColumns"
            :data-source="moments"
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
              <template v-if="column.key === 'text'">
                <div class="flex items-start gap-2">
                  <Image
                    v-if="record.attachments?.[0]?.thumbnail"
                    :src="record.attachments[0].thumbnail"
                    :width="48"
                    :height="48"
                    class="rounded"
                  />
                  <div class="flex-1">
                    <div class="line-clamp-2">{{ record.text }}</div>
                  </div>
                </div>
              </template>

              <template v-if="column.key === 'likeCount'">
                <div class="flex items-center gap-1">
                  <LikeOutlined class="text-gray-400" />
                  {{ record.likeCount || 0 }}
                </div>
              </template>

              <template v-if="column.key === 'commentCount'">
                <div class="flex items-center gap-1">
                  <CommentOutlined class="text-gray-400" />
                  {{ record.commentCount || 0 }}
                </div>
              </template>

              <template v-if="column.key === 'viewCount'">
                <div class="flex items-center gap-1">
                  <EyeOutlined class="text-gray-400" />
                  {{ record.viewCount || 0 }}
                </div>
              </template>

              <template v-if="column.key === 'status'">
                <Tag :color="statusMap[record.status]?.color || 'default'">
                  {{ statusMap[record.status]?.label || record.status }}
                </Tag>
                <div
                  v-if="record.publishedAt"
                  class="mt-1 text-xs text-gray-400"
                >
                  {{ record.senderList?.length || 0 }}名成员已发表到{{
                    record.viewCount || 0
                  }}位客户的...
                </div>
              </template>

              <template v-if="column.key === 'actions'">
                <Space>
                  <Button
                    type="link"
                    size="small"
                    @click="handleRemind(record.id)"
                  >
                    提醒
                  </Button>
                  <Popconfirm
                    title="确定要删除吗？"
                    @confirm="handleDelete(record.id)"
                  >
                    <Button type="link" size="small" danger> 删除 </Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- Materials Tab -->
        <TabPane key="materials" tab="素材库">
          <!-- Filters -->
          <div class="mb-4 flex flex-wrap gap-4 rounded bg-gray-50 p-4">
            <div class="flex items-center gap-2">
              <span>筛选条件:</span>
              <Input placeholder="活动标题【包含】" style="width: 160px" />
            </div>
            <Input placeholder="创建人【在之中】" style="width: 160px" />
            <Input placeholder="创建时间【大于等于】" style="width: 160px" />
            <Input placeholder="创建时间【小于】" style="width: 160px" />
            <Button type="primary">筛选</Button>
          </div>

          <!-- Add button -->
          <div class="mb-4">
            <Button type="primary"> <PlusOutlined /> 添加素材 </Button>
          </div>

          <Table
            :columns="materialColumns"
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
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <div class="flex items-start gap-2">
                  <Image
                    v-if="record.thumbnail"
                    :src="record.thumbnail"
                    :width="48"
                    :height="48"
                    class="rounded"
                  />
                  <div class="flex-1">{{ record.title }}</div>
                </div>
              </template>

              <template v-if="column.key === 'actions'">
                <Space>
                  <Button type="link" size="small">
                    <EditOutlined /> 编辑
                  </Button>
                  <Button type="link" size="small" danger>
                    <DeleteOutlined /> 删除
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- Customer Select Modal -->
    <Modal
      v-model:open="customerSelectVisible"
      title="选择可见的客户"
      width="600px"
      @ok="customerSelectVisible = false"
    >
      <div class="py-4">
        <Radio.Group v-model:value="createForm.visibleType" class="w-full">
          <div class="space-y-4">
            <Radio value="ALL" class="w-full">
              <span>公开</span>
              <span class="ml-2 text-gray-400">所有客户可见</span>
            </Radio>
            <Radio value="FILTERED" class="w-full">
              <span>按条件筛选的客户</span>
              <span class="ml-2 text-gray-400">只有符合条件的客户可见</span>
            </Radio>
          </div>
        </Radio.Group>
      </div>
    </Modal>
  </div>
</template>
