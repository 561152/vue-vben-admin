<script lang="ts" setup>
import { ref, computed, onMounted, h, watch } from 'vue';
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
  Avatar,
  Drawer,
  Tabs,
  TabPane,
  Checkbox,
  Alert,
  Spin,
} from 'ant-design-vue';
import {
  SendOutlined,
  MessageOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  ExperimentOutlined,
} from '@ant-design/icons-vue';
import {
  getDirectMessages,
  sendDirectMessage,
  sendBatchDirectMessages,
  getMessageTemplates,
  getCustomers,
  getEmployees,
  getEmployeeCustomers,
  sendToEmployees,
  sendTestMessage,
  type DirectMessage,
  type MessageTemplate,
  type Customer,
  type WecomEmployee,
  type EmployeeCustomer,
} from '#/api/crm';
import dayjs from 'dayjs';

// ==================== State ====================

const loading = ref(false);
const dataSource = ref<DirectMessage[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const sendModalVisible = ref(false);
const detailDrawerVisible = ref(false);
const selectedMessage = ref<DirectMessage | null>(null);

const customers = ref<Customer[]>([]);
const templates = ref<MessageTemplate[]>([]);
const employees = ref<WecomEmployee[]>([]);
const employeeCustomers = ref<EmployeeCustomer[]>([]);
const filterStatus = ref<string | undefined>(undefined);

// Send mode: CUSTOMER | EMPLOYEE | TEST
const sendMode = ref<'CUSTOMER' | 'EMPLOYEE' | 'TEST'>('CUSTOMER');

// Customer mode form
const customerFormState = ref({
  customerId: undefined as number | undefined,
  customerIds: [] as number[],
  textContent: '',
  templateId: undefined as number | undefined,
  isBatch: false,
});

// Employee mode form
const employeeFormState = ref({
  wecomUserIds: [] as string[],
  textContent: '',
  templateId: undefined as number | undefined,
  allowSelect: false,
});

// Test mode form
const testFormState = ref({
  selectedEmployeeId: undefined as string | undefined,
  customerId: undefined as number | undefined,
  textContent: '',
  templateId: undefined as number | undefined,
});

const employeeLoading = ref(false);
const employeeCustomersLoading = ref(false);
const employeeSearchKeyword = ref('');

// ==================== Computed ====================

const selectedEmployeesCustomerCount = computed(() => {
  return employees.value
    .filter((e) => employeeFormState.value.wecomUserIds.includes(e.wecomUserId))
    .reduce((sum, e) => sum + e.customerCount, 0);
});

// ==================== Status Options ====================

const statusOptions = [
  { value: 'PENDING', label: '待发送', color: 'default' },
  { value: 'SENDING', label: '发送中', color: 'processing' },
  { value: 'SENT', label: '已发送', color: 'success' },
  { value: 'DELIVERED', label: '已送达', color: 'success' },
  { value: 'FAILED', label: '失败', color: 'error' },
];

// ==================== Table Columns ====================

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
    title: '类型',
    dataIndex: 'messageType',
    key: 'messageType',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const typeMap: Record<string, { label: string; color: string }> = {
        SINGLE: { label: '单发', color: 'blue' },
        EMPLOYEE_BATCH: { label: '员工批量', color: 'purple' },
        TEST: { label: '测试', color: 'orange' },
        WELCOME: { label: '欢迎语', color: 'green' },
      };
      const opt = typeMap[text] || { label: text, color: 'default' };
      return h(Tag, { color: opt.color }, () => opt.label);
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = statusOptions.find((o) => o.value === text);
      return h(
        Tag,
        { color: opt?.color || 'default' },
        () => opt?.label || text,
      );
    },
  },
  {
    title: '发送时间',
    dataIndex: 'sentAt',
    key: 'sentAt',
    width: 140,
    customRender: ({ text }: { text: string | null }) => {
      if (!text) return '-';
      return dayjs(text).format('MM-DD HH:mm');
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right' as const,
  },
];

// ==================== Data Fetching ====================

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

async function fetchEmployees(keyword?: string) {
  employeeLoading.value = true;
  try {
    const params: Record<string, unknown> = { pageSize: 200 };
    if (keyword) {
      params.keyword = keyword;
    }
    const res = await getEmployees(params);
    employees.value = res.items || [];
  } catch (e) {
    console.error(e);
  } finally {
    employeeLoading.value = false;
  }
}

