<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Popconfirm,
  Drawer,
} from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface GroupItem {
  id: number;
  chatId: string;
  name: string | null;
  notice: string | null;
  owner: string | null;
  status: string;
  memberCount: number;
  createTime: string | null;
  createdAt: string;
}

interface MemberItem {
  id: number;
  customerId: number | null;
  customerName: string | null;
  userId: string | null;
  type: string;
  joinTime: string | null;
}

interface CustomerItem {
  id: number;
  name: string;
}

const loading = ref(false);
const dataSource = ref<GroupItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新建群');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  notice: '',
});

// 群成员相关
const memberDrawerVisible = ref(false);
const currentGroup = ref<GroupItem | null>(null);
const members = ref<MemberItem[]>([]);
const membersLoading = ref(false);
const addMemberModalVisible = ref(false);
const customers = ref<CustomerItem[]>([]);
const selectedCustomerId = ref<number | undefined>(undefined);

const statusMap: Record<string, { label: string; color: string }> = {
  NORMAL: { label: '正常', color: 'green' },
  OWNER_QUIT: { label: '群主退出', color: 'orange' },
  TRANSFERRING: { label: '转让中', color: 'blue' },
  TRANSFERRED: { label: '已转让', color: 'default' },
};

const columns = [
  { title: '群名称', dataIndex: 'name', key: 'name' },
  {
    title: '群成员数',
    dataIndex: 'memberCount',
    key: 'memberCount',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const info = statusMap[text] || { label: text, color: 'default' };
      return h(Tag, { color: info.color }, () => info.label);
    },
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'action',
    width: 220,
  },
];

const memberColumns = [
  { title: '客户名称', dataIndex: 'customerName', key: 'customerName' },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    customRender: ({ text }: { text: string }) => {
      return h(Tag, { color: text === 'EMPLOYEE' ? 'blue' : 'green' }, () =>
        text === 'EMPLOYEE' ? '员工' : '客户',
      );
    },
  },
  { title: '加入时间', dataIndex: 'joinTime', key: 'joinTime' },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await requestClient.get<{ items: GroupItem[]; total: number }>(
      '/groups',
      {
        params: {
          page: pagination.value.current,
          pageSize: pagination.value.pageSize,
        },
      },
    );
    dataSource.value = res.items;
    pagination.value.total = res.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchCustomers() {
  try {
    const res = await requestClient.get<{ items: CustomerItem[] }>(
      '/customers',
    );
    customers.value = res.items;
  } catch (e) {
    console.error(e);
  }
}

function handleAdd() {
  editingId.value = null;
  modalTitle.value = '新建群';
  formState.value = { name: '', notice: '' };
  modalVisible.value = true;
}

async function handleEdit(record: GroupItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑群';
  formState.value = {
    name: record.name || '',
    notice: record.notice || '',
  };
  modalVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/groups/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/groups/${editingId.value}`, formState.value);
      message.success('更新成功');
    } else {
      await requestClient.post('/groups', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function handleViewMembers(record: GroupItem) {
  currentGroup.value = record;
  memberDrawerVisible.value = true;
  await fetchMembers(record.id);
}

async function fetchMembers(groupId: number) {
  membersLoading.value = true;
  try {
    const res = await requestClient.get<MemberItem[]>(
      `/groups/${groupId}/members`,
    );
    members.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    membersLoading.value = false;
  }
}

function handleAddMember() {
  selectedCustomerId.value = undefined;
  addMemberModalVisible.value = true;
}

async function handleAddMemberSubmit() {
  if (!currentGroup.value || !selectedCustomerId.value) return;
  try {
    await requestClient.post(`/groups/${currentGroup.value.id}/members`, {
      customerId: selectedCustomerId.value,
    });
    message.success('添加成功');
    addMemberModalVisible.value = false;
    await fetchMembers(currentGroup.value.id);
    fetchData(); // 刷新列表以更新成员数
  } catch (e: any) {
    message.error(e.message || '添加失败');
  }
}

async function handleRemoveMember(memberId: number) {
  if (!currentGroup.value) return;
  try {
    await requestClient.delete(
      `/groups/${currentGroup.value.id}/members/${memberId}`,
    );
    message.success('移除成功');
    await fetchMembers(currentGroup.value.id);
    fetchData();
  } catch (e) {
    message.error('移除失败');
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchCustomers();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">群管理</h2>
      <Button type="primary" @click="handleAdd">新建群</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleViewMembers(record)"
              >成员</Button
            >
            <Button type="link" size="small" @click="handleEdit(record)"
              >编辑</Button
            >
            <Popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 新建/编辑群弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="群名称" required>
          <Input v-model:value="formState.name" placeholder="请输入群名称" />
        </Form.Item>
        <Form.Item label="群公告">
          <Input.TextArea
            v-model:value="formState.notice"
            placeholder="请输入群公告"
            :rows="3"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 群成员抽屉 -->
    <Drawer
      v-model:open="memberDrawerVisible"
      :title="`群成员 - ${currentGroup?.name || ''}`"
      width="500"
    >
      <div class="mb-4">
        <Button type="primary" @click="handleAddMember">添加成员</Button>
      </div>
      <Table
        :columns="memberColumns"
        :data-source="members"
        :loading="membersLoading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Popconfirm
              title="确定移除吗？"
              @confirm="handleRemoveMember(record.id)"
            >
              <Button type="link" size="small" danger>移除</Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Drawer>

    <!-- 添加成员弹窗 -->
    <Modal
      v-model:open="addMemberModalVisible"
      title="添加群成员"
      @ok="handleAddMemberSubmit"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="选择客户" required>
          <select
            v-model="selectedCustomerId"
            class="w-full rounded border p-2"
          >
            <option :value="undefined">请选择客户</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
