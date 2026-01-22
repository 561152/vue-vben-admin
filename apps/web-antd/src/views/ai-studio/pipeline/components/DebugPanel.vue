<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  Card,
  Button,
  Input,
  Space,
  Timeline,
  Tag,
  Collapse,
  Descriptions,
  Alert,
  Spin,
  Tooltip,
  Progress,
  Divider,
} from 'ant-design-vue';
import {
  PlayCircleOutlined,
  StopOutlined,
  ClearOutlined,
  ExpandOutlined,
  CompressOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons-vue';
import { io, Socket } from 'socket.io-client';
import { requestClient } from '#/api/request';

interface StepProgress {
  stepKey: string;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  input?: any;
  output?: any;
  error?: string;
  metrics?: {
    tokensUsed?: number;
    latencyMs?: number;
    cost?: number;
  };
}

interface Props {
  pipelineKey: string;
  steps: Array<{ stepKey: string; name: string }>;
}

interface Emits {
  (e: 'step-highlight', stepKey: string | null): void;
  (e: 'execution-complete', result: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isExpanded = ref(true);
const inputJson = ref('{\n  "imageBase64": "",\n  "studentId": 1,\n  "subject": "math"\n}');
const inputError = ref('');
const isExecuting = ref(false);
const executionId = ref<string | null>(null);
const executionStatus = ref<'idle' | 'queued' | 'running' | 'completed' | 'failed'>('idle');
const stepProgresses = ref<Map<string, StepProgress>>(new Map());
const executionResult = ref<any>(null);
const socket = ref<Socket | null>(null);
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const logs = ref<Array<{ time: string; level: string; message: string }>>([]);
const streamingOutput = ref<string>('');

// 验证 JSON 输入
const validateInput = (): boolean => {
  try {
    JSON.parse(inputJson.value);
    inputError.value = '';
    return true;
  } catch (e: any) {
    inputError.value = `JSON 格式错误: ${e.message}`;
    return false;
  }
};

// 初始化步骤状态
const initStepProgresses = () => {
  stepProgresses.value = new Map();
  props.steps.forEach((step) => {
    stepProgresses.value.set(step.stepKey, {
      stepKey: step.stepKey,
      stepName: step.name,
      status: 'pending',
    });
  });
};

// 连接 WebSocket
const connectWebSocket = () => {
  if (socket.value?.connected) return;

  connectionStatus.value = 'connecting';

  // 获取 WebSocket URL
  const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
  socket.value = io(`${wsUrl}/pipeline`, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.value.on('connect', () => {
    connectionStatus.value = 'connected';
    addLog('info', 'WebSocket 已连接');

    // 如果有执行中的任务，订阅它
    if (executionId.value) {
      socket.value?.emit('subscribe', executionId.value);
    }
  });

  socket.value.on('disconnect', () => {
    connectionStatus.value = 'disconnected';
    addLog('warn', 'WebSocket 已断开');
  });

  socket.value.on('subscribed', (data: { executionId: string }) => {
    addLog('info', `已订阅执行: ${data.executionId}`);
  });

  socket.value.on('step_started', (data: { stepKey: string; stepName: string }) => {
    addLog('info', `步骤开始: ${data.stepName}`);
    const progress = stepProgresses.value.get(data.stepKey);
    if (progress) {
      progress.status = 'running';
      progress.startTime = Date.now();
      stepProgresses.value.set(data.stepKey, { ...progress });
    }
    emit('step-highlight', data.stepKey);
  });

  socket.value.on('step_completed', (data: { stepKey: string; output: any; metrics?: any }) => {
    addLog('info', `步骤完成: ${data.stepKey}`);
    const progress = stepProgresses.value.get(data.stepKey);
    if (progress) {
      progress.status = 'completed';
      progress.endTime = Date.now();
      progress.output = data.output;
      progress.metrics = data.metrics;
      stepProgresses.value.set(data.stepKey, { ...progress });
    }
  });

  socket.value.on('step_failed', (data: { stepKey: string; error: string }) => {
    addLog('error', `步骤失败: ${data.stepKey} - ${data.error}`);
    const progress = stepProgresses.value.get(data.stepKey);
    if (progress) {
      progress.status = 'failed';
      progress.endTime = Date.now();
      progress.error = data.error;
      stepProgresses.value.set(data.stepKey, { ...progress });
    }
  });

  socket.value.on('step_skipped', (data: { stepKey: string; reason: string }) => {
    addLog('info', `步骤跳过: ${data.stepKey} - ${data.reason}`);
    const progress = stepProgresses.value.get(data.stepKey);
    if (progress) {
      progress.status = 'skipped';
      stepProgresses.value.set(data.stepKey, { ...progress });
    }
  });

  socket.value.on('stream_chunk', (data: { stepKey: string; chunk: string }) => {
    streamingOutput.value += data.chunk;
  });

  socket.value.on('execution_completed', (data: { result: any }) => {
    addLog('info', '执行完成');
    executionStatus.value = 'completed';
    executionResult.value = data.result;
    isExecuting.value = false;
    emit('step-highlight', null);
    emit('execution-complete', data.result);
  });

  socket.value.on('execution_failed', (data: { error: string }) => {
    addLog('error', `执行失败: ${data.error}`);
    executionStatus.value = 'failed';
    isExecuting.value = false;
    emit('step-highlight', null);
  });
};

// 断开 WebSocket
const disconnectWebSocket = () => {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }
  connectionStatus.value = 'disconnected';
};

// 添加日志
const addLog = (level: string, message: string) => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, level, message });
  // 最多保留 100 条日志
  if (logs.value.length > 100) {
    logs.value.shift();
  }
};

