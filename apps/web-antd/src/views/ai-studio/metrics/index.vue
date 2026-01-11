<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Select,
  DatePicker,
  Space,
} from 'ant-design-vue';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface MetricsOverview {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  executionsTrend: number;
  successRateTrend: number;
  durationTrend: number;
  costTrend: number;
}

interface PipelineMetrics {
  id: number;
  name: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  cost: number;
}

interface ComponentMetrics {
  id: number;
  name: string;
  type: string;
  calls: number;
  successRate: number;
  avgLatency: number;
}

const loading = ref(false);
const dateRange = ref<any[]>([]);
const timeRange = ref('7d');

const overview = ref<MetricsOverview>({
  totalExecutions: 0,
  successRate: 0,
  avgDuration: 0,
  totalCost: 0,
  executionsTrend: 0,
  successRateTrend: 0,
  durationTrend: 0,
  costTrend: 0,
});

const pipelineMetrics = ref<PipelineMetrics[]>([]);
const componentMetrics = ref<ComponentMetrics[]>([]);

const timeRangeOptions = [
  { value: '1d', label: '最近1天' },
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: 'custom', label: '自定义' },
];

const pipelineColumns = [
  {
    title: '流程名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '执行次数',
    dataIndex: 'executions',
    key: 'executions',
    width: 100,
    sorter: (a: PipelineMetrics, b: PipelineMetrics) =>
      a.executions - b.executions,
  },
  {
    title: '成功率',
    dataIndex: 'successRate',
    key: 'successRate',
    width: 150,
  },
  {
    title: '平均耗时',
    dataIndex: 'avgDuration',
    key: 'avgDuration',
    width: 120,
    customRender: ({ text }: { text: number }) => {
      if (text < 1000) return `${text}ms`;
      return `${(text / 1000).toFixed(1)}s`;
    },
  },
  {
    title: '成本 (Token)',
    dataIndex: 'cost',
    key: 'cost',
    width: 120,
    customRender: ({ text }: { text: number }) => {
      if (text >= 1000000) return `${(text / 1000000).toFixed(1)}M`;
      if (text >= 1000) return `${(text / 1000).toFixed(1)}K`;
      return text.toString();
    },
  },
];

const componentColumns = [
  {
    title: '组件名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: '调用次数',
    dataIndex: 'calls',
    key: 'calls',
    width: 100,
    sorter: (a: ComponentMetrics, b: ComponentMetrics) => a.calls - b.calls,
  },
  {
    title: '成功率',
    dataIndex: 'successRate',
    key: 'successRate',
    width: 150,
  },
  {
    title: '平均延迟',
    dataIndex: 'avgLatency',
    key: 'avgLatency',
    width: 100,
    customRender: ({ text }: { text: number }) => `${text}ms`,
  },
];

const typeColorMap: Record<string, string> = {
  LLM: 'blue',
  PROMPT: 'green',
  TOOL: 'orange',
  TRANSFORM: 'purple',
  CONDITION: 'cyan',
  HTTP: 'magenta',
};

const fetchMetrics = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/ai-studio/metrics', {
      params: {
        timeRange: timeRange.value,
        startDate: dateRange.value[0]?.format('YYYY-MM-DD'),
        endDate: dateRange.value[1]?.format('YYYY-MM-DD'),
      },
    });

    if (response.overview) {
      overview.value = response.overview;
    }
    if (response.pipelines) {
      pipelineMetrics.value = response.pipelines;
    }
    if (response.components) {
      componentMetrics.value = response.components;
    }
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    // Mock data for demo
    overview.value = {
      totalExecutions: 1256,
      successRate: 94.5,
      avgDuration: 2340,
      totalCost: 125600,
      executionsTrend: 12.5,
      successRateTrend: 2.3,
      durationTrend: -8.5,
      costTrend: 15.2,
    };

    pipelineMetrics.value = [
      {
        id: 1,
        name: '客户智能分析流程',
        executions: 520,
        successRate: 96.2,
        avgDuration: 3520,
        cost: 52000,
      },
      {
        id: 2,
        name: '自动回复生成流程',
        executions: 380,
        successRate: 98.5,
        avgDuration: 1850,
        cost: 28500,
      },
      {
        id: 3,
        name: '营销内容生成流程',
        executions: 245,
        successRate: 92.3,
        avgDuration: 4200,
        cost: 36750,
      },
      {
        id: 4,
        name: '数据清洗流程',
        executions: 111,
        successRate: 88.0,
        avgDuration: 890,
        cost: 8350,
      },
    ];

    componentMetrics.value = [
      {
        id: 1,
        name: 'GPT-4 对话',
        type: 'LLM',
        calls: 2340,
        successRate: 99.2,
        avgLatency: 1250,
      },
      {
        id: 2,
        name: '客户分析提示词',
        type: 'PROMPT',
        calls: 1560,
        successRate: 100,
        avgLatency: 50,
      },
      {
        id: 3,
        name: 'JSON 格式化',
        type: 'TRANSFORM',
        calls: 3200,
        successRate: 100,
        avgLatency: 15,
      },
      {
        id: 4,
        name: 'CRM API 调用',
        type: 'HTTP',
        calls: 890,
        successRate: 95.5,
        avgLatency: 320,
      },
    ];
  } finally {
    loading.value = false;
  }
};

