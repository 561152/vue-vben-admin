<template>
  <Modal
    v-model:open="visible"
    title="审批结果详情"
    width="900px"
    :footer="null"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <div v-if="approvalResult" class="approval-result-content">
        <!-- 审批信息卡片 -->
        <Card title="审批信息" class="mb-4">
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="审批状态">
              <Tag :color="getStatusColor(approvalResult.status)">
                {{ getStatusText(approvalResult.status) }}
              </Tag>
            </DescriptionsItem>

            <DescriptionsItem label="审批人">
              {{ getApproverName(approvalResult.approver) }}
            </DescriptionsItem>

            <DescriptionsItem label="审批时间">
              {{ formatDateTime(approvalResult.approvedAt) }}
            </DescriptionsItem>

            <DescriptionsItem label="审批耗时">
              {{ formatDuration(approvalResult.approvalDurationMs) }}
            </DescriptionsItem>

            <DescriptionsItem label="是否修改" :span="2">
              <Tag :color="approvalResult.isModified ? 'orange' : 'green'">
                {{ approvalResult.isModified ? '已修改 AI 结果' : '未修改，采纳 AI 结果' }}
              </Tag>
            </DescriptionsItem>

            <DescriptionsItem v-if="approvalResult.approvalComment" label="审批意见" :span="2">
              {{ approvalResult.approvalComment }}
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <!-- 修改对比表格（仅当有修改时显示） -->
        <Card v-if="approvalResult.isModified && modifications.length > 0" title="修改对比" class="mb-4">
          <Table
            :columns="modificationColumns"
            :data-source="modifications"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'field'">
                <Tag>{{ getFieldLabel(record.field) }}</Tag>
              </template>
              <template v-else-if="column.key === 'before'">
                <span class="text-red-500 line-through">{{ record.before }}</span>
              </template>
              <template v-else-if="column.key === 'after'">
                <span class="text-green-600 font-semibold">{{ record.after }}</span>
              </template>
            </template>
          </Table>
        </Card>

        <!-- 结果对比 Tabs -->
        <Card title="批改结果对比">
          <Tabs v-model:activeKey="activeTab">
            <TabPane key="original" tab="AI 原始结果">
              <div v-if="approvalResult.originalData?.gradingResults" class="grading-results">
                <Alert message="以下是 AI 的原始批改结果" type="info" show-icon class="mb-3" />
                <div
                  v-for="(result, index) in approvalResult.originalData.gradingResults"
                  :key="index"
                  class="result-item"
                >
                  <div class="result-header">
                    <span class="question-number">题目 {{ result.questionNumber || index + 1 }}</span>
                    <Tag :color="result.isCorrect ? 'green' : 'red'">
                      {{ result.isCorrect ? '正确' : '错误' }}
                    </Tag>
                    <span class="score">得分: {{ result.score }}</span>
                  </div>
                  <div class="result-body">
                    <p><strong>批改意见:</strong> {{ result.feedback || '无' }}</p>
                  </div>
                </div>
              </div>
              <Empty v-else description="无原始结果数据" />
            </TabPane>

            <TabPane key="approved" tab="审批后结果" :disabled="!approvalResult.approvedData">
              <div v-if="approvalResult.approvedData?.gradingResults" class="grading-results">
                <Alert
                  message="以下是审批后的最终结果（可能包含教师修改）"
                  type="success"
                  show-icon
                  class="mb-3"
                />
                <div
                  v-for="(result, index) in approvalResult.approvedData.gradingResults"
                  :key="index"
                  class="result-item"
                >
                  <div class="result-header">
                    <span class="question-number">题目 {{ result.questionNumber || index + 1 }}</span>
                    <Tag :color="result.isCorrect ? 'green' : 'red'">
                      {{ result.isCorrect ? '正确' : '错误' }}
                    </Tag>
                    <span class="score">得分: {{ result.score }}</span>
                  </div>
                  <div class="result-body">
                    <p><strong>批改意见:</strong> {{ result.feedback || '无' }}</p>
                  </div>
                </div>
              </div>
              <Empty v-else description="无审批后结果数据" />
            </TabPane>
          </Tabs>
        </Card>
      </div>

      <Empty v-else description="暂无审批结果" />
    </Spin>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Modal,
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Table,
  Tabs,
  TabPane,
  Spin,
  Empty,
  Alert,
  message,
} from 'ant-design-vue';
import { getApprovalResult, type ApprovalResult } from '#/api/grading';

const props = defineProps<{
  recordId?: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const loading = ref(false);
const approvalResult = ref<ApprovalResult | null>(null);
const activeTab = ref('original');

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const modificationColumns = [
  { title: '题号', dataIndex: 'questionNumber', key: 'questionNumber', width: 80 },
  { title: '修改字段', dataIndex: 'field', key: 'field', width: 100 },
  { title: '原值', dataIndex: 'before', key: 'before' },
  { title: '新值', dataIndex: 'after', key: 'after' },
];

const modifications = computed(() => approvalResult.value?.modifications || []);

// 监听 recordId 变化，加载数据
watch(
  () => props.recordId,
  async (newId) => {
    if (newId && props.visible) {
      await loadApprovalResult(newId);
    }
  },
  { immediate: true },
);

// 监听弹窗打开，加载数据
watch(
  () => props.visible,
  async (newVisible) => {
    if (newVisible && props.recordId) {
      await loadApprovalResult(props.recordId);
    }
  },
);

async function loadApprovalResult(recordId: string) {
  loading.value = true;
  try {
    approvalResult.value = await getApprovalResult(recordId);
  } catch (error: any) {
    message.error(error.message || '加载审批结果失败');
  } finally {
    loading.value = false;
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    TIMEOUT: 'orange',
  };
  return colors[status] || 'default';
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    TIMEOUT: '已超时',
  };
  return texts[status] || status;
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    score: '分数',
    feedback: '批改意见',
    isCorrect: '正确性',
  };
  return labels[field] || field;
}

function getApproverName(approver?: { realName?: string; username?: string }) {
  if (!approver) return '-';
  return approver.realName || approver.username || '-';
}

function formatDateTime(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

function formatDuration(ms?: number) {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}
</script>

<style scoped lang="less">
.approval-result-content {
  .mb-4 {
    margin-bottom: 16px;
  }

  .grading-results {
    .result-item {
      padding: 12px;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        font-weight: 500;

        .question-number {
          font-size: 15px;
        }

        .score {
          margin-left: auto;
          color: #1890ff;
          font-weight: 600;
        }
      }

      .result-body {
        padding-left: 8px;
        color: #666;

        p {
          margin: 4px 0;
        }
      }
    }
  }

  .mb-3 {
    margin-bottom: 12px;
  }
}
</style>
