<template>
  <div class="approval-tasks-page">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <Card
        data-testid="pending-count-card"
        class="stats-card"
        :loading="loading"
      >
        <Statistic
          title="待审批"
          :value="stats.pending"
          :value-style="{ color: '#1890ff' }"
        >
          <template #prefix>
            <ClockCircleOutlined />
          </template>
        </Statistic>
      </Card>

      <Card
        data-testid="today-approved-card"
        class="stats-card"
        :loading="loading"
      >
        <Statistic
          title="今日已审批"
          :value="stats.todayApproved"
          :value-style="{ color: '#52c41a' }"
        >
          <template #prefix>
            <CheckCircleOutlined />
          </template>
        </Statistic>
      </Card>

      <Card class="stats-card" :loading="loading">
        <Statistic
          title="今日已拒绝"
          :value="stats.todayRejected"
          :value-style="{ color: '#ff4d4f' }"
        >
          <template #prefix>
            <CloseCircleOutlined />
          </template>
        </Statistic>
      </Card>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <Space>
        <Select
          v-model:value="statusFilter"
          data-testid="status-filter"
          placeholder="筛选状态"
          style="width: 120px"
          :options="statusOptions"
          @change="handleFilterChange"
        />

        <Button
          data-testid="refresh-button"
          :loading="loading"
          @click="fetchTasks"
        >
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </Button>
      </Space>
    </div>

    <!-- 任务列表 -->
    <Table
      data-testid="approval-task-table"
      :columns="columns"
      :data-source="tasks"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record) => record.id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'id'">
          <span :data-testid="`approval-task-row-${index}`">
            {{ record.id }}
          </span>
        </template>

        <template v-if="column.key === 'approvalReason'">
          <Tooltip :title="record.approvalReason">
            <span class="reason-text">{{ record.approvalReason }}</span>
          </Tooltip>
        </template>

        <template v-if="column.key === 'status'">
          <Tag
            :color="getStatusColor(record.status)"
          >
            {{ getStatusText(record.status) }}
          </Tag>
        </template>

        <template v-if="column.key === 'priority'">
          <Tag
            :color="getPriorityColor(record.priority)"
          >
            优先级 {{ record.priority }}
          </Tag>
        </template>

        <template v-if="column.key === 'actions'">
          <Space>
            <Button
              :data-testid="`view-task-${record.id}`"
              type="link"
              size="small"
              @click="handleView(record)"
            >
              查看
            </Button>

            <Button
              v-if="record.status === 'PENDING'"
              :data-testid="`approve-task-${record.id}`"
              type="link"
              size="small"
              @click="handleApprove(record)"
            >
              通过
            </Button>

            <Button
              v-if="record.status === 'PENDING'"
              :data-testid="`reject-task-${record.id}`"
              type="link"
              danger
              size="small"
              @click="handleReject(record)"
            >
              拒绝
            </Button>

            <Button
              v-if="record.status === 'APPROVED' || record.status === 'REJECTED'"
              :data-testid="`view-result-${record.id}`"
              type="link"
              size="small"
              @click="handleViewResult(record)"
            >
              审批结果
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 审批对话框 -->
    <Modal
      v-model:open="approvalDialogVisible"
      data-testid="approval-dialog"
      title="审批通过"
      @ok="confirmApprove"
      @cancel="approvalDialogVisible = false"
    >
      <Form layout="vertical">
        <FormItem label="审批意见（可选）">
          <Textarea
            v-model:value="approvalComment"
            data-testid="approval-comment-input"
            :rows="4"
            placeholder="请输入审批意见..."
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 拒绝对话框 -->
    <Modal
      v-model:open="rejectDialogVisible"
      data-testid="reject-dialog"
      title="审批拒绝"
      @ok="confirmReject"
      @cancel="rejectDialogVisible = false"
    >
      <Form layout="vertical">
        <FormItem
          label="拒绝理由"
          required
        >
          <Textarea
            v-model:value="rejectReason"
            data-testid="reject-reason-input"
            :rows="4"
            placeholder="请输入拒绝理由（必填）..."
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 审批结果详情弹窗 -->
    <ApprovalResultModal
      v-model:visible="resultModalVisible"
      :record-id="currentRecordId"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import {
  message,
  Card,
  Statistic,
  Space,
  Select,
  Button,
  Table,
  Tag,
  Tooltip,
  Modal,
  Form,
  Textarea,
} from 'ant-design-vue';