const handleTimeRangeChange = (value: string) => {
  if (value !== 'custom') {
    dateRange.value = [];
  }
  fetchMetrics();
};

// Auto refresh every 30 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchMetrics();
  refreshInterval = setInterval(fetchMetrics, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <div class="metrics-dashboard">
    <!-- Time Range Selector -->
    <Card class="filter-card">
      <Space>
        <span>时间范围：</span>
        <Select
          v-model:value="timeRange"
          :options="timeRangeOptions"
          style="width: 120px"
          @change="handleTimeRangeChange"
        />
        <DatePicker.RangePicker
          v-if="timeRange === 'custom'"
          v-model:value="dateRange"
          @change="fetchMetrics"
        />
      </Space>
    </Card>

    <!-- Overview Stats -->
    <Row :gutter="16" class="stats-row">
      <Col :span="6">
        <Card :loading="loading">
          <Statistic
            title="总执行次数"
            :value="overview.totalExecutions"
            :prefix="h(RocketOutlined)"
          >
            <template #suffix>
              <span
                :class="[
                  'trend',
                  overview.executionsTrend >= 0 ? 'trend-up' : 'trend-down',
                ]"
              >
                <ArrowUpOutlined v-if="overview.executionsTrend >= 0" />
                <ArrowDownOutlined v-else />
                {{ Math.abs(overview.executionsTrend) }}%
              </span>
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card :loading="loading">
          <Statistic
            title="成功率"
            :value="overview.successRate"
            :precision="1"
            suffix="%"
            :prefix="h(CheckCircleOutlined)"
            :value-style="{ color: overview.successRate >= 90 ? '#3f8600' : '#cf1322' }"
          >
            <template #suffix>
              <span class="suffix-text">%</span>
              <span
                :class="[
                  'trend',
                  overview.successRateTrend >= 0 ? 'trend-up' : 'trend-down',
                ]"
              >
                <ArrowUpOutlined v-if="overview.successRateTrend >= 0" />
                <ArrowDownOutlined v-else />
                {{ Math.abs(overview.successRateTrend) }}%
              </span>
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card :loading="loading">
          <Statistic
            title="平均耗时"
            :value="overview.avgDuration"
            suffix="ms"
            :prefix="h(ClockCircleOutlined)"
          >
            <template #suffix>
              <span class="suffix-text">ms</span>
              <span
                :class="[
                  'trend',
                  overview.durationTrend <= 0 ? 'trend-up' : 'trend-down',
                ]"
              >
                <ArrowDownOutlined v-if="overview.durationTrend <= 0" />
                <ArrowUpOutlined v-else />
                {{ Math.abs(overview.durationTrend) }}%
              </span>
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card :loading="loading">
          <Statistic
            title="Token 消耗"
            :value="overview.totalCost"
            :prefix="h(ThunderboltOutlined)"
          >
            <template #suffix>
              <span
                :class="[
                  'trend',
                  overview.costTrend <= 0 ? 'trend-up' : 'trend-down',
                ]"
              >
                <ArrowUpOutlined v-if="overview.costTrend > 0" />
                <ArrowDownOutlined v-else />
                {{ Math.abs(overview.costTrend) }}%
              </span>
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- Pipeline & Component Metrics -->
    <Row :gutter="16">
      <Col :span="12">
        <Card title="流程执行统计" :loading="loading">
          <Table
            :columns="pipelineColumns"
            :data-source="pipelineMetrics"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'successRate'">
                <Progress
                  :percent="record.successRate"
                  :status="record.successRate >= 90 ? 'success' : 'exception'"
                  size="small"
                  :format="(percent: number) => `${percent}%`"
                />
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="组件调用统计" :loading="loading">
          <Table
            :columns="componentColumns"
            :data-source="componentMetrics"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <Tag :color="typeColorMap[record.type] || 'default'">
                  {{ record.type }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'successRate'">
                <Progress
                  :percent="record.successRate"
                  :status="record.successRate >= 95 ? 'success' : 'exception'"
                  size="small"
                  :format="(percent: number) => `${percent}%`"
                />
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script lang="ts">
import { h } from 'vue';
export default {
  name: 'MetricsDashboard',
};
</script>

<style scoped>
.metrics-dashboard {
  padding: 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.trend {
  font-size: 12px;
  margin-left: 8px;
}

.trend-up {
  color: #3f8600;
}

.trend-down {
  color: #cf1322;
}

.suffix-text {
  font-size: 14px;
  color: rgb(0 0 0 / 45%);
}

:deep(.ant-statistic-content-suffix) {
  display: inline-flex;
  align-items: center;
}
</style>
