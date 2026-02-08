<script lang="ts" setup>
import { onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Popconfirm,
} from 'ant-design-vue';
import { BarChartOutlined } from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import { useCrudTable, useModalForm } from '#/composables';

const router = useRouter();

// ==================== 类型定义 ====================

interface TagItem {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  customerCount: number;
  createdAt: string;
}

interface TagFormState {
  name: string;
  color: string;
  description: string;
}

// ==================== 表格列定义 ====================

const columns = [
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ record }: { record: TagItem }) =>
      h(Tag, { color: record.color || '#1890ff' }, () => record.name),
  },
  { title: '描述', dataIndex: 'description', key: 'description' },
  {
    title: '客户数',
    dataIndex: 'customerCount',
    key: 'customerCount',
    width: 100,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 150 },
];

// ==================== 表格逻辑 ====================

const { tableProps, fetchData, handleDelete } = useCrudTable<TagItem>({
  fetchApi: async (params) =>
    requestClient.get<{ items: TagItem[]; total: number }>('/customer/tag', {
      params: { page: params.page, pageSize: params.pageSize },
    }),
  deleteApi: async (id) => {
    await requestClient.delete(`/tags/${id}`);
  },
});

// ==================== Modal 逻辑 ====================

const { visible, formState, isEditing, openCreate, openEdit, submit } =
  useModalForm<TagFormState>({
    createApi: async (data) => {
      await requestClient.post('/customer/tag', data);
    },
    updateApi: async (id, data) => {
      await requestClient.put(`/tags/${id}`, data);
    },
    initialValues: () => ({
      name: '',
      color: '#1890ff',
      description: '',
    }),
    afterSubmit: fetchData,
  });

// ==================== 事件处理 ====================

function handleEdit(record: TagItem) {
  openEdit(record.id, {
    name: record.name,
    color: record.color || '#1890ff',
    description: record.description || '',
  });
}

function goToStatistics() {
  router.push('/customer/tag/statistics');
}

// ==================== 生命周期 ====================

onMounted(fetchData);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">标签管理</h2>
      <Space>
        <Button @click="goToStatistics">
          <template #icon><BarChartOutlined /></template>
          统计分析
        </Button>
        <Button type="primary" @click="openCreate">新增标签</Button>
      </Space>
    </div>

    <!-- 表格区 -->
    <Table v-bind="tableProps" :columns="columns">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="handleEdit(record as TagItem)"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除吗？"
              @confirm="handleDelete((record as TagItem).id)"
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 新增/编辑 Modal -->
    <Modal
      v-model:open="visible"
      :title="isEditing ? '编辑标签' : '新增标签'"
      @ok="submit"
    >
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