// 提取子组件
const FormItem = Form.Item;

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';

// 使用项目标准的 requestClient 进行 API 调用
import { requestClient } from '#/api/request';

// 导入审批结果弹窗组件
import ApprovalResultModal from './ApprovalResultModal.vue';

// 状态筛选选项
const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '待审批', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

// 状态
const loading = ref(false);
const stats = reactive({
  pending: 0,
  todayApproved: 0,
  todayRejected: 0,
});
const tasks = ref<any[]>([]);
const statusFilter = ref('PENDING');
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 对话框状态
const approvalDialogVisible = ref(false);
const rejectDialogVisible = ref(false);
const resultModalVisible = ref(false);
const currentTask = ref<any>(null);
const currentRecordId = ref<string>('');
const approvalComment = ref('');
const rejectReason = ref('');

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '审批原因',
    dataIndex: 'approvalReason',
    key: 'approvalReason',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
  },
];

// 获取统计数据
async function fetchStats() {
  try {
    const data = await requestClient.get('/education/paper/approval-tasks/stats');
    Object.assign(stats, data);
  } catch (error) {
    console.error('获取统计失败:', error);
    message.error('获取统计失败');
  }
}

// 获取任务列表
async function fetchTasks() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    if (statusFilter.value && statusFilter.value !== 'ALL') {
      params.status = statusFilter.value;
    }

    const data = await requestClient.get('/education/paper/approval-tasks', { params });
    tasks.value = data.items || [];
    pagination.total = data.total || 0;
  } catch (error) {
    console.error('获取任务列表失败:', error);
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

// 状态颜色
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    TIMEOUT: 'orange',
  };
  return colors[status] || 'default';
}

// 状态文本
function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    TIMEOUT: '已超时',
  };
  return texts[status] || status;
}

// 优先级颜色
function getPriorityColor(priority: number): string {
  if (priority === 1) return 'red';
  if (priority === 2) return 'orange';
  return 'default';
}

// 处理筛选变化
function handleFilterChange() {
  pagination.current = 1;
  fetchTasks();
}

// 处理表格变化
function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchTasks();
}

// 处理查看
function handleView(record: any) {
  message.info(`查看任务详情: ${record.id}`);
  // TODO: 跳转到详情页
}

// 处理审批通过
function handleApprove(record: any) {
  currentTask.value = record;
  approvalComment.value = '';
  approvalDialogVisible.value = true;
}

// 确认审批通过
async function confirmApprove() {
  if (!currentTask.value) return;

  try {
    await requestClient.post(
      `/education/paper/approval-tasks/${currentTask.value.id}/approve`,
      {
        comment: approvalComment.value,
      },
    );

    message.success('审批通过成功');
    approvalDialogVisible.value = false;
    fetchStats();
    fetchTasks();
  } catch (error) {
    console.error('审批通过失败:', error);
    message.error('审批通过失败');
  }
}

// 处理审批拒绝
function handleReject(record: any) {
  currentTask.value = record;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

// 确认审批拒绝
async function confirmReject() {
  if (!currentTask.value) return;

  if (!rejectReason.value.trim()) {
    message.error('请输入拒绝理由');
    return;
  }

  try {
    await requestClient.post(
      `/education/paper/approval-tasks/${currentTask.value.id}/reject`,
      {
        reason: rejectReason.value,
      },
    );

    message.success('审批拒绝成功');
    rejectDialogVisible.value = false;
    fetchStats();
    fetchTasks();
  } catch (error) {
    console.error('审批拒绝失败:', error);
    message.error('审批拒绝失败');
  }
}

// 查看审批结果
function handleViewResult(record: any) {
  // 从审批任务中获取关联的批改记录ID
  // 注意：这里需要根据实际数据结构调整
  // 如果审批任务数据中包含 recordId 或 executionId，使用相应字段
  if (record.recordId) {
    currentRecordId.value = record.recordId;
    resultModalVisible.value = true;
  } else {
    message.warning('无法获取批改记录ID，请联系管理员');
  }
}

// 初始化
onMounted(() => {
  fetchStats();
  fetchTasks();
});
</script>

<style scoped>
.approval-tasks-page {
  padding: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stats-card {
  min-width: 200px;
}

.toolbar {
  margin-bottom: 16px;
}

.reason-text {
  display: inline-block;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
