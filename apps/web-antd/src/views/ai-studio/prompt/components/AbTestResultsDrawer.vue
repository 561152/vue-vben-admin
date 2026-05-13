<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  MinusOutlined,
} from '@ant-design/icons-vue';
import {
  Card,
  Col,
  Descriptions,
  Drawer,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'ant-design-vue';

import {
  type AbTestResults,
  AbTestStatus,
  getAbTestResults,
} from '#/api/ai-studio/prompt-ab-testing';

interface Props {
  visible: boolean;
  templateId: string;
  testId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const loading = ref(false);
const results = ref<AbTestResults | null>(null);

const statusColors: Record<string, string> = {
  [AbTestStatus.DRAFT]: 'default',
  [AbTestStatus.ACTIVE]: 'processing',
  [AbTestStatus.PAUSED]: 'warning',
  [AbTestStatus.COMPLETED]: 'success',
};

const statusLabels: Record<string, string> = {
  [AbTestStatus.DRAFT]: '草稿',
  [AbTestStatus.ACTIVE]: '运行中',
  [AbTestStatus.PAUSED]: '已暂停',
  [AbTestStatus.COMPLETED]: '已完成',
};

const loadResults = async () => {
  if (!props.testId || !props.templateId) return;
  loading.value = true;
  try {
    results.value = await getAbTestResults(props.templateId, props.testId);
  } catch {
    message.error('加载测试结果失败');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (val) => {
    if (val && props.testId) {
      loadResults();
    }
  },
);
</script>

<template>
  <Drawer
    v-model:open="drawerVisible"
    title="A/B 测试结果分析"
    :width="780"
    placement="right"
  >
    <Spin :spinning="loading">
      <template v-if="results">
        <!-- 测试信息卡 -->
        <Card size="small" class="mb-4">
          <Descriptions :column="2" size="small">
            <Descriptions.Item label="测试名称">
              {{ results.name }}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag :color="statusColors[results.status]">
                {{ statusLabels[results.status] }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {{
                results.startedAt
                  ? new Date(results.startedAt).toLocaleString('zh-CN')
                  : '-'
              }}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {{
                results.endedAt
                  ? new Date(results.endedAt).toLocaleString('zh-CN')
                  : '-'
              }}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <!-- 对比卡片 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Card
              size="small"
              :title="`对照组 (v${results.controlMetrics.version})`"
              :head-style="{
                background: '#f0f5ff',
                borderBottom: '2px solid #1890ff',
              }"
            >
              <Space direction="vertical" class="w-full" :size="12">
                <Statistic
                  title="执行次数"
                  :value="results.controlMetrics.executionCount"
                />
                <Statistic
                  title="成功率"
                  :value="results.controlMetrics.successRate * 100"
                  :precision="1"
                  suffix="%"
                />
                <Statistic
                  title="平均延迟"
                  :value="results.controlMetrics.avgLatencyMs"
                  suffix="ms"
                />
                <Statistic
                  title="P95 延迟"
                  :value="results.controlMetrics.p95LatencyMs"
                  suffix="ms"
                />
                <Statistic
                  title="平均 Token"
                  :value="results.controlMetrics.avgTokens"
                />
              </Space>
            </Card>
          </Col>
          <Col :span="12">
            <Card
              size="small"
              :title="`实验组 (v${results.treatmentMetrics.version})`"
              :head-style="{
                background: '#f6ffed',
                borderBottom: '2px solid #52c41a',
              }"
            >
              <Space direction="vertical" class="w-full" :size="12">
                <Statistic
                  title="执行次数"
                  :value="results.treatmentMetrics.executionCount"
                />
                <Statistic
                  title="成功率"
                  :value="results.treatmentMetrics.successRate * 100"
                  :precision="1"
                  suffix="%"
                />
                <Statistic
                  title="平均延迟"
                  :value="results.treatmentMetrics.avgLatencyMs"
                  suffix="ms"
                />
                <Statistic
                  title="P95 延迟"
                  :value="results.treatmentMetrics.p95LatencyMs"
                  suffix="ms"
                />
                <Statistic
                  title="平均 Token"
                  :value="results.treatmentMetrics.avgTokens"
                />
              </Space>
            </Card>
          </Col>
        </Row>

        <!-- 差异摘要 -->
        <Card size="small" title="差异分析" class="mb-4">
          <Row :gutter="16">
            <Col :span="8">
              <Statistic title="延迟差异">
                <template #formatter>
                  <Space>
                    <ArrowDownOutlined
                      v-if="results.latencyDiffPercent < 0"
                      style="color: #52c41a"
                    />
                    <ArrowUpOutlined
                      v-else-if="results.latencyDiffPercent > 0"
                      style="color: #ff4d4f"
                    />
                    <MinusOutlined v-else style="color: #999" />
                    <span
                      :style="{
                        color:
                          results.latencyDiffPercent < 0
                            ? '#52c41a'
                            : results.latencyDiffPercent > 0
                              ? '#ff4d4f'
                              : '#999',
                      }"
                    >
                      {{ Math.abs(results.latencyDiffPercent).toFixed(1) }}%
                    </span>
                  </Space>
                </template>
              </Statistic>
            </Col>
            <Col :span="8">
              <Statistic title="成功率差异">
                <template #formatter>
                  <Space>
                    <ArrowUpOutlined
                      v-if="results.successRateDiff > 0"
                      style="color: #52c41a"
                    />
                    <ArrowDownOutlined
                      v-else-if="results.successRateDiff < 0"
                      style="color: #ff4d4f"
                    />
                    <MinusOutlined v-else style="color: #999" />
                    <span
                      :style="{
                        color:
                          results.successRateDiff > 0
                            ? '#52c41a'
                            : results.successRateDiff < 0
                              ? '#ff4d4f'
                              : '#999',
                      }"
                    >
                      {{
                        (Math.abs(results.successRateDiff) * 100).toFixed(2)
                      }}%
                    </span>
                  </Space>
                </template>
              </Statistic>
            </Col>
            <Col :span="8">
              <Statistic title="Token 差异">
                <template #formatter>
                  <Space>
                    <ArrowDownOutlined
                      v-if="results.tokenDiffPercent < 0"
                      style="color: #52c41a"
                    />
                    <ArrowUpOutlined
                      v-else-if="results.tokenDiffPercent > 0"
                      style="color: #ff4d4f"
                    />
                    <MinusOutlined v-else style="color: #999" />
                    <span
                      :style="{
                        color:
                          results.tokenDiffPercent < 0
                            ? '#52c41a'
                            : results.tokenDiffPercent > 0
                              ? '#ff4d4f'
                              : '#999',
                      }"
                    >
                      {{ Math.abs(results.tokenDiffPercent).toFixed(1) }}%
                    </span>
                  </Space>
                </template>
              </Statistic>
            </Col>
          </Row>
        </Card>

        <!-- 推荐结论 -->
        <Card size="small" title="结论">
          <Space direction="vertical">
            <Space>
              <Tag :color="results.isSignificant ? 'green' : 'orange'">
                {{ results.isSignificant ? '有统计显著性' : '无显著差异' }}
              </Tag>
              <Tag v-if="results.recommendedVersion" color="blue">
                <CheckCircleOutlined />
                推荐：{{
                  results.recommendedVersion === 'treatment'
                    ? '实验组'
                    : '对照组'
                }}
              </Tag>
            </Space>
            <Typography.Paragraph
              v-if="results.recommendation"
              type="secondary"
            >
              {{ results.recommendation }}
            </Typography.Paragraph>
          </Space>
        </Card>
      </template>

      <template v-else-if="!loading">
        <Typography.Paragraph type="secondary" class="text-center">
          暂无结果数据
        </Typography.Paragraph>
      </template>
    </Spin>
  </Drawer>
</template>
