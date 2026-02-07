<script lang="ts" setup>
import { ref, onMounted, computed, h } from 'vue';
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
  Modal,
  Collapse,
} from 'ant-design-vue';
import {
  ReloadOutlined,
  StopOutlined,
  RedoOutlined,
  EyeOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import {
  getFeatureModules,
  type FeatureModule,
} from '#/api/ai-studio/pipeline';
import dayjs from 'dayjs';
import ExecutionFlowView from './components/ExecutionFlowView.vue';
import GradingQuestionList from './components/GradingQuestionList.vue';
import type {
  GradingQuestion,
  GradingSummary,
} from './components/GradingQuestionList.vue';

interface ExecutionItem {
  id: number;
  pipelineId: number;
  pipelineKey: string;
  pipelineName: string;
  status: string;
  progress: number;
  totalSteps?: number; // 修改为可选
  completedSteps?: number; // 修改为可选
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  currentStep?: string;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: string;
  createdAt: string;
  failedStepName?: string; // 前端动态获取的失败步骤名称
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

// 功能模块筛选
const featureModules = ref<FeatureModule[]>([]);
// 只有当用户有功能模块权限时才显示筛选器
const showFeatureFilter = computed(() => featureModules.value.length > 0);

// Filters
const filters = ref({
  pipelineName: '',
  status: undefined as string | undefined,
  dateRange: [] as any[],
  featureCode: undefined as string | undefined,
});

const detailVisible = ref(false);
const detailExecution = ref<ExecutionItem | null>(null);
const stepLogs = ref<StepLog[]>([]);
const pipelineSteps = ref<any[]>([]);
const stepExecutions = ref<any[]>([]);

// 失败原因弹窗
const errorVisible = ref(false);
const errorExecution = ref<ExecutionItem | null>(null);

// 批改详情
const gradingDetailsLoading = ref(false);
const gradingQuestions = ref<GradingQuestion[]>([]);
const gradingSummary = ref<GradingSummary>({
  totalQuestions: 0,
  correctCount: 0,
  totalScore: 0,
  maxScore: 0,
  accuracy: 0,
});
const hasGradingDetails = ref(false);

// Drawer 宽度控制
const drawerWidth = ref(800);
const minDrawerWidth = 400;
const maxDrawerWidth = window.innerWidth - 100;
const isDragging = ref(false);

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
    title: '错误信息',
    dataIndex: 'errorMessage',
    key: 'errorMessage',
    width: 250,
    ellipsis: true,
  },
  {
    title: '执行者',
    dataIndex: 'triggeredBy',
    key: 'triggeredBy',
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
        featureCode: filters.value.featureCode || undefined,
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

// 加载功能模块列表（根据用户权限过滤）
const loadFeatureModules = async () => {
  try {
    const modules = await getFeatureModules();
    featureModules.value = modules || [];
  } catch (error: any) {
    // 403 或其他权限错误时不显示筛选器
    if (error?.response?.status === 403) {
      console.warn('No permission to view feature modules');
    } else {
      console.error('Failed to load feature modules:', error);
    }
    featureModules.value = [];
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
    featureCode: undefined,
  };
  pagination.value.current = 1;
  fetchData();
};

const showError = async (record: ExecutionItem) => {
  errorExecution.value = record;
  errorVisible.value = true;

  // Fetch pipeline steps to get step name
  try {
    const pipelineResponse = await requestClient.get(
      `/ai-studio/pipelines/${record.pipelineKey}`,
    );
    const steps = pipelineResponse.data?.steps || pipelineResponse.steps || [];

    // 如果后端没有返回 completedSteps 和 totalSteps，从这里设置
    const totalSteps = steps.length;
    const completedSteps = record.completedSteps ?? 0;

    // 获取失败步骤的名称
    if (steps.length > 0 && completedSteps < steps.length) {
      const failedStepIndex = completedSteps;
      const failedStep = steps[failedStepIndex];
      if (failedStep && failedStep.name) {
        // 将步骤名称和步骤数添加到 errorExecution 中
        errorExecution.value = {
          ...record,
          failedStepName: failedStep.name,
          totalSteps: totalSteps,
          completedSteps: completedSteps,
        };
      } else {
        errorExecution.value = {
          ...record,
          totalSteps: totalSteps,
          completedSteps: completedSteps,
        };
      }
    } else {
      errorExecution.value = {
        ...record,
        totalSteps: totalSteps,
        completedSteps: completedSteps,
      };
    }
  } catch (error) {
    console.error('Failed to fetch pipeline steps:', error);
    // 即使获取失败，也设置默认值
    errorExecution.value = {
      ...record,
      totalSteps: record.totalSteps ?? 0,
      completedSteps: record.completedSteps ?? 0,
    };
  }
};

const showDetail = async (record: ExecutionItem) => {
  detailExecution.value = record;
  detailVisible.value = true;
  hasGradingDetails.value = false;

  // Fetch pipeline steps
  try {
    const pipelineResponse = await requestClient.get(
      `/ai-studio/pipelines/${record.pipelineKey}`,
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
    error: exec.status === 'FAILED' ? record.errorMessage : null,
  }));

  // Fetch grading details if it's a grading workflow
  if (record.pipelineKey?.includes('grading') || record.outputData?.summary) {
    await fetchGradingDetails(record.id);
  }
};

// Drawer 拖拽调整宽度
const handleResizeStart = (e: MouseEvent) => {
  isDragging.value = true;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return;

    const newWidth = window.innerWidth - moveEvent.clientX;

    if (newWidth >= minDrawerWidth && newWidth <= maxDrawerWidth) {
      drawerWidth.value = newWidth;
    }
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
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

async function fetchGradingDetails(executionId: number) {
  gradingDetailsLoading.value = true;
  hasGradingDetails.value = false;
  try {
    const response = await requestClient.get(
      `/ai-studio/executions/${executionId}/grading-details`,
    );
    if (response.questions && response.questions.length > 0) {
      gradingQuestions.value = response.questions;
      gradingSummary.value = response.summary;
      hasGradingDetails.value = true;
    }
  } catch (error: any) {
    // 404 means no grading details available yet, ignore
    if (error.response?.status !== 404) {
      console.error('Failed to fetch grading details:', error);
    }
  } finally {
    gradingDetailsLoading.value = false;
  }
}

onMounted(() => {
  loadFeatureModules();
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
          <!-- 只有当用户有功能模块权限时才显示功能模块筛选器 -->
          <Col v-if="showFeatureFilter" :span="4">
            <Select
              v-model:value="filters.featureCode"
              placeholder="功能模块"
              allow-clear
              style="width: 100%"
            >
              <Select.Option
                v-for="item in featureModules"
                :key="item.code"
                :value="item.code"
              >
                {{ item.label }}
              </Select.Option>
            </Select>
          </Col>
          <Col :span="5">
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
          <Col :span="5">
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
        :scroll="{ x: 1450 }"
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
          <template v-else-if="column.key === 'errorMessage'">
            <div
              v-if="record.errorMessage"
              style="display: flex; gap: 8px; align-items: center"
            >
              <span
                style="
                  flex: 1;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  color: #cf1322;
                  white-space: nowrap;
                "
              >
                {{ record.errorMessage }}
              </span>
              <Button
                type="link"
                size="small"
                danger
                @click="showError(record)"
              >
                查看原因
              </Button>
            </div>
            <span v-else style="color: #999">-</span>
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
      :width="drawerWidth"
      placement="right"
      :class="{ 'resizing-drawer': isDragging }"
    >
      <!-- 拖拽手柄 -->
      <div
        class="drawer-resize-handle"
        @mousedown="handleResizeStart"
        :style="{ cursor: isDragging ? 'ew-resize' : 'ew-resize' }"
      ></div>
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
            detailExecution.triggeredBy
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
              detailExecution.durationMs !== null
                ? detailExecution.durationMs < 1000
                  ? `${detailExecution.durationMs}ms`
                  : `${(detailExecution.durationMs / 1000).toFixed(1)}s`
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="输入参数" :span="2">
            <pre class="json-view">{{
              JSON.stringify(detailExecution.inputData, null, 2)
            }}</pre>
          </Descriptions.Item>
          <Descriptions.Item label="输出结果" :span="2">
            <pre class="json-view">{{
              detailExecution.outputData
                ? JSON.stringify(detailExecution.outputData, null, 2)
                : '-'
            }}</pre>
          </Descriptions.Item>
          <Descriptions.Item
            v-if="detailExecution.errorMessage"
            label="错误信息"
            :span="2"
          >
            <Tag color="error">{{ detailExecution.errorMessage }}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <!-- 【新增】题目批改详情 -->
        <div v-if="hasGradingDetails" class="grading-details-section">
          <Collapse>
            <Collapse.Panel :key="1">
              <template #header>
                <span class="grading-details-header">
                  📋 题目批改详情
                  <Tag color="blue">{{ gradingSummary.totalQuestions }}题</Tag>
                  <Tag color="success"
                    >正确{{ gradingSummary.correctCount }}题</Tag
                  >
                  <Tag
                    :color="
                      gradingSummary.accuracy >= 80 ? 'success' : 'warning'
                    "
                  >
                    正确率{{ gradingSummary.accuracy.toFixed(1) }}%
                  </Tag>
                </span>
              </template>
              <GradingQuestionList
                :questions="gradingQuestions"
                :summary="gradingSummary"
                :loading="gradingDetailsLoading"
              />
            </Collapse.Panel>
          </Collapse>
        </div>

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

    <!-- 失败原因弹窗 -->
    <Modal
      v-model:open="errorVisible"
      title="失败原因"
      width="700px"
      :footer="null"
    >
      <div v-if="errorExecution" class="error-detail-container">
        <!-- 基本信息 -->
        <div class="error-section">
          <div class="error-section-title">
            <CloseCircleOutlined style="margin-right: 8px; color: #cf1322" />
            基本信息
          </div>
          <Descriptions :column="2" size="small" bordered>
            <Descriptions.Item label="执行ID">
              {{ errorExecution.id }}
            </Descriptions.Item>
            <Descriptions.Item label="流程名称">
              {{ errorExecution.pipelineName }}
            </Descriptions.Item>
            <Descriptions.Item label="失败时间" :span="2">
              {{
                errorExecution.completedAt
                  ? dayjs(errorExecution.completedAt).format(
                      'YYYY-MM-DD HH:mm:ss',
                    )
                  : '-'
              }}
            </Descriptions.Item>
            <Descriptions.Item label="失败步骤" :span="2">
              <div style="display: flex; gap: 8px; align-items: center">
                <span
                  v-if="errorExecution.failedStepName"
                  style="font-weight: 500; color: #cf1322"
                >
                  {{ errorExecution.failedStepName }}
                </span>
                <span
                  v-else-if="errorExecution.currentStep"
                  style="font-weight: 500; color: #cf1322"
                >
                  {{ errorExecution.currentStep }}
                </span>
                <span v-else style="font-weight: 500; color: #cf1322">
                  第 {{ (errorExecution.completedSteps ?? 0) + 1 }} 步
                </span>
                <span
                  v-if="errorExecution.totalSteps !== undefined"
                  style="font-size: 12px; color: #999"
                >
                  (进度: {{ errorExecution.completedSteps ?? 0 }}/{{
                    errorExecution.totalSteps
                  }})
                </span>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 错误信息 -->
        <div class="error-section">
          <div class="error-section-title">
            <ExclamationCircleOutlined
              style="margin-right: 8px; color: #faad14"
            />
            错误信息
          </div>
          <div class="error-message-box">
            {{ errorExecution.errorMessage || '无错误信息' }}
          </div>
        </div>

        <!-- 输入参数 -->
        <div class="error-section">
          <div class="error-section-title">📋 输入参数</div>
          <div class="error-json-box">
            <pre>{{ JSON.stringify(errorExecution.inputData, null, 2) }}</pre>
          </div>
        </div>

        <!-- 操作建议 -->
        <div class="error-section">
          <div class="error-section-title">💡 操作建议</div>
          <ul class="error-suggestions">
            <li v-if="errorExecution.errorMessage?.includes('image')">
              检查图片URL是否可访问，是否已过期
            </li>
            <li
              v-if="
                errorExecution.errorMessage?.includes('No questions') ||
                errorExecution.errorMessage?.includes('extract')
              "
            >
              确认图片中包含可识别的题目内容
            </li>
            <li v-if="errorExecution.errorMessage?.includes('timeout')">
              任务超时，可能需要优化处理流程或增加超时时间
            </li>
            <li
              v-if="
                errorExecution.errorMessage?.includes('quota') ||
                errorExecution.errorMessage?.includes('Insufficient')
              "
            >
              配额不足，请充值或联系管理员
            </li>
            <li
              v-if="
                errorExecution.errorMessage?.includes('network') ||
                errorExecution.errorMessage?.includes('connect')
              "
            >
              网络连接问题，请检查网络状态或稍后重试
            </li>
            <li>查看输入参数以确认数据正确性</li>
            <li>点击"重试执行"按钮使用原始数据重新执行</li>
          </ul>
        </div>

        <!-- 快捷操作 -->
        <div style="margin-top: 16px; text-align: right">
          <Space>
            <Button @click="errorVisible = false"> 关闭 </Button>
            <Button
              type="primary"
              danger
              @click="
                handleRetry(errorExecution.id);
                errorVisible = false;
              "
            >
              <template #icon><RedoOutlined /></template>
              重试执行
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
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

  .grading-details-section {
    margin-top: 24px;

    .grading-details-header {
      display: flex;
      gap: 8px;
      align-items: center;
      font-weight: 500;
    }
  }
}

/* Drawer 拖拽调整宽度样式 */
.drawer-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
}

.drawer-resize-handle:hover {
  background: rgb(24 144 255 / 30%);
}

.drawer-resize-handle:active {
  background: rgb(24 144 255 / 50%);
}

.resizing-drawer :deep(.ant-drawer-body) {
  user-select: none;
}

/* 失败原因弹窗样式 */
.error-detail-container {
  padding: 8px 0;
}

.error-section {
  margin-bottom: 20px;
}

.error-section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.error-message-box {
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #cf1322;
  overflow-wrap: break-word;
  background: #fff2e8;
  border: 1px solid #ffbb96;
  border-radius: 4px;
}

.error-json-box {
  max-height: 200px;
  padding: 12px;
  overflow: auto;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.error-json-box pre {
  margin: 0;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #595959;
  word-break: break-all;
  white-space: pre-wrap;
}

.error-suggestions {
  padding: 12px 12px 12px 28px;
  margin: 0;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
}

.error-suggestions li {
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.8;
  color: #1890ff;
}

.error-suggestions li:last-child {
  margin-bottom: 0;
}
</style>
