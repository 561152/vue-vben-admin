<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import {
  BarChartOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TransactionOutlined,
} from '@ant-design/icons-vue';
import {
  Card,
  Col,
  message,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Typography,
} from 'ant-design-vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  type AnalyticsPeriod,
  getPromptAnalytics,
  getPromptTrends,
  type PromptAnalytics,
  type TrendDataPoint,
} from '#/api/ai-studio/prompt-analytics';

interface Props {
  templateId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const analytics = ref<PromptAnalytics | null>(null);
const trends = ref<TrendDataPoint[]>([]);
const period = ref<AnalyticsPeriod>('day');

// 趋势图
const trendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);

// Token 图
const tokenChartRef = ref<EchartsUIType>();
const { renderEcharts: renderTokenChart } = useEcharts(tokenChartRef);

const loadAnalytics = async () => {
  if (!props.templateId) return;
  loading.value = true;
  try {
    const [analyticsRes, trendsRes] = await Promise.all([
      getPromptAnalytics(props.templateId),
      getPromptTrends(props.templateId, { period: period.value, limit: 30 }),
    ]);
    analytics.value = analyticsRes;
    trends.value = trendsRes;
    renderCharts();
  } catch {
    message.error('加载分析数据失败');
  } finally {
    loading.value = false;
  }
};

const renderCharts = () => {
  if (trends.value.length === 0) return;

  const dates = trends.value.map((t) => t.date);
  const usageCounts = trends.value.map((t) => t.usageCount);
  const successRates = trends.value.map((t) => Math.round(t.successRate * 100));
  const latencies = trends.value.map((t) => t.avgLatencyMs);
  const tokens = trends.value.map((t) => t.tokenUsage.totalTokens);

  renderTrendChart({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['使用量', '成功率', '延迟'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: (val: string) => {
          const d = new Date(val);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        },
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '使用量',
        position: 'left',
      },
      {
        type: 'value',
        name: '成功率 (%)',
        position: 'right',
        max: 100,
      },
    ],
    series: [
      {
        name: '使用量',
        type: 'bar',
        data: usageCounts,
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '成功率',
        type: 'line',
        yAxisIndex: 1,
        data: successRates,
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '延迟',
        type: 'line',
        data: latencies,
        smooth: true,
        itemStyle: { color: '#faad14' },
      },
    ],
  });

  renderTokenChart({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Prompt Tokens', 'Completion Tokens'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: (val: string) => {
          const d = new Date(val);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Tokens',
    },
    series: [
      {
        name: 'Prompt Tokens',
        type: 'bar',
        stack: 'tokens',
        data: trends.value.map((t) => t.tokenUsage.promptTokens),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: 'Completion Tokens',
        type: 'bar',
        stack: 'tokens',
        data: trends.value.map((t) => t.tokenUsage.completionTokens),
        itemStyle: { color: '#13c2c2' },
      },
    ],
  });
};

watch(period, () => {
  loadAnalytics();
});

watch(
  () => props.templateId,
  (val) => {
    if (val) loadAnalytics();
  },
  { immediate: true },
);
</script>

<template>
  <div class="analytics-panel">
    <div class="mb-4 flex items-center justify-between">
      <Typography.Text type="secondary">
        <BarChartOutlined />
        查看模板的使用统计和性能趋势
      </Typography.Text>
      <Select v-model:value="period" style="width: 120px">
        <Select.Option value="day">按天</Select.Option>
        <Select.Option value="week">按周</Select.Option>
        <Select.Option value="month">按月</Select.Option>
      </Select>
    </div>

    <Spin :spinning="loading">
      <!-- 统计卡片 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="6">
          <Card size="small">
            <Statistic title="总使用次数" :value="analytics?.usageCount ?? 0">
              <template #prefix>
                <TransactionOutlined style="color: #1890ff" />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic
              title="成功率"
              :value="(analytics?.successRate ?? 0) * 100"
              :precision="1"
              suffix="%"
            >
              <template #prefix>
                <ThunderboltOutlined style="color: #52c41a" />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic
              title="平均延迟"
              :value="analytics?.avgLatencyMs ?? 0"
              suffix="ms"
            >
              <template #prefix>
                <ClockCircleOutlined style="color: #faad14" />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic
              title="总 Token 消耗"
              :value="analytics?.totalTokens?.totalTokens ?? 0"
            >
              <template #prefix>
                <BarChartOutlined style="color: #722ed1" />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- 使用趋势图 -->
      <Card size="small" title="使用趋势" class="mb-4">
        <EchartsUI ref="trendChartRef" :style="{ height: '320px', width: '100%' }" />
      </Card>

      <!-- Token 消耗图 -->
      <Card size="small" title="Token 消耗趋势">
        <EchartsUI ref="tokenChartRef" :style="{ height: '280px', width: '100%' }" />
      </Card>
    </Spin>
  </div>
</template>
