<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Popconfirm,
  Card,
  Drawer,
  Tooltip,
  Progress,
  Timeline,
  Descriptions,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from 'ant-design-vue';
import {
  ReloadOutlined,
  StopOutlined,
  RedoOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';
import ExecutionFlowView from './components/ExecutionFlowView.vue';

interface ExecutionItem {
  id: number;
  pipelineId: number;
  pipelineName: string;
  status: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  input: string;
  output: string | null;
  error: string | null;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  createdBy: string;
}

interface StepLog {
  step: number;
  name: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  output: string | null;
  error: string | null;
}

const loading = ref(false);
const dataSource = ref<ExecutionItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });

// Filters
const filters = ref({
  pipelineName: '',
  status: undefined as string | undefined,
  dateRange: [] as any[],
});

const detailVisible = ref(false);
const detailExecution = ref<ExecutionItem | null>(null);
const stepLogs = ref<StepLog[]>([]);
const pipelineSteps = ref<any[]>([]);
const stepExecutions = ref<any[]>([]);

const statusOptions = [
  { value: 'PENDING', label: '等待中', color: 'default' },
  { value: 'RUNNING', label: '运行中', color: 'processing' },
  { value: 'COMPLETED', label: '已完成', color: 'success' },
  { value: 'FAILED', label: '失败', color: 'error' },
  { value: 'CANCELLED', label: '已取消', color: 'warning' },
  { value: 'PAUSED', label: '已暂停', color: 'orange' },
];

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '流程名称',
    dataIndex: 'pipelineName',
    key: 'pipelineName',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '进度',
    dataIndex: 'progress',
    key: 'progress',
    width: 150,
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    customRender: ({ text }: { text: number | null }) => {
      if (text === null) return '-';
      if (text < 1000) return `${text}ms`;
      return `${(text / 1000).toFixed(1)}s`;
    },
  },
  {
    title: '执行者',
    dataIndex: 'createdBy',
    key: 'createdBy',
    width: 120,
  },
  {
    title: '开始时间',
    dataIndex: 'startedAt',
    key: 'startedAt',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right' as const,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/ai-studio/executions', {
      params: {
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
        pipelineName: filters.value.pipelineName || undefined,
        status: filters.value.status,
        startDate: filters.value.dateRange[0]?.format('YYYY-MM-DD'),
        endDate: filters.value.dateRange[1]?.format('YYYY-MM-DD'),
      },
    });

    // API returns { data: [...], total } or array directly
    if (response.data) {
      dataSource.value = response.data;
      pagination.value.total = response.total || 0;
    } else if (Array.isArray(response)) {
      dataSource.value = response;
      pagination.value.total = response.length;
    }
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    message.error('获取执行记录失败');
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
};

const handleSearch = () => {
  pagination.value.current = 1;
  fetchData();
};

const handleReset = () => {
  filters.value = {
    pipelineName: '',
    status: undefined,
    dateRange: [],
  };
  pagination.value.current = 1;
  fetchData();
};

const showDetail = async (record: ExecutionItem) => {
  detailExecution.value = record;
  detailVisible.value = true;

  // Fetch pipeline steps
  try {
    const pipelineResponse = await requestClient.get(
      `/ai-studio/pipelines/${record.pipelineId}`,
    );
    pipelineSteps.value =
      pipelineResponse.data?.steps || pipelineResponse.steps || [];
  } catch (error) {
    console.error('Failed to fetch pipeline steps:', error);
    pipelineSteps.value = [];
  }

  // Mock step execution statuses
  stepExecutions.value = pipelineSteps.value.map((step, index) => ({
    stepKey: step.stepKey,
    name: step.name,
    status:
      index < record.completedSteps
        ? 'COMPLETED'
        : index === record.completedSteps && record.status === 'RUNNING'
          ? 'RUNNING'
          : index === record.completedSteps && record.status === 'FAILED'
            ? 'FAILED'
            : 'PENDING',
    startedAt: record.startedAt,
    completedAt: index < record.completedSteps ? record.startedAt : null,
    duration: index < record.completedSteps ? 50 + index * 20 : null,
  }));

  // Mock step logs
  stepLogs.value = stepExecutions.value.map((exec, index) => ({
    step: index + 1,
    name: exec.name,
    status: exec.status,
    startedAt: exec.startedAt,
    completedAt: exec.completedAt,
    duration: exec.duration,
    output: exec.status === 'COMPLETED' ? '{"result": "..."}' : null,
    error: exec.status === 'FAILED' ? record.error : null,
  }));
};

const handleCancel = async (id: number) => {
  try {
    await requestClient.post(`/ai-studio/executions/${id}/cancel`);
    message.success('已取消执行');
    fetchData();
  } catch (error) {
    console.error('Failed to cancel execution:', error);
    message.error('取消失败');
  }
};

const handleRetry = async (id: number) => {
  try {
    await requestClient.post(`/ai-studio/executions/${id}/retry`);
    message.success('已重新执行');
    fetchData();
  } catch (error) {
    console.error('Failed to retry execution:', error);
    message.error('重试失败');
  }
};

const getStatusTagColor = (status: string) => {
  return statusOptions.find((opt) => opt.value === status)?.color || 'default';
};

