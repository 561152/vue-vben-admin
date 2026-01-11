<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
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
} from 'ant-design-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface CampaignItem {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: string;
  totalTarget: number;
  totalSent: number;
  totalDelivered: number;
  approvedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

const loading = ref(false);
const dataSource = ref<CampaignItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新增营销活动');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  description: '',
  type: 'MASS_MESSAGE',
});

// Detail drawer
const detailVisible = ref(false);
const detailCampaign = ref<CampaignItem | null>(null);

const typeOptions = [
  { value: 'MASS_MESSAGE', label: '群发消息', color: 'blue' },
  { value: 'WELCOME_MESSAGE', label: '入群欢迎语', color: 'green' },
  { value: 'AUTO_REPLY', label: '自动回复', color: 'orange' },
];

const statusOptions = [
  { value: 'DRAFT', label: '草稿', color: 'default' },
  { value: 'PENDING_APPROVAL', label: '待审批', color: 'orange' },
  { value: 'APPROVED', label: '已通过', color: 'green' },
  { value: 'REJECTED', label: '已拒绝', color: 'red' },
  { value: 'SCHEDULED', label: '已定时', color: 'cyan' },
  { value: 'EXECUTING', label: '执行中', color: 'blue' },
  { value: 'COMPLETED', label: '已完成', color: 'success' },
  { value: 'PAUSED', label: '已暂停', color: 'warning' },
  { value: 'CANCELLED', label: '已取消', color: 'default' },
];

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '活动名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '目标人数',
    dataIndex: 'totalTarget',
    key: 'totalTarget',
    width: 100,
  },
  {
    title: '已发送',
    dataIndex: 'totalSent',
    key: 'totalSent',
    width: 100,
  },
  {
    title: '已送达',
    dataIndex: 'totalDelivered',
    key: 'totalDelivered',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right' as const,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/crm/campaigns', {
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
    console.error('Failed to fetch campaigns:', error);
    message.error('获取营销活动列表失败');
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
  modalTitle.value = '新增营销活动';
  editingId.value = null;
  formState.value = {
    name: '',
    description: '',
    type: 'MASS_MESSAGE',
  };
  modalVisible.value = true;
};

const showEdit = (record: CampaignItem) => {
  modalTitle.value = '编辑营销活动';
  editingId.value = record.id;
  formState.value = {
    name: record.name,
    description: record.description || '',
    type: record.type,
  };
  modalVisible.value = true;
};

const showDetail = (record: CampaignItem) => {
  detailCampaign.value = record;
  detailVisible.value = true;
};

const handleOk = async () => {
  try {
    if (editingId.value) {
      // Update
      await requestClient.put(`/crm/campaigns/${editingId.value}`, formState.value);
      message.success('更新成功');
    } else {
      // Create
      await requestClient.post('/crm/campaigns', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save campaign:', error);
    message.error('保存失败');
  }
};

const handleDelete = async (id: number) => {
  try {
    await requestClient.delete(`/crm/campaigns/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="campaign-list">
    <Card title="营销活动管理">
      <template #extra>
        <Button type="primary" @click="showCreate">新增活动</Button>
      </template>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag :color="typeOptions.find(opt => opt.value === record.type)?.color">
              {{ typeOptions.find(opt => opt.value === record.type)?.label || record.type }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusOptions.find(opt => opt.value === record.status)?.color">
              {{ statusOptions.find(opt => opt.value === record.status)?.label || record.status }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showDetail(record)">详情</Button>
              <Button type="link" size="small" @click="showEdit(record)">编辑</Button>
              <Popconfirm
                title="确定要删除这个营销活动吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <Button type="link" danger size="small">删除</Button>
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
        <Form.Item label="活动名称" required>
          <Input v-model:value="formState.name" placeholder="请输入活动名称" />
        </Form.Item>

        <Form.Item label="活动类型">
          <Select v-model:value="formState.type" :options="typeOptions" />
        </Form.Item>

        <Form.Item label="活动描述">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="请输入活动描述"
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailVisible"
      title="营销活动详情"
      width="600"
      placement="right"
    >
      <div v-if="detailCampaign" class="campaign-detail">
        <div class="detail-item">
          <label>活动ID：</label>
          <span>{{ detailCampaign.id }}</span>
        </div>
        <div class="detail-item">
          <label>活动名称：</label>
          <span>{{ detailCampaign.name }}</span>
        </div>
        <div class="detail-item">
          <label>活动类型：</label>
          <span>
            <Tag :color="typeOptions.find(opt => opt.value === detailCampaign.type)?.color">
              {{ typeOptions.find(opt => opt.value === detailCampaign.type)?.label }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>活动状态：</label>
          <span>
            <Tag :color="statusOptions.find(opt => opt.value === detailCampaign.status)?.color">
              {{ statusOptions.find(opt => opt.value === detailCampaign.status)?.label }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>目标人数：</label>
          <span>{{ detailCampaign.totalTarget }}</span>
        </div>
        <div class="detail-item">
          <label>已发送：</label>
          <span>{{ detailCampaign.totalSent }}</span>
        </div>
        <div class="detail-item">
          <label>已送达：</label>
          <span>{{ detailCampaign.totalDelivered }}</span>
        </div>
        <div class="detail-item">
          <label>活动描述：</label>
          <span>{{ detailCampaign.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>创建时间：</label>
          <span>{{ dayjs(detailCampaign.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.campaign-list {
  padding: 20px;
}

.campaign-detail {
  .detail-item {
    margin-bottom: 16px;
    display: flex;
    align-items: flex-start;

    label {
      font-weight: 500;
      min-width: 100px;
      color: rgba(0, 0, 0, 0.65);
    }

    span {
      flex: 1;
      color: rgba(0, 0, 0, 0.85);
    }
  }
}
</style>