// 开始执行
const startExecution = async () => {
  if (!validateInput()) return;

  isExecuting.value = true;
  executionStatus.value = 'queued';
  executionResult.value = null;
  streamingOutput.value = '';
  initStepProgresses();
  logs.value = [];
  addLog('info', '开始执行流程...');

  try {
    const input = JSON.parse(inputJson.value);
    const response = await requestClient.post(
      `/ai-studio/pipelines/${props.pipelineKey}/execute`,
      { inputs: input }
    );

    executionId.value = response.executionId || response.data?.executionId;

    if (executionId.value) {
      addLog('info', `执行 ID: ${executionId.value}`);
      executionStatus.value = 'running';

      // 连接 WebSocket 并订阅
      connectWebSocket();
      if (socket.value?.connected) {
        socket.value.emit('subscribe', executionId.value);
      }
    } else {
      // 同步执行模式
      executionStatus.value = 'completed';
      executionResult.value = response;
      isExecuting.value = false;
      addLog('info', '执行完成 (同步模式)');
    }
  } catch (error: any) {
    addLog('error', `执行失败: ${error.message}`);
    executionStatus.value = 'failed';
    isExecuting.value = false;
  }
};

// 停止执行
const stopExecution = async () => {
  if (!executionId.value) return;

  try {
    await requestClient.post(`/ai-studio/executions/${executionId.value}/cancel`);
    addLog('warn', '已取消执行');
    isExecuting.value = false;
    executionStatus.value = 'failed';
  } catch (error: any) {
    addLog('error', `取消失败: ${error.message}`);
  }
};

// 清除日志
const clearLogs = () => {
  logs.value = [];
  streamingOutput.value = '';
};

// 计算进度百分比
const progressPercent = computed(() => {
  const total = props.steps.length;
  if (total === 0) return 0;

  const completed = Array.from(stepProgresses.value.values()).filter(
    (p) => p.status === 'completed' || p.status === 'skipped'
  ).length;

  return Math.round((completed / total) * 100);
});

// 状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'default',
    running: 'processing',
    completed: 'success',
    failed: 'error',
    skipped: 'warning',
  };
  return colors[status] || 'default';
};

// 状态图标
const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    pending: ClockCircleOutlined,
    running: LoadingOutlined,
    completed: CheckCircleOutlined,
    failed: CloseCircleOutlined,
    skipped: ClockCircleOutlined,
  };
  return icons[status] || ClockCircleOutlined;
};

// 格式化耗时
const formatDuration = (startTime?: number, endTime?: number) => {
  if (!startTime) return '-';
  const end = endTime || Date.now();
  const duration = end - startTime;
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
};

watch(() => inputJson.value, validateInput);

onMounted(() => {
  initStepProgresses();
  validateInput();
});

onUnmounted(() => {
  disconnectWebSocket();
});
</script>