// 防抖搜索员工
let employeeSearchTimer: ReturnType<typeof setTimeout> | null = null;
function handleEmployeeSearch(keyword: string) {
  employeeSearchKeyword.value = keyword;
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }
  employeeSearchTimer = setTimeout(() => {
    fetchEmployees(keyword);
  }, 300);
}

async function fetchEmployeeCustomers(wecomUserId: string) {
  employeeCustomersLoading.value = true;
  try {
    const res = await getEmployeeCustomers(wecomUserId, { pageSize: 100 });
    employeeCustomers.value = res.items || [];
  } catch (e) {
    console.error(e);
    employeeCustomers.value = [];
  } finally {
    employeeCustomersLoading.value = false;
  }
}

// ==================== Event Handlers ====================

function handleOpenSendModal() {
  // Reset all forms
  customerFormState.value = {
    customerId: undefined,
    customerIds: [],
    textContent: '',
    templateId: undefined,
    isBatch: false,
  };
  employeeFormState.value = {
    wecomUserIds: [],
    textContent: '',
    templateId: undefined,
    allowSelect: false,
  };
  testFormState.value = {
    selectedEmployeeId: undefined,
    customerId: undefined,
    textContent: '',
    templateId: undefined,
  };
  employeeCustomers.value = [];
  sendModalVisible.value = true;
}

async function handleSubmitSend() {
  try {
    if (sendMode.value === 'CUSTOMER') {
      await handleCustomerSend();
    } else if (sendMode.value === 'EMPLOYEE') {
      await handleEmployeeSend();
    } else if (sendMode.value === 'TEST') {
      await handleTestSend();
    }
    sendModalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '发送失败');
  }
}

async function handleCustomerSend() {
  if (customerFormState.value.isBatch) {
    if (!customerFormState.value.customerIds.length) {
      message.warning('请选择客户');
      return;
    }
    if (
      !customerFormState.value.textContent &&
      !customerFormState.value.templateId
    ) {
      message.warning('请输入消息内容或选择模板');
      return;
    }
    const res = await sendBatchDirectMessages({
      customerIds: customerFormState.value.customerIds,
      textContent: customerFormState.value.textContent || undefined,
      templateId: customerFormState.value.templateId,
    });
    message.success(`成功发送 ${res.successCount}/${res.totalCount} 条消息`);
  } else {
    if (!customerFormState.value.customerId) {
      message.warning('请选择客户');
      return;
    }
    if (
      !customerFormState.value.textContent &&
      !customerFormState.value.templateId
    ) {
      message.warning('请输入消息内容或选择模板');
      return;
    }
    await sendDirectMessage({
      customerId: customerFormState.value.customerId,
      textContent: customerFormState.value.textContent || undefined,
      templateId: customerFormState.value.templateId,
    });
    message.success('消息已发送');
  }
}

async function handleEmployeeSend() {
  if (!employeeFormState.value.wecomUserIds.length) {
    message.warning('请选择员工');
    return;
  }
  if (
    !employeeFormState.value.textContent &&
    !employeeFormState.value.templateId
  ) {
    message.warning('请输入消息内容或选择模板');
    return;
  }

  const res = await sendToEmployees({
    wecomUserIds: employeeFormState.value.wecomUserIds,
    textContent: employeeFormState.value.textContent || undefined,
    templateId: employeeFormState.value.templateId,
    allowSelect: employeeFormState.value.allowSelect,
  });

  const successCount = res.results.filter((r) => r.status === 'SENT').length;
  if (res.success) {
    message.success(
      `已向 ${successCount}/${res.totalEmployees} 个员工推送消息，共 ${res.totalCustomers} 个客户`,
    );
  } else {
    message.warning('部分发送失败，请查看详情');
  }
}

