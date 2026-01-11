<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Popconfirm,
  Card,
  Drawer,
  Tooltip,
} from 'ant-design-vue';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface PipelineItem {
  id: number;
  name: string;
  description: string | null;
  status: string;
  version: number;
  nodeCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const loading = ref(false);
const dataSource = ref<PipelineItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新建流程');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  description: '',
});

const detailVisible = ref(false);
const detailPipeline = ref<PipelineItem | null>(null);

const statusOptions = [
  { value: 'DRAFT', label: '草稿', color: 'default' },
  { value: 'PUBLISHED', label: '已发布', color: 'green' },
  { value: 'DEPRECATED', label: '已废弃', color: 'red' },
];

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '流程名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 250,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80,
  },
  {
    title: '节点数',
    dataIndex: 'nodeCount',
    key: 'nodeCount',
    width: 80,
  },
  {
    title: '最后执行',
    dataIndex: 'lastExecutedAt',
    key: 'lastExecutedAt',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right' as const,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/ai-studio/pipelines', {
      params: {
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
      },
    });

    if (response.list) {
      dataSource.value = response.list;
      pagination.value.total = response.total || 0;
    }
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    // Mock data for demo
    dataSource.value = [
      {
        id: 1,
        name: '客户智能分析流程',
        description: '基于客户行为数据进行智能分析和标签生成',
        status: 'PUBLISHED',
        version: 3,
        nodeCount: 8,
        lastExecutedAt: '2024-01-10T10:30:00Z',
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-10T10:30:00Z',
      },
      {
        id: 2,
        name: '自动回复生成流程',
        description: '根据客户消息自动生成智能回复',
        status: 'PUBLISHED',
        version: 2,
        nodeCount: 5,
        lastExecutedAt: '2024-01-09T15:20:00Z',
        createdAt: '2024-01-02T09:00:00Z',
        updatedAt: '2024-01-09T15:20:00Z',
      },
      {
        id: 3,
        name: '营销内容生成流程',
        description: '基于产品信息自动生成营销文案',
        status: 'DRAFT',
        version: 1,
        nodeCount: 6,
        lastExecutedAt: null,
        createdAt: '2024-01-08T14:00:00Z',
        updatedAt: '2024-01-08T14:00:00Z',
      },
    ];
    pagination.value.total = 3;
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
};

const showCreate = () => {
  modalTitle.value = '新建流程';
  editingId.value = null;
  formState.value = {
    name: '',
    description: '',
  };
  modalVisible.value = true;
};

const showEdit = (record: PipelineItem) => {
  modalTitle.value = '编辑流程';
  editingId.value = record.id;
  formState.value = {
    name: record.name,
    description: record.description || '',
  };
  modalVisible.value = true;
};

const showDetail = (record: PipelineItem) => {
  detailPipeline.value = record;
  detailVisible.value = true;
};

const handleOk = async () => {
  try {
    if (editingId.value) {
      await requestClient.put(
        `/ai-studio/pipelines/${editingId.value}`,
        formState.value,
      );
      message.success('更新成功');
    } else {
      await requestClient.post('/ai-studio/pipelines', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save pipeline:', error);
    message.error('保存失败');
  }
};

const handleExecute = async (record: PipelineItem) => {
  try {
    await requestClient.post(`/ai-studio/pipelines/${record.id}/execute`);
    message.success('流程已开始执行');
    fetchData();
  } catch (error) {
    console.error('Failed to execute pipeline:', error);
    message.error('执行失败');
  }
};

const handleDuplicate = async (record: PipelineItem) => {
  try {
    await requestClient.post(`/ai-studio/pipelines/${record.id}/duplicate`);
    message.success('复制成功');
    fetchData();
  } catch (error) {
    console.error('Failed to duplicate pipeline:', error);
    message.error('复制失败');
  }
};

const handleDelete = async (id: number) => {
  try {
    await requestClient.delete(`/ai-studio/pipelines/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    console.error('Failed to delete pipeline:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="pipeline-list">
    <Card title="流程管理">
      <template #extra>
        <Button type="primary" @click="showCreate">
          <template #icon><PlusOutlined /></template>
          新建流程
        </Button>
      </template>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag
              :color="
                statusOptions.find((opt) => opt.value === record.status)?.color
              "
            >
              {{
                statusOptions.find((opt) => opt.value === record.status)
                  ?.label || record.status
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Tooltip title="查看详情">
                <Button type="link" size="small" @click="showDetail(record)">
                  <template #icon><EyeOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="执行流程">
                <Button
                  type="link"
                  size="small"
                  @click="handleExecute(record)"
                  :disabled="record.status !== 'PUBLISHED'"
                >
                  <template #icon><PlayCircleOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button type="link" size="small" @click="showEdit(record)">
                  <template #icon><EditOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="复制">
                <Button
                  type="link"
                  size="small"
                  @click="handleDuplicate(record)"
                >
                  <template #icon><CopyOutlined /></template>
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除这个流程吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <Tooltip title="删除">
                  <Button type="link" danger size="small">
                    <template #icon><DeleteOutlined /></template>
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Edit Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      width="600px"
    >
      <Form :model="formState" layout="vertical">
        <Form.Item label="流程名称" required>
          <Input v-model:value="formState.name" placeholder="请输入流程名称" />
        </Form.Item>

        <Form.Item label="流程描述">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="请输入流程描述"
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailVisible"
      title="流程详情"
      width="600"
      placement="right"
    >
      <div v-if="detailPipeline" class="pipeline-detail">
        <div class="detail-item">
          <label>流程ID：</label>
          <span>{{ detailPipeline.id }}</span>
        </div>
        <div class="detail-item">
          <label>流程名称：</label>
          <span>{{ detailPipeline.name }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <span>
            <Tag
              :color="
                statusOptions.find((opt) => opt.value === detailPipeline.status)
                  ?.color
              "
            >
              {{
                statusOptions.find((opt) => opt.value === detailPipeline.status)
                  ?.label
              }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>版本：</label>
          <span>v{{ detailPipeline.version }}</span>
        </div>
        <div class="detail-item">
          <label>节点数：</label>
          <span>{{ detailPipeline.nodeCount }}</span>
        </div>
        <div class="detail-item">
          <label>描述：</label>
          <span>{{ detailPipeline.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>最后执行：</label>
          <span>{{
            detailPipeline.lastExecutedAt
              ? dayjs(detailPipeline.lastExecutedAt).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              : '-'
          }}</span>
        </div>
        <div class="detail-item">
          <label>更新时间：</label>
          <span>{{
            dayjs(detailPipeline.updatedAt).format('YYYY-MM-DD HH:mm:ss')
          }}</span>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.pipeline-list {
  padding: 20px;
}

.pipeline-detail {
  .detail-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;

    label {
      min-width: 100px;
      font-weight: 500;
      color: rgb(0 0 0 / 65%);
    }

    span {
      flex: 1;
      color: rgb(0 0 0 / 85%);
    }
  }
}
</style>
