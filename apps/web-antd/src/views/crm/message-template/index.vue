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
  Switch,
  Popconfirm,
} from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons-vue';
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplate,
} from '#/api/crm';
import dayjs from 'dayjs';

const loading = ref(false);
const dataSource = ref<MessageTemplate[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const editingId = ref<number | null>(null);
const filterCategory = ref<string | undefined>(undefined);
const filterActive = ref<string>('');

const formState = ref({
  name: '',
  category: '',
  text: '',
  isActive: true,
});

const categoryOptions = [
  { value: '促销', label: '促销' },
  { value: '通知', label: '通知' },
  { value: '节日', label: '节日' },
  { value: '欢迎', label: '欢迎' },
  { value: '其他', label: '其他' },
];

const columns = [
  {
    title: '模板名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100,
    customRender: ({ text }: { text: string | null }) => {
      if (!text) return '-';
      return h(Tag, { color: 'blue' }, () => text);
    },
  },
  {
    title: '内容预览',
    key: 'content',
    ellipsis: true,
    customRender: ({ record }: { record: MessageTemplate }) => {
      return record.content?.text || '(无文本)';
    },
  },
  {
    title: '使用次数',
    dataIndex: 'usageCount',
    key: 'usageCount',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 80,
    customRender: ({ text }: { text: boolean }) => {
      return h(Tag, { color: text ? 'success' : 'default' }, () =>
        text ? '启用' : '禁用',
      );
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
    width: 180,
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
    if (filterCategory.value) params.category = filterCategory.value;
    if (filterActive.value) params.isActive = filterActive.value === 'true';

    const res = await getMessageTemplates(params);
    dataSource.value = res.data || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  formState.value = {
    name: '',
    category: '',
    text: '',
    isActive: true,
  };
  modalVisible.value = true;
}

function handleEdit(record: MessageTemplate) {
  editingId.value = record.id;
  formState.value = {
    name: record.name,
    category: record.category || '',
    text: record.content?.text || '',
    isActive: record.isActive,
  };
  modalVisible.value = true;
}

function handleCopy(record: MessageTemplate) {
  editingId.value = null;
  formState.value = {
    name: `${record.name} (副本)`,
    category: record.category || '',
    text: record.content?.text || '',
    isActive: true,
  };
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.value.name) {
    message.warning('请输入模板名称');
    return;
  }
  if (!formState.value.text) {
    message.warning('请输入模板内容');
    return;
  }

  try {
    if (editingId.value) {
      await updateMessageTemplate(editingId.value, {
        name: formState.value.name,
        category: formState.value.category || undefined,
        content: { text: formState.value.text },
        isActive: formState.value.isActive,
      });
      message.success('更新成功');
    } else {
      await createMessageTemplate({
        name: formState.value.name,
        category: formState.value.category || undefined,
        content: { text: formState.value.text },
      });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteMessageTemplate(id);
    message.success('删除成功');
    fetchData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

async function handleToggleActive(record: MessageTemplate) {
  try {
    await updateMessageTemplate(record.id, { isActive: !record.isActive });
    message.success(record.isActive ? '已禁用' : '已启用');
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

function handleFilter() {
  pagination.value.current = 1;
  fetchData();
}

function handleResetFilter() {
  filterCategory.value = undefined;
  filterActive.value = '';
  pagination.value.current = 1;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">消息模板</h2>
      <Button type="primary" @click="handleAdd">
        <PlusOutlined /> 新建模板
      </Button>
    </div>

    <!-- Filters -->
    <Card class="mb-4" size="small">
      <Space wrap>
        <span class="text-gray-500">分类:</span>
        <Select
          v-model:value="filterCategory"
          :options="[{ value: '', label: '全部' }, ...categoryOptions]"
          placeholder="选择分类"
          style="width: 120px"
          allow-clear
        />
        <span class="ml-4 text-gray-500">状态:</span>
        <Select
          v-model:value="filterActive"
          :options="[
            { value: '', label: '全部' },
            { value: 'true', label: '启用' },
            { value: 'false', label: '禁用' },
          ]"
          placeholder="选择状态"
          style="width: 100px"
        />
        <Button type="primary" @click="handleFilter">筛选</Button>
        <Button @click="handleResetFilter">重置</Button>
      </Space>
    </Card>

    <!-- Table -->
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1000 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">
              <EditOutlined /> 编辑
            </Button>
            <Button type="link" size="small" @click="handleCopy(record)">
              <CopyOutlined /> 复制
            </Button>
            <Popconfirm
              title="确定删除此模板吗？"
              @confirm="handleDelete(record.id)"
            >
              <Button type="link" size="small" danger>
                <DeleteOutlined /> 删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- Create/Edit Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑模板' : '新建模板'"
      @ok="handleSubmit"
      width="600px"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="模板名称" required>
          <Input
            v-model:value="formState.name"
            placeholder="请输入模板名称"
            :maxlength="100"
          />
        </Form.Item>
        <Form.Item label="分类">
          <Select
            v-model:value="formState.category"
            placeholder="选择分类"
            :options="categoryOptions"
            allow-clear
          />
        </Form.Item>
        <Form.Item label="模板内容" required>
          <Input.TextArea
            v-model:value="formState.text"
            placeholder="请输入模板内容&#10;&#10;可使用变量：{客户名称}、{产品名称} 等"
            :rows="6"
            :maxlength="2048"
            show-count
          />
        </Form.Item>
        <Form.Item v-if="editingId" label="状态">
          <Switch
            v-model:checked="formState.isActive"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
