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
  Avatar,
  Card,
  InputSearch,
} from 'ant-design-vue';
import { UserOutlined, WechatOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';
import CustomerDetailDrawer from './components/CustomerDetailDrawer.vue';

interface CustomerItem {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  company: string | null;
  gender: string;
  status: string;
  source: string | null;
  customerLevel: string;
  totalAmount: number;
  orderCount: number;
  lastActiveAt: string | null;
  remark: string | null;
  ownerName: string | null;
  createdAt: string;
}

const loading = ref(false);
const dataSource = ref<CustomerItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新增客户');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  phone: '',
  email: '',
  company: '',
  status: 'LEAD',
  source: '',
  remark: '',
});

// Detail drawer
const detailVisible = ref(false);
const detailCustomerId = ref<number | null>(null);

// Filters
const filterSource = ref<string | undefined>(undefined);
const filterStatus = ref<string | undefined>(undefined);
const filterLevel = ref<string | undefined>(undefined);
const searchKeyword = ref('');

const statusOptions = [
  { value: 'LEAD', label: '潜在客户', color: 'blue' },
  { value: 'OPPORTUNITY', label: '商机', color: 'orange' },
  { value: 'CUSTOMER', label: '成交客户', color: 'green' },
  { value: 'LOST', label: '已流失', color: 'red' },
  { value: 'INVALID', label: '无效客户', color: 'default' },
];

const sourceOptions = [
  { value: 'MANUAL', label: '手动录入', color: 'default' },
  { value: 'WECOM', label: '企业微信', color: 'green' },
  { value: 'IMPORT', label: '批量导入', color: 'blue' },
  { value: 'WEBSITE', label: '官网表单', color: 'purple' },
  { value: 'DOUYIN', label: '抖音', color: 'pink' },
  { value: 'XIAOHONGSHU', label: '小红书', color: 'red' },
  { value: 'WECHAT', label: '微信', color: 'green' },
  { value: 'API', label: 'API', color: 'cyan' },
];

const levelOptions = [
  { value: 'VIP', label: 'VIP', color: 'gold' },
  { value: 'IMPORTANT', label: '重要客户', color: 'orange' },
  { value: 'NORMAL', label: '普通客户', color: 'blue' },
  { value: 'POTENTIAL', label: '潜在客户', color: 'cyan' },
  { value: 'INACTIVE', label: '不活跃', color: 'default' },
];

const columns = [
  {
    title: '客户',
    key: 'customer',
    width: 220,
    fixed: 'left',
  },
  { title: '电话', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '公司', dataIndex: 'company', key: 'company', ellipsis: true, width: 150 },
  {
    title: '等级',
    dataIndex: 'customerLevel',
    key: 'customerLevel',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = levelOptions.find(o => o.value === text);
      return h(Tag, { color: opt?.color || 'default' }, () => opt?.label || text);
    }
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = sourceOptions.find(o => o.value === text);
      if (!opt) return h(Tag, { color: 'default' }, () => text || '-');
      return h(Tag, { color: opt.color }, () => opt.label);
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = statusOptions.find(o => o.value === text);
      return h(Tag, { color: opt?.color || 'default' }, () => opt?.label || text);
    }
  },
  {
    title: '消费总额',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    width: 120,
    customRender: ({ text }: { text: number }) => `¥${(text || 0).toFixed(2)}`
  },
  { title: '负责人', dataIndex: 'ownerName', key: 'ownerName', width: 100 },
  {
    title: '最后活跃',
    dataIndex: 'lastActiveAt',
    key: 'lastActiveAt',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      if (!text) return '-';
      return dayjs(text).fromNow();
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right',
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (filterSource.value) params.source = filterSource.value;
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterLevel.value) params.customerLevel = filterLevel.value;
    if (searchKeyword.value) params.keyword = searchKeyword.value;

    const res = await requestClient.get<{ items: CustomerItem[]; total: number }>('/customers', { params });
    dataSource.value = res.items;
    pagination.value.total = res.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  modalTitle.value = '新增客户';
  formState.value = { name: '', phone: '', email: '', company: '', status: 'LEAD', source: '', remark: '' };
  modalVisible.value = true;
}

async function handleEdit(record: CustomerItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑客户';
  formState.value = {
    name: record.name,
    phone: record.phone || '',
    email: record.email || '',
    company: record.company || '',
    status: record.status,
    source: record.source || '',
    remark: record.remark || '',
  };
  modalVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/customers/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/customers/${editingId.value}`, formState.value);
      message.success('更新成功');
    } else {
      await requestClient.post('/customers', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

function handleView(record: CustomerItem) {
  detailCustomerId.value = record.id;
  detailVisible.value = true;
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

function handleResetFilter() {
  filterSource.value = undefined;
  filterStatus.value = undefined;
  filterLevel.value = undefined;
  searchKeyword.value = '';
  pagination.value.current = 1;
  fetchData();
}

function handleSearch(value: string) {
  searchKeyword.value = value;
  pagination.value.current = 1;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">客户列表</h2>
      <Button type="primary" @click="handleAdd">新增客户</Button>
    </div>

    <!-- Filters -->
    <Card class="mb-4" size="small">
      <div class="flex flex-wrap gap-4 items-center">
        <InputSearch
          v-model:value="searchKeyword"
          placeholder="搜索客户名称/电话"
          style="width: 200px"
          allow-clear
          @search="handleSearch"
        />
        <Select
          v-model:value="filterStatus"
          :options="[{ value: '', label: '全部状态' }, ...statusOptions]"
          placeholder="客户状态"
          style="width: 120px"
          allow-clear
        />
        <Select
          v-model:value="filterLevel"
          :options="[{ value: '', label: '全部等级' }, ...levelOptions]"
          placeholder="客户等级"
          style="width: 120px"
          allow-clear
        />
        <Select
          v-model:value="filterSource"
          :options="[{ value: '', label: '全部来源' }, ...sourceOptions]"
          placeholder="来源渠道"
          style="width: 120px"
          allow-clear
        />
        <Button type="primary" @click="handleFilter">筛选</Button>
        <Button @click="handleResetFilter">重置</Button>
      </div>
    </Card>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1400 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'customer'">
          <div class="flex items-center gap-2 cursor-pointer" @click="handleView(record)">
            <Avatar
              v-if="record.avatar"
              :src="record.avatar"
              :size="40"
            />
            <Avatar v-else :size="40">
              <template #icon><UserOutlined /></template>
            </Avatar>
            <div>
              <div class="font-medium text-blue-600 hover:text-blue-800">{{ record.name }}</div>
              <div class="text-xs text-gray-400 flex items-center gap-1">
                <WechatOutlined v-if="record.source === 'WECOM'" class="text-green-500" />
                <span>订单 {{ record.orderCount || 0 }}</span>
              </div>
            </div>
          </div>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleView(record)">详情</Button>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- Create/Edit Modal -->
    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="客户名称" required>
          <Input v-model:value="formState.name" placeholder="请输入客户名称" />
        </Form.Item>
        <Form.Item label="电话">
          <Input v-model:value="formState.phone" placeholder="请输入电话" />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input v-model:value="formState.email" placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item label="公司">
          <Input v-model:value="formState.company" placeholder="请输入公司名称" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formState.status" :options="statusOptions" />
        </Form.Item>
        <Form.Item label="来源">
          <Select v-model:value="formState.source" :options="sourceOptions" allowClear />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="formState.remark" placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Detail Drawer -->
    <CustomerDetailDrawer
      v-model:open="detailVisible"
      :customer-id="detailCustomerId"
      @refresh="fetchData"
    />
  </div>
</template>
