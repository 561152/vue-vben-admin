<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface PermissionItem {
  id: number;
  code: string;
  name: string;
}

interface RoleItem {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: string;
  dataScope: string;
  isSystem: boolean;
  appModuleName: string | null;
  permissions: PermissionItem[];
  createdAt: string;
}

const loading = ref(false);
const dataSource = ref<RoleItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新增角色');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  code: '',
  description: '',
  dataScope: 'OWN',
});
const permModalVisible = ref(false);
const permRoleId = ref<number | null>(null);
const allPermissions = ref<PermissionItem[]>([]);
const selectedPermIds = ref<number[]>([]);

const columns = [
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '角色代码', dataIndex: 'code', key: 'code' },
  { title: '所属模块', dataIndex: 'appModuleName', key: 'appModuleName' },
  {
    title: '数据范围',
    dataIndex: 'dataScope',
    key: 'dataScope',
    customRender: ({ text }: { text: string }) => {
      const map: Record<string, string> = { ALL: '全部', DEPT: '本部门', OWN: '仅本人' };
      return h(Tag, { color: text === 'ALL' ? 'green' : text === 'DEPT' ? 'blue' : 'default' }, () => map[text] || text);
    }
  },
  {
    title: '类型',
    dataIndex: 'isSystem',
    key: 'isSystem',
    customRender: ({ text }: { text: boolean }) => {
      return h(Tag, { color: text ? 'purple' : 'default' }, () => text ? '系统角色' : '自定义');
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
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

const dataScopeOptions = [
  { value: 'ALL', label: '全部数据' },
  { value: 'DEPT', label: '本部门数据' },
  { value: 'OWN', label: '仅本人数据' },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await requestClient.get<{ items: RoleItem[]; total: number }>('/roles', {
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

async function fetchAllPermissions() {
  // 获取所有权限（从角色的权限中提取）
  try {
    const res = await requestClient.get<{ items: RoleItem[] }>('/roles');
    const perms = new Map<number, PermissionItem>();
    for (const role of res.items) {
      for (const p of role.permissions) {
        perms.set(p.id, p);
      }
    }
    allPermissions.value = Array.from(perms.values());
  } catch (e) {
    console.error(e);
  }
}

function handleAdd() {
  editingId.value = null;
  modalTitle.value = '新增角色';
  formState.value = { name: '', code: '', description: '', dataScope: 'OWN' };
  modalVisible.value = true;
}

async function handleEdit(record: RoleItem) {
  if (record.isSystem) {
    message.warning('系统角色不可编辑');
    return;
  }
  editingId.value = record.id;
  modalTitle.value = '编辑角色';
  formState.value = {
    name: record.name,
    code: record.code,
    description: record.description || '',
    dataScope: record.dataScope,
  };
  modalVisible.value = true;
}

async function handleDelete(record: RoleItem) {
  if (record.isSystem) {
    message.warning('系统角色不可删除');
    return;
  }
  try {
    await requestClient.delete(`/roles/${record.id}`);
    message.success('删除成功');
    fetchData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/roles/${editingId.value}`, {
        name: formState.value.name,
        description: formState.value.description,
        dataScope: formState.value.dataScope,
      });
      message.success('更新成功');
    } else {
      await requestClient.post('/roles', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

function handlePermissions(record: RoleItem) {
  if (record.isSystem) {
    message.warning('系统角色权限不可修改');
    return;
  }
  permRoleId.value = record.id;
  selectedPermIds.value = record.permissions.map(p => p.id);
  permModalVisible.value = true;
}

async function handlePermSubmit() {
  if (!permRoleId.value) return;
  try {
    await requestClient.put(`/roles/${permRoleId.value}/permissions`, { permissionIds: selectedPermIds.value });
    message.success('权限设置成功');
    permModalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchAllPermissions();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">角色管理</h2>
      <Button type="primary" @click="handleAdd">新增角色</Button>
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
            <Button type="link" size="small" @click="handleEdit(record)" :disabled="record.isSystem">编辑</Button>
            <Button type="link" size="small" @click="handlePermissions(record)" :disabled="record.isSystem">权限</Button>
            <Popconfirm title="确定删除吗？" @confirm="handleDelete(record)" :disabled="record.isSystem">
              <Button type="link" size="small" danger :disabled="record.isSystem">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="角色名称">
          <Input v-model:value="formState.name" placeholder="请输入角色名称" />
        </Form.Item>
        <Form.Item label="角色代码" v-if="!editingId">
          <Input v-model:value="formState.code" placeholder="请输入角色代码" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="formState.description" placeholder="请输入描述" />
        </Form.Item>
        <Form.Item label="数据范围">
          <Select v-model:value="formState.dataScope" :options="dataScopeOptions" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="permModalVisible" title="设置权限" @ok="handlePermSubmit" width="600px">
      <Select
        v-model:value="selectedPermIds"
        mode="multiple"
        placeholder="请选择权限"
        style="width: 100%"
        class="mt-4"
      >
        <Select.Option v-for="perm in allPermissions" :key="perm.id" :value="perm.id">
          {{ perm.name }} ({{ perm.code }})
        </Select.Option>
      </Select>
    </Modal>
  </div>
</template>
