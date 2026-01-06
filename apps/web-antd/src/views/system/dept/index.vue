<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface DeptItem {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  parentId: number | null;
  leaderId: number | null;
  leaderName: string | null;
  sort: number;
  status: string;
  children?: DeptItem[];
  createdAt: string;
}

interface UserItem {
  id: number;
  realName: string;
  username: string;
}

const loading = ref(false);
const dataSource = ref<DeptItem[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增部门');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  code: '',
  description: '',
  parentId: undefined as number | undefined,
  leaderId: undefined as number | undefined,
  sort: 0,
});
const users = ref<UserItem[]>([]);

const columns = [
  { title: '部门名称', dataIndex: 'name', key: 'name' },
  { title: '部门代码', dataIndex: 'code', key: 'code' },
  { title: '负责人', dataIndex: 'leaderName', key: 'leaderName' },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      return h(Tag, { color: text === 'ACTIVE' ? 'green' : 'red' }, () => text === 'ACTIVE' ? '正常' : '禁用');
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

// 将树形数据扁平化为 Select 需要的格式
function flattenDepts(items: DeptItem[], prefix = ''): { id: number; name: string }[] {
  const result: { id: number; name: string }[] = [];
  for (const item of items) {
    result.push({ id: item.id, name: prefix + item.name });
    if (item.children) {
      result.push(...flattenDepts(item.children, prefix + '　'));
    }
  }
  return result;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await requestClient.get<{ items: DeptItem[] }>('/departments');
    dataSource.value = res.items;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  try {
    const res = await requestClient.get<{ items: UserItem[] }>('/users');
    users.value = res.items;
  } catch (e) {
    console.error(e);
  }
}

function handleAdd(parentId?: number) {
  editingId.value = null;
  modalTitle.value = parentId ? '新增子部门' : '新增部门';
  formState.value = {
    name: '',
    code: '',
    description: '',
    parentId: parentId,
    leaderId: undefined,
    sort: 0,
  };
  modalVisible.value = true;
}

async function handleEdit(record: DeptItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑部门';
  formState.value = {
    name: record.name,
    code: record.code || '',
    description: record.description || '',
    parentId: record.parentId || undefined,
    leaderId: record.leaderId || undefined,
    sort: record.sort,
  };
  modalVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/departments/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/departments/${editingId.value}`, formState.value);
      message.success('更新成功');
    } else {
      await requestClient.post('/departments', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

onMounted(() => {
  fetchData();
  fetchUsers();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">部门管理</h2>
      <Button type="primary" @click="handleAdd()">新增部门</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :default-expand-all-rows="true"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleAdd(record.id)">新增</Button>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="部门名称">
          <Input v-model:value="formState.name" placeholder="请输入部门名称" />
        </Form.Item>
        <Form.Item label="部门代码">
          <Input v-model:value="formState.code" placeholder="请输入部门代码" />
        </Form.Item>
        <Form.Item label="上级部门">
          <Select v-model:value="formState.parentId" placeholder="请选择上级部门" allowClear>
            <Select.Option v-for="dept in flattenDepts(dataSource)" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="负责人">
          <Select v-model:value="formState.leaderId" placeholder="请选择负责人" allowClear show-search>
            <Select.Option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.realName || user.username }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="排序">
          <Input v-model:value.number="formState.sort" type="number" placeholder="请输入排序" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="formState.description" placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
