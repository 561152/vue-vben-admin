<template>
  <div class="grading-question-list">
    <Spin :spinning="loading">
      <Empty v-if="!loading && questions.length === 0" description="暂无题目数据" />

      <Table
        v-else
        :columns="questionColumns"
        :data-source="questions"
        :pagination="false"
        :row-key="(record: GradingQuestion) => record.questionNumber"
        bordered
        size="small"
      >
        <!-- 题号列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'questionNumber'">
            <Tag color="blue">{{ record.questionNumber }}</Tag>
          </template>

          <!-- 正确性列 -->
          <template v-else-if="column.key === 'isCorrect'">
            <Tag :color="record.isCorrect ? 'success' : 'error'">
              {{ record.isCorrect ? '✓ 正确' : '✗ 错误' }}
            </Tag>
          </template>

          <!-- 得分列 -->
          <template v-else-if="column.key === 'score'">
            <span :class="{ 'text-red-500': record.score < record.maxScore }">
              {{ record.score }}/{{ record.maxScore }}
            </span>
          </template>

          <!-- 题目内容列 -->
          <template v-else-if="column.key === 'questionContent'">
            <div class="question-content">
              {{ record.questionContent || '（无内容）' }}
            </div>
          </template>

          <!-- 学生答案列 -->
          <template v-else-if="column.key === 'studentAnswer'">
            <div class="student-answer">
              {{ record.studentAnswer || '（未作答）' }}
            </div>
          </template>

          <!-- 错误分析列 -->
          <template v-else-if="column.key === 'errorAnalysis'">
            <div class="error-analysis">
              <div v-if="record.errorType" class="mb-2">
                <Tag color="orange">{{ getErrorTypeLabel(record.errorType) }}</Tag>
              </div>
              <div class="text-gray-700">
                {{ record.errorAnalysis || '（无分析）' }}
              </div>
              <div v-if="record.suggestions && record.suggestions.length > 0" class="mt-2">
                <div class="text-xs text-gray-500 mb-1">改进建议：</div>
                <ul class="pl-4 text-sm">
                  <li v-for="(suggestion, index) in record.suggestions" :key="index">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </template>
      </Table>

      <!-- 统计信息 -->
      <Card v-if="questions.length > 0" class="mt-4" size="small">
        <Descriptions title="批改统计" :column="4" size="small" bordered>
          <DescriptionsItem label="总题数">
            {{ summary.totalQuestions }}
          </DescriptionsItem>
          <DescriptionsItem label="正确数">
            <span class="text-green-600">{{ summary.correctCount }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="错误数">
            <span class="text-red-600">{{ summary.totalQuestions - summary.correctCount }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="准确率">
            <span :class="summary.accuracy >= 80 ? 'text-green-600' : 'text-orange-600'">
              {{ summary.accuracy.toFixed(1) }}%
            </span>
          </DescriptionsItem>
          <DescriptionsItem label="总得分">
            {{ summary.totalScore }}/{{ summary.maxScore }}
          </DescriptionsItem>
        </Descriptions>
      </Card>
    </Spin>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Spin, Empty, Table, Tag, Card, Descriptions, DescriptionsItem } from 'ant-design-vue';

interface GradingQuestion {
  questionNumber: string;
  questionContent: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  errorType?: string;
  errorAnalysis?: string;
  suggestions?: string[];
}

interface GradingSummary {
  totalQuestions: number;
  correctCount: number;
  totalScore: number;
  maxScore: number;
  accuracy: number;
}

const props = defineProps<{
  questions: GradingQuestion[];
  summary: GradingSummary;
  loading?: boolean;
}>();

const questionColumns = [
  {
    title: '题号',
    dataIndex: 'questionNumber',
    key: 'questionNumber',
    width: 70,
    align: 'center' as const,
  },
  {
    title: '题目内容',
    dataIndex: 'questionContent',
    key: 'questionContent',
    width: 180,
    ellipsis: true,
  },
  {
    title: '学生答案',
    dataIndex: 'studentAnswer',
    key: 'studentAnswer',
    width: 120,
    ellipsis: true,
  },
  {
    title: '正确性',
    dataIndex: 'isCorrect',
    key: 'isCorrect',
    width: 80,
    align: 'center' as const,
  },
  {
    title: '得分',
    dataIndex: 'score',
    key: 'score',
    width: 80,
    align: 'center' as const,
  },
  {
    title: '错误分析与建议',
    dataIndex: 'errorAnalysis',
    key: 'errorAnalysis',
    width: 250,
  },
];

function getErrorTypeLabel(errorType: string): string {
  const labels: Record<string, string> = {
    calculation: '计算错误',
    concept: '概念理解错误',
    method: '方法错误',
    incomplete: '答案不完整',
    unrelated: '答非所问',
    other: '其他错误',
  };
  return labels[errorType] || errorType;
}
</script>

<style scoped>
.grading-question-list {
  padding: 8px 0;
}

.question-content,
.student-answer,
.error-analysis {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-red-500 {
  color: #ef4444;
  font-weight: 600;
}

.text-red-600 {
  color: #dc2626;
}

.text-green-600 {
  color: #16a34a;
}

.text-orange-600 {
  color: #ea580c;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-700 {
  color: #374151;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.pl-4 {
  padding-left: 16px;
}

.text-xs {
  font-size: 12px;
}

.text-sm {
  font-size: 13px;
}
</style>