const getStatusLabel = (status: string) => {
  return statusOptions.find((opt) => opt.value === status)?.label || status;
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="execution-list">
    <Card title="执行记录">
      <template #extra>
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
          刷新
        </Button>
      </template>

      <!-- Filters -->
      <div class="filter-section">
        <Row :gutter="16">
          <Col :span="6">
            <Input
              v-model:value="filters.pipelineName"
              placeholder="流程名称"
              allow-clear
            />
          </Col>
          <Col :span="4">
            <Select
              v-model:value="filters.status"
              placeholder="状态"
              :options="statusOptions"
              allow-clear
              style="width: 100%"
            />
          </Col>
          <Col :span="6">
            <DatePicker.RangePicker
              v-model:value="filters.dateRange"
              style="width: 100%"
            />
          </Col>
          <Col :span="4">
            <Space>
              <Button type="primary" @click="handleSearch">
                <template #icon><SearchOutlined /></template>
                搜索
              </Button>
              <Button @click="handleReset">重置</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusTagColor(record.status)">
              {{ getStatusLabel(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'progress'">
            <Progress
              :percent="record.progress"
              :status="
                record.status === 'FAILED'
                  ? 'exception'
                  : record.status === 'COMPLETED'
                    ? 'success'
                    : 'active'
              "
              size="small"
            />
            <span class="progress-text">
              {{ record.completedSteps }}/{{ record.totalSteps }} 步
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Tooltip title="查看详情">
                <Button type="link" size="small" @click="showDetail(record)">
                  <template #icon><EyeOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="取消" v-if="record.status === 'RUNNING'">
                <Popconfirm
                  title="确定要取消这个执行吗？"
                  @confirm="handleCancel(record.id)"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <Button type="link" danger size="small">
                    <template #icon><StopOutlined /></template>
                  </Button>
                </Popconfirm>
              </Tooltip>
              <Tooltip title="重试" v-if="record.status === 'FAILED'">
                <Button
                  type="link"
                  size="small"
                  @click="handleRetry(record.id)"
                >
                  <template #icon><RedoOutlined /></template>
                </Button>
              </Tooltip>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailVisible"
      title="执行详情"
      width="700"
      placement="right"
    >
      <div v-if="detailExecution" class="execution-detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="执行ID">{{
            detailExecution.id
          }}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag :color="getStatusTagColor(detailExecution.status)">
              {{ getStatusLabel(detailExecution.status) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="流程名称">{{
            detailExecution.pipelineName
          }}</Descriptions.Item>
          <Descriptions.Item label="执行者">{{
            detailExecution.createdBy
          }}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{{
            dayjs(detailExecution.startedAt).format('YYYY-MM-DD HH:mm:ss')
          }}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{{
            detailExecution.completedAt
              ? dayjs(detailExecution.completedAt).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }}</Descriptions.Item>
          <Descriptions.Item label="耗时" :span="2">
            {{
              detailExecution.duration !== null
                ? detailExecution.duration < 1000
                  ? `${detailExecution.duration}ms`
                  : `${(detailExecution.duration / 1000).toFixed(1)}s`
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="输入参数" :span="2">
            <pre class="json-view">{{ detailExecution.input }}</pre>
          </Descriptions.Item>
          <Descriptions.Item label="输出结果" :span="2">
            <pre class="json-view">{{ detailExecution.output || '-' }}</pre>
          </Descriptions.Item>
          <Descriptions.Item
            v-if="detailExecution.error"
            label="错误信息"
            :span="2"
          >
            <Tag color="error">{{ detailExecution.error }}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <div class="flow-visualization">
          <h4>流程可视化</h4>
          <ExecutionFlowView
            v-if="pipelineSteps.length > 0"
            :pipeline-steps="pipelineSteps"
            :step-executions="stepExecutions"
          />
        </div>

        <div class="step-timeline">
          <h4>执行步骤</h4>
          <Timeline>
            <Timeline.Item
              v-for="log in stepLogs"
              :key="log.step"
              :color="
                log.status === 'COMPLETED'
                  ? 'green'
                  : log.status === 'FAILED'
                    ? 'red'
                    : 'blue'
              "
            >
              <div class="step-item">
                <div class="step-header">
                  <span class="step-name">{{ log.step }}. {{ log.name }}</span>
                  <Tag
                    :color="
                      log.status === 'COMPLETED'
                        ? 'success'
                        : log.status === 'FAILED'
                          ? 'error'
                          : 'processing'
                    "
                  >
                    {{ getStatusLabel(log.status) }}
                  </Tag>
                  <span class="step-duration" v-if="log.duration">
                    {{ log.duration }}ms
                  </span>
                </div>
                <div class="step-error" v-if="log.error">
                  <Tag color="error">{{ log.error }}</Tag>
                </div>
              </div>
            </Timeline.Item>
          </Timeline>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.execution-list {
  padding: 20px;
}

.filter-section {
  margin-bottom: 16px;
}

.progress-text {
  margin-left: 8px;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);
}

.execution-detail {
  .json-view {
    max-height: 150px;
    padding: 8px;
    margin: 0;
    overflow: auto;
    font-size: 12px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .flow-visualization {
    margin-top: 24px;

    h4 {
      margin-bottom: 16px;
      font-weight: 500;
    }
  }

  .step-timeline {
    margin-top: 24px;

    h4 {
      margin-bottom: 16px;
      font-weight: 500;
    }

    .step-item {
      .step-header {
        display: flex;
        gap: 8px;
        align-items: center;

        .step-name {
          font-weight: 500;
        }

        .step-duration {
          font-size: 12px;
          color: rgb(0 0 0 / 45%);
        }
      }

      .step-error {
        margin-top: 4px;
      }
    }
  }
}
</style>
