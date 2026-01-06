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
} from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface TagItem {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  customerCount: number;
  createdAt: string;
}

const loading = ref(false);
const dataSource = ref<TagItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新增标签');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  color: '#1890ff',
  description: '',
});

const columns = [
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ record }: { record: TagItem }) => {
      return h(Tag, { color: record.color || '#1890ff' }, () => record.name);
    },
  },
  { title: '描述', dataIndex: 'description', key: 'description' },
  {
    title: '客户数',
    dataIndex: 'customerCount',
    key: 'customerCount',
    width: 100,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await requestClient.get<{ items: TagItem[]; total: number }>(
      '/tags',
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

function handleAdd() {
  editingId.value = null;
  modalTitle.value = '新增标签';
  formState.value = { name: '', color: '#1890ff', description: '' };
  modalVisible.value = true;
}

async function handleEdit(record: TagItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑标签';
  formState.value = {
    name: record.name,
    color: record.color || '#1890ff',
    description: record.description || '',
  };
  modalVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/tags/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await requestClient.put(`/tags/${editingId.value}`, formState.value);
      message.success('更新成功');
    } else {
      await requestClient.post('/tags', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
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
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">标签管理</h2>
      <Button type="primary" @click="handleAdd">新增标签</Button>
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

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="标签名称" required>
          <Input v-model:value="formState.name" placeholder="请输入标签名称" />
        </Form.Item>
        <Form.Item label="颜色">
          <Input
            v-model:value="formState.color"
            placeholder="请输入颜色值，如 #1890ff"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="请输入描述"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