async function handleTestSend() {
  if (!testFormState.value.customerId) {
    message.warning('请选择测试客户');
    return;
  }
  if (!testFormState.value.textContent && !testFormState.value.templateId) {
    message.warning('请输入消息内容或选择模板');
    return;
  }

  const res = await sendTestMessage({
    customerId: testFormState.value.customerId,
    textContent: testFormState.value.textContent || undefined,
    templateId: testFormState.value.templateId,
  });

  if (res.status === 'SENT') {
    message.success('测试消息已发送');
  } else {
    message.warning(`发送失败: ${res.failReason || '未知错误'}`);
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

function handleTemplateChange(
  templateId: number | undefined,
  target: 'customer' | 'employee' | 'test',
) {
  if (templateId) {
    const template = templates.value.find((t) => t.id === templateId);
    if (template) {
      if (target === 'customer') {
        customerFormState.value.textContent = template.content.text || '';
      } else if (target === 'employee') {
        employeeFormState.value.textContent = template.content.text || '';
      } else {
        testFormState.value.textContent = template.content.text || '';
      }
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

// Watch for employee selection in test mode
watch(
  () => testFormState.value.selectedEmployeeId,
  (newVal) => {
    if (newVal) {
      testFormState.value.customerId = undefined;
      fetchEmployeeCustomers(newVal);
    } else {
      employeeCustomers.value = [];
    }
  },
);

// ==================== Lifecycle ====================

onMounted(() => {
  fetchData();
  fetchCustomers();
  fetchTemplates();
  fetchEmployees();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">消息推送</h2>
      <Space>
        <Button type="primary" @click="handleOpenSendModal">
          <SendOutlined /> 发送消息
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
              <div class="font-medium">
                {{ record.customerName || '未知客户' }}
              </div>
              <div class="text-xs text-gray-400">
                {{ record.externalUserid }}
              </div>
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
      width="650px"
      :ok-text="
        sendMode === 'TEST'
          ? '测试发送'
          : sendMode === 'EMPLOYEE'
            ? '推送给员工'
            : '发送'
      "
    >
      <Tabs v-model:activeKey="sendMode" class="mt-2">
        <TabPane key="CUSTOMER">
          <template #tab>
            <span><UserOutlined /> 按客户发送</span>
          </template>
        </TabPane>
        <TabPane key="EMPLOYEE">
          <template #tab>
            <span><TeamOutlined /> 按员工发送</span>
          </template>
        </TabPane>
        <TabPane key="TEST">
          <template #tab>
            <span><ExperimentOutlined /> 测试发送</span>
          </template>
        </TabPane>
      </Tabs>

      <!-- Customer Mode -->
      <div v-if="sendMode === 'CUSTOMER'" class="mt-4">
        <Form layout="vertical">
          <Form.Item>
            <Checkbox v-model:checked="customerFormState.isBatch">
              批量发送（多选客户）
            </Checkbox>
          </Form.Item>
          <Form.Item label="选择客户" required>
            <Select
              v-if="!customerFormState.isBatch"
              v-model:value="customerFormState.customerId"
              placeholder="请选择客户"
              show-search
              :filter-option="
                (input: string, option: any) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
              "
              :options="customers.map((c) => ({ value: c.id, label: c.name }))"
            />
            <Select
              v-else
              v-model:value="customerFormState.customerIds"
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
              v-model:value="customerFormState.templateId"
              placeholder="选择消息模板（可选）"
              allow-clear
              :options="templates.map((t) => ({ value: t.id, label: t.name }))"
              @change="(v: number) => handleTemplateChange(v, 'customer')"
            />
          </Form.Item>
          <Form.Item label="消息内容" required>
            <Input.TextArea
              v-model:value="customerFormState.textContent"
              placeholder="请输入消息内容"
              :rows="4"
              :maxlength="2048"
              show-count
            />
          </Form.Item>
        </Form>
      </div>

      <!-- Employee Mode -->
      <div v-if="sendMode === 'EMPLOYEE'" class="mt-4">
        <Alert
          type="info"
          message="选择员工后，消息将推送到员工手机端，由员工确认后发送给其所有客户"
          class="mb-4"
          show-icon
        />
        <Form layout="vertical">
          <Form.Item label="选择员工" required>
            <Spin :spinning="employeeLoading">
              <Select
                v-model:value="employeeFormState.wecomUserIds"
                mode="multiple"
                placeholder="输入员工姓名搜索（可多选）"
                show-search
                :filter-option="false"
                :options="
                  employees.map((e) => ({
                    value: e.wecomUserId,
                    label: `${e.userName || e.wecomUserId} (${e.customerCount}个客户)`,
                  }))
                "
                :max-tag-count="3"
                @search="handleEmployeeSearch"
              />
            </Spin>
          </Form.Item>
          <Form.Item>
            <Checkbox v-model:checked="employeeFormState.allowSelect">
              允许员工修改客户列表
            </Checkbox>
          </Form.Item>
          <div
            v-if="employeeFormState.wecomUserIds.length > 0"
            class="mb-4 rounded bg-blue-50 p-3"
          >
            <span class="text-blue-600">
              预计发送给
              <strong>{{ selectedEmployeesCustomerCount }}</strong> 个客户
            </span>
          </div>
          <Form.Item label="选择模板">
            <Select
              v-model:value="employeeFormState.templateId"
              placeholder="选择消息模板（可选）"
              allow-clear
              :options="templates.map((t) => ({ value: t.id, label: t.name }))"
              @change="(v: number) => handleTemplateChange(v, 'employee')"
            />
          </Form.Item>
          <Form.Item label="消息内容" required>
            <Input.TextArea
              v-model:value="employeeFormState.textContent"
              placeholder="请输入消息内容"
              :rows="4"
              :maxlength="2048"
              show-count
            />
          </Form.Item>
        </Form>
      </div>

      <!-- Test Mode -->
      <div v-if="sendMode === 'TEST'" class="mt-4">
        <Alert
          type="warning"
          message="测试模式：选择单个客户验证消息内容，消息将立即发送"
          class="mb-4"
          show-icon
        />
        <Form layout="vertical">
          <Form.Item label="选择员工">
            <Spin :spinning="employeeLoading">
              <Select
                v-model:value="testFormState.selectedEmployeeId"
                placeholder="输入员工姓名搜索"
                show-search
                allow-clear
                :filter-option="false"
                :options="
                  employees.map((e) => ({
                    value: e.wecomUserId,
                    label: `${e.userName || e.wecomUserId} (${e.customerCount}个客户)`,
                  }))
                "
                @search="handleEmployeeSearch"
              />
            </Spin>
          </Form.Item>
          <Form.Item label="选择测试客户" required>
            <Spin :spinning="employeeCustomersLoading">
              <Select
                v-model:value="testFormState.customerId"
                placeholder="请选择测试客户"
                show-search
                :disabled="!testFormState.selectedEmployeeId"
                :filter-option="
                  (input: string, option: any) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                "
                :options="
                  employeeCustomers.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.phone ? ' - ' + c.phone : ''}`,
                  }))
                "
              />
            </Spin>
          </Form.Item>
          <Form.Item label="选择模板">
            <Select
              v-model:value="testFormState.templateId"
              placeholder="选择消息模板（可选）"
              allow-clear
              :options="templates.map((t) => ({ value: t.id, label: t.name }))"
              @change="(v: number) => handleTemplateChange(v, 'test')"
            />
          </Form.Item>
          <Form.Item label="消息内容" required>
            <Input.TextArea
              v-model:value="testFormState.textContent"
              placeholder="请输入消息内容"
              :rows="4"
              :maxlength="2048"
              show-count
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>

    <!-- Detail Drawer -->
    <Drawer v-model:open="detailDrawerVisible" title="消息详情" width="400">
      <template v-if="selectedMessage">
        <div class="space-y-4">
          <div>
            <div class="text-sm text-gray-500">客户</div>
            <div class="font-medium">
              {{ selectedMessage.customerName || '未知客户' }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">消息类型</div>
            <div>
              {{
                {
                  SINGLE: '单发',
                  EMPLOYEE_BATCH: '员工批量',
                  TEST: '测试',
                  WELCOME: '欢迎语',
                }[selectedMessage.messageType] || selectedMessage.messageType
              }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">状态</div>
            <div class="flex items-center gap-2">
              <component :is="() => getStatusIcon(selectedMessage!.status)" />
              <span>{{
                statusOptions.find((o) => o.value === selectedMessage?.status)
                  ?.label
              }}</span>
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">消息内容</div>
            <div class="mt-1 rounded bg-gray-50 p-3 whitespace-pre-wrap">
              {{ selectedMessage.content?.text || '无文本内容' }}
            </div>
          </div>
          <div v-if="selectedMessage.failReason">
            <div class="text-sm text-gray-500">失败原因</div>
            <div class="text-red-500">{{ selectedMessage.failReason }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">创建时间</div>
            <div>
              {{
                dayjs(selectedMessage.createdAt).format('YYYY-MM-DD HH:mm:ss')
              }}
            </div>
          </div>
          <div v-if="selectedMessage.sentAt">
            <div class="text-sm text-gray-500">发送时间</div>
            <div>
              {{ dayjs(selectedMessage.sentAt).format('YYYY-MM-DD HH:mm:ss') }}
            </div>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