<template>
  <div class="debug-panel" :class="{ expanded: isExpanded }">
    <div class="panel-header">
      <div class="header-title">
        <CodeOutlined />
        <span>调试面板</span>
        <Tag v-if="connectionStatus === 'connected'" color="success" size="small">已连接</Tag>
        <Tag v-else-if="connectionStatus === 'connecting'" color="processing" size="small">连接中</Tag>
      </div>
      <div class="header-actions">
        <Tooltip :title="isExpanded ? '收起' : '展开'">
          <Button size="small" type="text" @click="isExpanded = !isExpanded">
            <template #icon>
              <CompressOutlined v-if="isExpanded" />
              <ExpandOutlined v-else />
            </template>
          </Button>
        </Tooltip>
      </div>
    </div>

    <div v-show="isExpanded" class="panel-content">
      <!-- 输入区域 -->
      <Card size="small" title="测试输入" class="input-card">
        <template #extra>
          <Space>
            <Button
              type="primary"
              size="small"
              :loading="isExecuting"
              :disabled="!!inputError"
              @click="startExecution"
            >
              <template #icon><PlayCircleOutlined /></template>
              运行
            </Button>
            <Button
              v-if="isExecuting"
              danger
              size="small"
              @click="stopExecution"
            >
              <template #icon><StopOutlined /></template>
              停止
            </Button>
          </Space>
        </template>

        <Input.TextArea
          v-model:value="inputJson"
          :rows="6"
          :status="inputError ? 'error' : undefined"
          placeholder="输入 JSON 格式的测试数据"
          class="input-textarea"
        />
        <div v-if="inputError" class="input-error">{{ inputError }}</div>
      </Card>

      <!-- 执行进度 -->
      <Card v-if="executionStatus !== 'idle'" size="small" title="执行进度" class="progress-card">
        <Progress
          :percent="progressPercent"
          :status="executionStatus === 'failed' ? 'exception' : executionStatus === 'completed' ? 'success' : 'active'"
          size="small"
        />

        <Timeline class="step-timeline">
          <Timeline.Item
            v-for="step in steps"
            :key="step.stepKey"
            :color="getStatusColor(stepProgresses.get(step.stepKey)?.status || 'pending')"
          >
            <div class="step-item">
              <div class="step-header">
                <component :is="getStatusIcon(stepProgresses.get(step.stepKey)?.status || 'pending')" />
                <span class="step-name">{{ step.name }}</span>
                <Tag :color="getStatusColor(stepProgresses.get(step.stepKey)?.status || 'pending')" size="small">
                  {{ stepProgresses.get(step.stepKey)?.status || 'pending' }}
                </Tag>
              </div>

              <div v-if="stepProgresses.get(step.stepKey)?.metrics" class="step-metrics">
                <span v-if="stepProgresses.get(step.stepKey)?.metrics?.latencyMs">
                  <FieldTimeOutlined />
                  {{ stepProgresses.get(step.stepKey)?.metrics?.latencyMs }}ms
                </span>
                <span v-if="stepProgresses.get(step.stepKey)?.metrics?.tokensUsed">
                  Tokens: {{ stepProgresses.get(step.stepKey)?.metrics?.tokensUsed }}
                </span>
              </div>

              <Collapse v-if="stepProgresses.get(step.stepKey)?.output || stepProgresses.get(step.stepKey)?.error" ghost size="small">
                <Collapse.Panel key="output" header="查看详情">
                  <pre v-if="stepProgresses.get(step.stepKey)?.output" class="output-json">{{ JSON.stringify(stepProgresses.get(step.stepKey)?.output, null, 2) }}</pre>
                  <Alert v-if="stepProgresses.get(step.stepKey)?.error" type="error" :message="stepProgresses.get(step.stepKey)?.error" />
                </Collapse.Panel>
              </Collapse>
            </div>
          </Timeline.Item>
        </Timeline>
      </Card>

      <!-- 流式输出 -->
      <Card v-if="streamingOutput" size="small" title="流式输出" class="stream-card">
        <pre class="stream-output">{{ streamingOutput }}</pre>
      </Card>

      <!-- 执行结果 -->
      <Card v-if="executionResult" size="small" title="执行结果" class="result-card">
        <pre class="result-json">{{ JSON.stringify(executionResult, null, 2) }}</pre>
      </Card>

      <!-- 日志 -->
      <Card size="small" class="log-card">
        <template #title>
          <Space>
            <span>执行日志</span>
            <Tag>{{ logs.length }}</Tag>
          </Space>
        </template>
        <template #extra>
          <Button size="small" type="text" @click="clearLogs">
            <template #icon><ClearOutlined /></template>
            清除
          </Button>
        </template>
        <div class="log-list">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-item"
            :class="log.level"
          >
            <span class="log-time">{{ log.time }}</span>
            <Tag :color="log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'default'" size="small">
              {{ log.level }}
            </Tag>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="log-empty">暂无日志</div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  transition: width 0.3s;

  &:not(.expanded) {
    width: 48px;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
  padding: 12px;
  overflow-y: auto;
}

.input-card,
.progress-card,
.stream-card,
.result-card,
.log-card {
  flex-shrink: 0;
}

.input-textarea {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.input-error {
  margin-top: 8px;
  font-size: 12px;
  color: #ff4d4f;
}

.step-timeline {
  margin-top: 16px;
}

.step-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.step-name {
  flex: 1;
  font-weight: 500;
}

.step-metrics {
  display: flex;
  gap: 12px;
  margin-left: 24px;
  font-size: 12px;
  color: rgba(0 0 0 / 45%);
}

.output-json,
.result-json,
.stream-output {
  max-height: 200px;
  padding: 8px;
  margin: 0;
  overflow: auto;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.5;
  background: #f5f5f5;
  border-radius: 4px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &.error {
    color: #ff4d4f;
  }

  &.warn {
    color: #faad14;
  }
}

.log-time {
  flex-shrink: 0;
  color: rgba(0 0 0 / 45%);
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-empty {
  padding: 20px;
  color: rgba(0 0 0 / 25%);
  text-align: center;
}
</style>
