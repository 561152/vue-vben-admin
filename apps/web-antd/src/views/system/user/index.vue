<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface UserItem {
  id: number;
  username: string;
  realName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  departmentId: number | null;
  departmentName: string | null;
  roles: { roleId: number; roleName: string; roleCode: string }[];
  createdAt: string;
}

interface RoleItem {
  id: number;
  name: string;
  code: string;
}

interface DeptItem {
  id: number;
  name: string;
}

const loading = ref(false);
const dataSource = ref<UserItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新增用户');
const editingId = ref<number | null>(null);
const formState = ref({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  departmentId: undefined as number | undefined,
  roleIds: [] as number[],
});
const roles = ref<RoleItem[]>([]);
const departments = ref<DeptItem[]>([]);
const passwordModalVisible = ref(false);
const passwordForm = ref({ password: '' });
const resetPasswordUserId = ref<number | null>(null);

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realName', key: 'realName' },
  { title: '部门', dataIndex: 'departmentName', key: 'departmentName' },
  {
    title: '角色',
    dataIndex: 'roles',
    key: 'roles',
    customRender: ({ record }: { record: UserItem }) => {
      return h('div', {}, record.roles.map(r => h(Tag, { color: 'blue' }, () => r.roleName)));
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: { text: string }) => {
      return h(Tag, { color: text === 'ACTIVE' ? 'green' : 'red' }, () => text === 'ACTIVE' ? '正常' : '禁用');
    }
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await requestClient.get<{ items: UserItem[]; total: number }>('/users', {
      params: { page: pagination.value.current, pageSize: pagination.value.pageSize }
    });
    dataSource.value = res.items;
    pagination.value.total = res.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchRoles() {
  try {
    const res = await requestClient.get<{ items: RoleItem[] }>('/roles');
    roles.value = res.items;
  } catch (e) {
    console.error(e);
  }
}

async function fetchDepartments() {
  try {
    const res = await requestClient.get<{ items: DeptItem[] }>('/departments');
    // 扁平化树形结构
    const flatList: DeptItem[] = [];
    function flatten(items: any[]) {
      for (const item of items) {
        flatList.push({ id: item.id, name: item.name });
        if (item.children) flatten(item.children);
      }
    }
    flatten(res.items);
    departments.value = flatList;
  } catch (e) {
    console.error(e);
  }
}

function handleAdd() {
  editingId.value = null;
  modalTitle.value = '新增用户';
  formState.value = { username: '', password: '', realName: '', email: '', phone: '', departmentId: undefined, roleIds: [] };
  modalVisible.value = true;
}

async function handleEdit(record: UserItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑用户';
  formState.value = {
    username: record.username,
    password: '',
    realName: record.realName || '',
    email: record.email || '',
    phone: record.phone || '',
    departmentId: record.departmentId || undefined,
    roleIds: record.roles.map(r => r.roleId),
  };
  modalVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/users/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/users/${editingId.value}`, {
        realName: formState.value.realName,
        email: formState.value.email,
        phone: formState.value.phone,
        departmentId: formState.value.departmentId,
      });
      if (formState.value.roleIds.length > 0) {
        await requestClient.put(`/users/${editingId.value}/roles`, { roleIds: formState.value.roleIds });
      }
      message.success('更新成功');
    } else {
      await requestClient.post('/users', {
        username: formState.value.username,
        password: formState.value.password,
        realName: formState.value.realName,
        email: formState.value.email,
        phone: formState.value.phone,
        departmentId: formState.value.departmentId,
        roleIds: formState.value.roleIds,
      });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

function handleResetPassword(id: number) {
  resetPasswordUserId.value = id;
  passwordForm.value = { password: '' };
  passwordModalVisible.value = true;
}

async function handlePasswordSubmit() {
  if (!resetPasswordUserId.value) return;
  try {
    await requestClient.put(`/users/${resetPasswordUserId.value}/password`, { password: passwordForm.value.password });
    message.success('密码重置成功');
    passwordModalVisible.value = false;
  } catch (e: any) {
    message.error(e.message || '重置失败');
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchRoles();
  fetchDepartments();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">用户管理</h2>
      <Button type="primary" @click="handleAdd">新增用户</Button>
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
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Button type="link" size="small" @click="handleResetPassword(record.id)">重置密码</Button>
            <Popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="用户名" v-if="!editingId">
          <Input v-model:value="formState.username" placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item label="密码" v-if="!editingId">
          <Input.Password v-model:value="formState.password" placeholder="请输入密码" />
        </Form.Item>
        <Form.Item label="姓名">
          <Input v-model:value="formState.realName" placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input v-model:value="formState.email" placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item label="手机">
          <Input v-model:value="formState.phone" placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item label="部门">
          <Select v-model:value="formState.departmentId" placeholder="请选择部门" allowClear>
            <Select.Option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="角色">
          <Select v-model:value="formState.roleIds" mode="multiple" placeholder="请选择角色">
            <Select.Option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="passwordModalVisible" title="重置密码" @ok="handlePasswordSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="新密码">
          <Input.Password v-model:value="passwordForm.password" placeholder="请输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
