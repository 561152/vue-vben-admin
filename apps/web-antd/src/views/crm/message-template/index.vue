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
  Select,
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
  BarChartOutlined,
} from '@ant-design/icons-vue';
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplate,
} from '#/api/crm';
import { useCrudTable, useModalForm } from '#/composables';
import {
  templateCategoryOptions,
  withAllOption,
} from '#/constants/crm-options';
import dayjs from 'dayjs';

// ==================== 筛选选项 ====================

const categoryOptions = templateCategoryOptions.map((o) => ({
  value: o.label,
  label: o.label,
}));

const activeOptions = [
  { value: '', label: '全部' },
  { value: 'true', label: '启用' },
  { value: 'false', label: '禁用' },
];

// ==================== 表格列定义 ====================

const columns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', width: 200 },
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
    customRender: ({ record }: { record: MessageTemplate }) =>
      record.content?.text || '(无文本)',
  },
  { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 80,
    customRender: ({ text }: { text: boolean }) =>
      h(Tag, { color: text ? 'success' : 'default' }, () =>
        text ? '启用' : '禁用',
      ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    customRender: ({ text }: { text: string }) =>
      dayjs(text).format('MM-DD HH:mm'),
  },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

// ==================== 表格逻辑 ====================

interface TemplateFilters {
  category?: string;
  isActive?: string; // 使用 string 以匹配 Select 组件的 value 类型
}

const { tableProps, filters, search, resetFilters, fetchData, handleDelete } =
  useCrudTable<MessageTemplate, TemplateFilters>({
    fetchApi: async (params) => {
      const apiParams: Record<string, unknown> = {
        page: params.page,
        pageSize: params.pageSize,
      };
      if (params.category) apiParams.category = params.category;
      if (params.isActive) apiParams.isActive = params.isActive === 'true';
      return getMessageTemplates(apiParams);
    },
    deleteApi: async (id) => {
      await deleteMessageTemplate(id as number);
    },
  });

// ==================== Modal 逻辑 ====================

interface TemplateFormState {
  name: string;
  category: string;
  text: string;
  isActive: boolean;
}

const { visible, formState, isEditing, openCreate, openEdit, submit } =
  useModalForm<TemplateFormState>({
    createApi: async (data) => {
      await createMessageTemplate({
        name: data.name,
        category: data.category || undefined,
        content: { text: data.text },
      });
    },
    updateApi: async (id, data) => {
      await updateMessageTemplate(id as number, {
        name: data.name,
        category: data.category || undefined,
        content: { text: data.text },
        isActive: data.isActive,
      });
    },
    initialValues: () => ({
      name: '',
      category: '',
      text: '',
      isActive: true,
    }),
    afterSubmit: fetchData,
  });

// ==================== 事件处理 ====================

function handleEdit(record: MessageTemplate) {
  openEdit(record.id, {
    name: record.name,
    category: record.category || '',
    text: record.content?.text || '',
    isActive: record.isActive,
  });
}

function handleCopy(record: MessageTemplate) {
  openCreate();
  // 复制数据后修改名称
  formState.value = {
    name: `${record.name} (副本)`,
    category: record.category || '',
    text: record.content?.text || '',
    isActive: true,
  };
}

function handleFilter() {
  search();
}

function handleReset() {
  resetFilters();
}

const router = useRouter();

function goToStatistics() {
  router.push('/crm/message-template/statistics');
}

// ==================== 生命周期 ====================

onMounted(fetchData);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">消息模板</h2>
      <Space>
        <Button @click="goToStatistics">
          <template #icon><BarChartOutlined /></template>
          统计分析
        </Button>
        <Button type="primary" @click="openCreate">
          <PlusOutlined /> 新建模板
        </Button>
      </Space>
    </div>

    <!-- 筛选区 -->
    <Card class="mb-4" size="small">
      <Space wrap>
        <span class="text-gray-500">分类:</span>
        <Select
          v-model:value="filters.category"
          :options="withAllOption(categoryOptions)"
          placeholder="选择分类"
          style="width: 120px"
          allow-clear
        />
        <span class="ml-4 text-gray-500">状态:</span>
        <Select
          v-model:value="filters.isActive"
          :options="activeOptions"
          placeholder="选择状态"
          style="width: 100px"
        />
        <Button type="primary" @click="handleFilter">筛选</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </Card>

    <!-- 表格区 (v-bind="tableProps" 一键绑定所有属性) -->
    <Table v-bind="tableProps" :columns="columns" :scroll="{ x: 1000 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="handleEdit(record as MessageTemplate)"
            >
              <EditOutlined /> 编辑
            </Button>
            <Button
              type="link"
              size="small"
              @click="handleCopy(record as MessageTemplate)"
            >
              <CopyOutlined /> 复制
            </Button>
            <Popconfirm
              title="确定删除此模板吗？"
              @confirm="handleDelete((record as MessageTemplate).id)"
            >
              <Button type="link" size="small" danger>
                <DeleteOutlined /> 删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 新建/编辑 Modal -->
    <Modal
      v-model:open="visible"
      :title="isEditing ? '编辑模板' : '新建模板'"
      @ok="submit"
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
        <Form.Item v-if="isEditing" label="状态">
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
