<script lang="ts" setup>
import { onMounted } from 'vue';
import {
  Button,
  Space,
  message,
  Tag,
  Card,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
} from 'ant-design-vue';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import { useCrudTable, useModalForm } from '#/composables';
import dayjs from 'dayjs';

// ==================== 类型定义 ====================

interface ScheduledMessage {
  id: number;
  name: string;
  content: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'SENT' | 'FAILED' | 'CANCELLED';
  targetType: 'CUSTOMER' | 'TAG' | 'ALL';
  targetCount: number;
  createdAt: string;
}

interface FormState {
  name: string;
  content: string;
  scheduledAt: dayjs.Dayjs | undefined;
  targetType: 'CUSTOMER' | 'TAG' | 'ALL';
  targetIds: number[];
}

// ==================== 常量 ====================

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '消息内容', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: '计划发送时间', dataIndex: 'scheduledAt', key: 'scheduledAt', width: 180 },
  { title: '目标数量', dataIndex: 'targetCount', key: 'targetCount', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200 },
];

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待确认', color: 'orange' },
  CONFIRMED: { text: '待发送', color: 'blue' },
  SENT: { text: '已发送', color: 'green' },
  FAILED: { text: '发送失败', color: 'red' },
  CANCELLED: { text: '已取消', color: 'default' },
};

const targetTypeOptions = [
  { value: 'CUSTOMER', label: '指定客户' },
  { value: 'TAG', label: '按标签' },
  { value: 'ALL', label: '全部客户' },
];

// ==================== 表格逻辑 ====================

const { tableProps, fetchData } = useCrudTable<ScheduledMessage>({
  fetchApi: async (params) => {
    const res = await requestClient.get<{ data: ScheduledMessage[]; total?: number }>(
      '/scheduled-messages',
      { params: { page: params.page, pageSize: params.pageSize } },
    );
    return { items: res.data || [], total: res.total || res.data?.length || 0 };
  },
});

// ==================== Modal 逻辑 ====================

const { visible, formState, isEditing, openCreate, openEdit, submit } =
  useModalForm<FormState>({
    createApi: async (data) => {
      await requestClient.post('/scheduled-messages', {
        ...data,
        scheduledAt: data.scheduledAt?.toISOString(),
      });
    },
    updateApi: async (id, data) => {
      await requestClient.put(`/scheduled-messages/${id}`, {
        ...data,
        scheduledAt: data.scheduledAt?.toISOString(),
      });
    },
    initialValues: () => ({
      name: '',
      content: '',
      scheduledAt: undefined,
      targetType: 'CUSTOMER',
      targetIds: [],
    }),
    afterSubmit: fetchData,
  });

// ==================== 事件处理 ====================

function handleEdit(record: ScheduledMessage) {
  openEdit(record.id, {
    name: record.name,
    content: record.content,
    scheduledAt: dayjs(record.scheduledAt),
    targetType: record.targetType,
    targetIds: [],
  });
}

async function handleConfirm(id: number) {
  try {
    await requestClient.post(`/scheduled-messages/${id}/confirm`);
    message.success('已确认，将按计划发送');
    fetchData();
  } catch {
    message.error('确认失败');
  }
}

async function handleExecute(id: number) {
  try {
    await requestClient.post(`/scheduled-messages/${id}/execute`);
    message.success('已立即发送');
    fetchData();
  } catch {
    message.error('发送失败');
  }
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/scheduled-messages/${id}`);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

// ==================== 生命周期 ====================

onMounted(fetchData);
</script>

<template>
  <div class="scheduled-message-container">
    <Card title="定时消息" :bordered="false">
      <template #extra>
        <Button type="primary" @click="openCreate">
          <template #icon><PlusOutlined /></template>
          新建定时消息
        </Button>
      </template>

      <Table v-bind="tableProps" :columns="columns">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scheduledAt'">
            <Space>
              <ClockCircleOutlined />
              {{ formatDate((record as ScheduledMessage).scheduledAt) }}
            </Space>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusMap[(record as ScheduledMessage).status]?.color">
              {{ statusMap[(record as ScheduledMessage).status]?.text }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button
                v-if="(record as ScheduledMessage).status === 'PENDING'"
                type="link"
                size="small"
                @click="handleConfirm((record as ScheduledMessage).id)"
              >
                <CheckCircleOutlined /> 确认
              </Button>
              <Button
                v-if="(record as ScheduledMessage).status === 'CONFIRMED'"
                type="link"
                size="small"
                @click="handleExecute((record as ScheduledMessage).id)"
              >
                <SendOutlined /> 立即发送
              </Button>
              <Button
                v-if="['PENDING', 'CONFIRMED'].includes((record as ScheduledMessage).status)"
                type="link"
                size="small"
                @click="handleEdit(record as ScheduledMessage)"
              >
                <EditOutlined /> 编辑
              </Button>
              <Popconfirm
                v-if="['PENDING', 'CONFIRMED'].includes((record as ScheduledMessage).status)"
                title="确定要删除这条定时消息吗？"
                @confirm="handleDelete((record as ScheduledMessage).id)"
              >
                <Button type="link" size="small" danger>
                  <DeleteOutlined /> 删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
        <template #emptyText>
          <div style="padding: 40px; text-align: center; color: #999">
            <ClockCircleOutlined style="font-size: 48px; margin-bottom: 16px" />
            <p>暂无定时消息</p>
            <p>点击"新建定时消息"创建您的第一条定时消息</p>
          </div>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="visible"
      :title="isEditing ? '编辑定时消息' : '新建定时消息'"
      @ok="submit"
    >
      <Form layout="vertical">
        <Form.Item label="任务名称" required>
          <Input v-model:value="formState.name" placeholder="请输入任务名称" />
        </Form.Item>
        <Form.Item label="消息内容" required>
          <Input.TextArea
            v-model:value="formState.content"
            placeholder="请输入消息内容"
            :rows="4"
          />
        </Form.Item>
        <Form.Item label="计划发送时间" required>
          <DatePicker
            v-model:value="formState.scheduledAt"
            show-time
            placeholder="选择发送时间"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="发送目标">
          <Select
            v-model:value="formState.targetType"
            :options="targetTypeOptions"
            placeholder="选择发送目标类型"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.scheduled-message-container {
  padding: 16px;
}
</style>
