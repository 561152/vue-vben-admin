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
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Drawer,
  Tabs,
  TabPane,
} from 'ant-design-vue';
import {
  SendOutlined,
  MessageOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  getDirectMessages,
  sendDirectMessage,
  sendBatchDirectMessages,
  getMessageTemplates,
  getCustomers,
  type DirectMessage,
  type MessageTemplate,
  type Customer,
} from '#/api/crm';
import dayjs from 'dayjs';

const loading = ref(false);
const dataSource = ref<DirectMessage[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const sendModalVisible = ref(false);
const batchModalVisible = ref(false);
const detailDrawerVisible = ref(false);
const selectedMessage = ref<DirectMessage | null>(null);

const customers = ref<Customer[]>([]);
const templates = ref<MessageTemplate[]>([]);
const filterStatus = ref<string | undefined>(undefined);

const formState = ref({
  customerId: undefined as number | undefined,
  textContent: '',
  templateId: undefined as number | undefined,
});

const batchFormState = ref({
  customerIds: [] as number[],
  textContent: '',
  templateId: undefined as number | undefined,
});

const statusOptions = [
  { value: 'PENDING', label: '待发送', color: 'default' },
  { value: 'SENDING', label: '发送中', color: 'processing' },
  { value: 'SENT', label: '已发送', color: 'success' },
  { value: 'DELIVERED', label: '已送达', color: 'success' },
  { value: 'FAILED', label: '失败', color: 'error' },
];

const columns = [
  {
    title: '客户',
    key: 'customer',
    width: 200,
  },
  {
    title: '消息内容',
    dataIndex: ['content', 'text'],
    key: 'content',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = statusOptions.find((o) => o.value === text);
      return h(Tag, { color: opt?.color || 'default' }, () => opt?.label || text);
    },
  },
  {
    title: '发送时间',
    dataIndex: 'sentAt',
    key: 'sentAt',
    width: 160,
    customRender: ({ text }: { text: string | null }) => {
      if (!text) return '-';
      return dayjs(text).format('MM-DD HH:mm');
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    customRender: ({ text }: { text: string }) =>
      dayjs(text).format('MM-DD HH:mm'),
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (filterStatus.value) params.status = filterStatus.value;

    const res = await getDirectMessages(params);
    dataSource.value = res.data || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchCustomers() {
  try {
    const res = await getCustomers({ pageSize: 100 });
    customers.value = res.items || [];
  } catch (e) {
    console.error(e);
  }
}

async function fetchTemplates() {
  try {
    const res = await getMessageTemplates({ isActive: true, pageSize: 100 });
    templates.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
}

function handleSend() {
  formState.value = {
    customerId: undefined,
    textContent: '',
    templateId: undefined,
  };
  sendModalVisible.value = true;
}

function handleBatchSend() {
  batchFormState.value = {
    customerIds: [],
    textContent: '',
    templateId: undefined,
  };
  batchModalVisible.value = true;
}

async function handleSubmitSend() {
  if (!formState.value.customerId) {
    message.warning('请选择客户');
    return;
  }
  if (!formState.value.textContent && !formState.value.templateId) {
    message.warning('请输入消息内容或选择模板');
    return;
  }

  try {
    await sendDirectMessage({
      customerId: formState.value.customerId,
      textContent: formState.value.textContent || undefined,
      templateId: formState.value.templateId,
    });
    message.success('消息已发送');
    sendModalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '发送失败');
  }
}

async function handleSubmitBatch() {
  if (!batchFormState.value.customerIds.length) {
    message.warning('请选择客户');
    return;
  }
  if (!batchFormState.value.textContent && !batchFormState.value.templateId) {
    message.warning('请输入消息内容或选择模板');
    return;
  }

  try {
    const res = await sendBatchDirectMessages({
      customerIds: batchFormState.value.customerIds,
      textContent: batchFormState.value.textContent || undefined,
      templateId: batchFormState.value.templateId,
    });
    message.success(`成功发送 ${res.successCount}/${res.totalCount} 条消息`);
    batchModalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '发送失败');
  }
}

function handleViewDetail(record: DirectMessage) {
  selectedMessage.value = record;
  detailDrawerVisible.value = true;
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

function handleFilter() {
  pagination.value.current = 1;
  fetchData();
}

function handleTemplateChange(templateId: number | undefined) {
  if (templateId) {
    const template = templates.value.find((t) => t.id === templateId);
    if (template) {
      formState.value.textContent = template.content.text || '';
    }
  }
}

function handleBatchTemplateChange(templateId: number | undefined) {
  if (templateId) {
    const template = templates.value.find((t) => t.id === templateId);
    if (template) {
      batchFormState.value.textContent = template.content.text || '';
    }
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'SENT':
    case 'DELIVERED':
      return h(CheckCircleOutlined, { style: { color: '#52c41a' } });
    case 'FAILED':
      return h(CloseCircleOutlined, { style: { color: '#ff4d4f' } });
    case 'SENDING':
      return h(ReloadOutlined, { spin: true, style: { color: '#1890ff' } });
    default:
      return h(ClockCircleOutlined, { style: { color: '#d9d9d9' } });
  }
}

onMounted(() => {
  fetchData();
  fetchCustomers();
  fetchTemplates();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">消息推送</h2>
      <Space>
        <Button type="primary" @click="handleSend">
          <SendOutlined /> 发送消息
        </Button>
        <Button @click="handleBatchSend">
          <MessageOutlined /> 批量发送
        </Button>
      </Space>
    </div>

    <!-- Filters -->
    <Card class="mb-4" size="small">
      <Space wrap>
        <span class="text-gray-500">状态:</span>
        <Select
          v-model:value="filterStatus"
          :options="[{ value: '', label: '全部' }, ...statusOptions]"
          placeholder="选择状态"
          style="width: 120px"
          allow-clear
          @change="handleFilter"
        />
        <Button type="primary" @click="fetchData">
          <ReloadOutlined /> 刷新
        </Button>
      </Space>
    </Card>

    <!-- Table -->
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 900 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'customer'">
          <div class="flex items-center gap-2">
            <Avatar :size="32">
              <template #icon><UserOutlined /></template>
            </Avatar>
            <div>
              <div class="font-medium">{{ record.customerName || '未知客户' }}</div>
              <div class="text-xs text-gray-400">{{ record.externalUserid }}</div>
            </div>
          </div>
        </template>
        <template v-if="column.key === 'action'">
          <Button type="link" size="small" @click="handleViewDetail(record)">
            详情
          </Button>
        </template>
      </template>
    </Table>

    <!-- Send Modal -->
    <Modal
      v-model:open="sendModalVisible"
      title="发送消息"
      @ok="handleSubmitSend"
      width="500px"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="选择客户" required>
          <Select
            v-model:value="formState.customerId"
            placeholder="请选择客户"
            show-search
            :filter-option="
              (input: string, option: any) =>
                option.label.toLowerCase().includes(input.toLowerCase())
            "
            :options="customers.map((c) => ({ value: c.id, label: c.name }))"
          />
        </Form.Item>
        <Form.Item label="选择模板">
          <Select
            v-model:value="formState.templateId"
            placeholder="选择消息模板（可选）"
            allow-clear
            :options="templates.map((t) => ({ value: t.id, label: t.name }))"
            @change="handleTemplateChange"
          />
        </Form.Item>
        <Form.Item label="消息内容" required>
          <Input.TextArea
            v-model:value="formState.textContent"
            placeholder="请输入消息内容"
            :rows="4"
            :maxlength="2048"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Batch Send Modal -->
    <Modal
      v-model:open="batchModalVisible"
      title="批量发送消息"
      @ok="handleSubmitBatch"
      width="500px"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="选择客户" required>
          <Select
            v-model:value="batchFormState.customerIds"
            mode="multiple"
            placeholder="请选择客户（可多选）"
            show-search
            :filter-option="
              (input: string, option: any) =>
                option.label.toLowerCase().includes(input.toLowerCase())
            "
            :options="customers.map((c) => ({ value: c.id, label: c.name }))"
            :max-tag-count="3"
          />
        </Form.Item>
        <Form.Item label="选择模板">
          <Select
            v-model:value="batchFormState.templateId"
            placeholder="选择消息模板（可选）"
            allow-clear
            :options="templates.map((t) => ({ value: t.id, label: t.name }))"
            @change="handleBatchTemplateChange"
          />
        </Form.Item>
        <Form.Item label="消息内容" required>
          <Input.TextArea
            v-model:value="batchFormState.textContent"
            placeholder="请输入消息内容"
            :rows="4"
            :maxlength="2048"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailDrawerVisible"
      title="消息详情"
      width="400"
    >
      <template v-if="selectedMessage">
        <div class="space-y-4">
          <div>
            <div class="text-gray-500 text-sm">客户</div>
            <div class="font-medium">{{ selectedMessage.customerName || '未知客户' }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm">状态</div>
            <div class="flex items-center gap-2">
              <component :is="() => getStatusIcon(selectedMessage!.status)" />
              <span>{{ statusOptions.find(o => o.value === selectedMessage?.status)?.label }}</span>
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-sm">消息内容</div>
            <div class="bg-gray-50 p-3 rounded mt-1">
              {{ selectedMessage.content?.text || '无文本内容' }}
            </div>
          </div>
          <div v-if="selectedMessage.failReason">
            <div class="text-gray-500 text-sm">失败原因</div>
            <div class="text-red-500">{{ selectedMessage.failReason }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm">创建时间</div>
            <div>{{ dayjs(selectedMessage.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</div>
          </div>
          <div v-if="selectedMessage.sentAt">
            <div class="text-gray-500 text-sm">发送时间</div>
            <div>{{ dayjs(selectedMessage.sentAt).format('YYYY-MM-DD HH:mm:ss') }}</div>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
