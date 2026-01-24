<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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
  ApartmentOutlined,
  CodeOutlined,
  SlidersOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface PipelineItem {
  id: number;
  key: string;
  name: string;
  description: string | null;
  triggerType: string;
  steps: any[];
  isActive: boolean;
  isSystem: boolean;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const loading = ref(false);
const dataSource = ref<PipelineItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新建流程');
const editingKey = ref<string | null>(null);
const formState = ref({
  key: '',
  name: '',
  description: '',
});

const detailVisible = ref(false);
const detailPipeline = ref<PipelineItem | null>(null);

const router = useRouter();

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
    title: '流程标识',
    dataIndex: 'key',
    key: 'key',
    width: 180,
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
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100,
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80,
  },
  {
    title: '步骤数',
    dataIndex: 'steps',
    key: 'steps',
    width: 80,
    customRender: ({ record }: { record: PipelineItem }) => {
      return record.steps?.length || 0;
    },
  },
  {
    title: '发布时间',
    dataIndex: 'publishedAt',
    key: 'publishedAt',
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

    // API returns { data: [...], total, page, pageSize }
    if (response.data) {
      dataSource.value = response.data;
      pagination.value.total = response.total || 0;
    } else if (Array.isArray(response)) {
      dataSource.value = response;
      pagination.value.total = response.length;
    }
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    message.error('获取流程列表失败');
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
  editingKey.value = null;
  formState.value = {
    key: '',
    name: '',
    description: '',
  };
  modalVisible.value = true;
};

const showEdit = (record: PipelineItem) => {
  modalTitle.value = '编辑流程';
  editingKey.value = record.key;
  formState.value = {
    key: record.key,
    name: record.name,
    description: record.description || '',
  };
  modalVisible.value = true;
};

const showDetail = (record: PipelineItem) => {
  detailPipeline.value = record;
  detailVisible.value = true;
};

const showDesign = (record: PipelineItem) => {
  router.push(`/ai-studio/pipeline/edit/${record.key}`);
};

const handleTune = (record: PipelineItem) => {
  router.push(`/ai-studio/pipeline/tune/${record.key}`);
};

const exportAsCode = async (record: PipelineItem) => {
  try {
    const response = await requestClient.get(
      `/ai-studio/pipelines/${record.key}/export`,
      {
        params: { format: 'yaml' },
      },
    );

    // Create download
    const blob = new Blob([response.data || response], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.key}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success('已导出为 YAML 代码');
  } catch (error) {
    console.error('Failed to export pipeline:', error);
    message.error('导出失败');
  }
};

const handleOk = async () => {
  try {
    if (editingKey.value) {
      // Update existing pipeline
      await requestClient.put(`/ai-studio/pipelines/${editingKey.value}`, {
        name: formState.value.name,
        description: formState.value.description,
      });
      message.success('更新成功');
    } else {
      // Create new pipeline with default step
      await requestClient.post('/ai-studio/pipelines', {
        key: formState.value.key,
        name: formState.value.name,
        description: formState.value.description,
        steps: [
          {
            stepKey: 'default_step',
            name: '默认步骤',
            type: 'llm',
            componentRef: {
              type: 'MODEL',
              key: 'qwen-vl-plus',
            },
          },
        ],
      });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (error: any) {
    console.error('Failed to save pipeline:', error);
    const errorMsg = error?.response?.data?.message || '保存失败';
    message.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }
};

const handleExecute = async (record: PipelineItem) => {
  try {
    await requestClient.post(`/ai-studio/pipelines/${record.key}/execute`, {
      inputData: {},
    });
    message.success('流程已开始执行');
    fetchData();
  } catch (error) {
    console.error('Failed to execute pipeline:', error);
    message.error('执行失败');
  }
};

const handleDuplicate = async (record: PipelineItem) => {
  try {
    const newKey = `${record.key}-copy-${Date.now()}`;
    await requestClient.post(`/ai-studio/pipelines/${record.key}/duplicate`, {
      newKey,
      newName: `${record.name} (副本)`,
    });
    message.success('复制成功');
    fetchData();
  } catch (error) {
    console.error('Failed to duplicate pipeline:', error);
    message.error('复制失败');
  }
};

const handleDelete = async (key: string) => {
  try {
    await requestClient.delete(`/ai-studio/pipelines/${key}`);
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
          <template v-if="column.key === 'isActive'">
            <Tag :color="record.isActive ? 'green' : 'default'">
              {{ record.isActive ? '已启用' : '已禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Tooltip title="查看详情">
                <Button type="link" size="small" @click="showDetail(record)">
                  <template #icon><EyeOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip v-if="record.isSystem" title="参数调优">
                <Button type="link" size="small" @click="handleTune(record)">
                  <template #icon><SlidersOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip v-else title="设计流程">
                <Button type="link" size="small" @click="showDesign(record)">
                  <template #icon><ApartmentOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="执行流程">
                <Button
                  type="link"
                  size="small"
                  @click="handleExecute(record)"
                  :disabled="!record.publishedAt"
                >
                  <template #icon><PlayCircleOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button type="link" size="small" @click="showEdit(record)">
                  <template #icon><EditOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="参数调优">
                <Button type="link" size="small" @click="handleTune(record)">
                  <template #icon><SlidersOutlined /></template>
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
              <Tooltip title="导出代码">
                <Button type="link" size="small" @click="exportAsCode(record)">
                  <template #icon><CodeOutlined /></template>
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除这个流程吗？"
                @confirm="handleDelete(record.key)"
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
        <Form.Item label="流程标识" required v-if="!editingKey">
          <Input
            v-model:value="formState.key"
            placeholder="请输入流程标识（英文、数字、下划线、中划线）"
            :disabled="!!editingKey"
          />
          <div class="form-hint">
            流程标识创建后不可修改，建议使用小写字母和中划线
          </div>
        </Form.Item>

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
          <label>流程标识：</label>
          <span>{{ detailPipeline.key }}</span>
        </div>
        <div class="detail-item">
          <label>流程名称：</label>
          <span>{{ detailPipeline.name }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <span>
            <Tag :color="detailPipeline.isActive ? 'green' : 'default'">
              {{ detailPipeline.isActive ? '已启用' : '已禁用' }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>版本：</label>
          <span>v{{ detailPipeline.version }}</span>
        </div>
        <div class="detail-item">
          <label>步骤数：</label>
          <span>{{ detailPipeline.steps?.length || 0 }}</span>
        </div>
        <div class="detail-item">
          <label>描述：</label>
          <span>{{ detailPipeline.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>发布时间：</label>
          <span>{{
            detailPipeline.publishedAt
              ? dayjs(detailPipeline.publishedAt).format('YYYY-MM-DD HH:mm:ss')
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

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);
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
