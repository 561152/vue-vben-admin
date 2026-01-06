<script lang="ts" setup>
import { ref, onMounted, computed, h } from 'vue';
import {
  Card,
  Table,
  Tag,
  Button,
  Empty,
  Spin,
  Modal,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  message,
} from 'ant-design-vue';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue';
import { getMistakes } from '#/api/ai';
import type { MistakeRecord } from '#/api/ai';
import MathRenderer from '../chat/components/MathRenderer.vue';

// 状态
const isLoading = ref(true);
const mistakes = ref<MistakeRecord[]>([]);
const studentId = ref('1'); // TODO: 从用户状态获取
const selectedSubject = ref<string | undefined>(undefined);
const selectedStatus = ref<string | undefined>(undefined);
const detailVisible = ref(false);
const currentMistake = ref<MistakeRecord | null>(null);

// 科目选项
const subjectOptions = [
  { value: undefined, label: '全部科目' },
  { value: 'MATH', label: '数学' },
  { value: 'CHINESE', label: '语文' },
  { value: 'ENGLISH', label: '英语' },
  { value: 'PHYSICS', label: '物理' },
  { value: 'CHEMISTRY', label: '化学' },
];

// 状态选项
const statusOptions = [
  { value: undefined, label: '全部状态' },
  { value: 'pending', label: '待复习' },
  { value: 'reviewing', label: '复习中' },
  { value: 'mastered', label: '已掌握' },
];

// 科目名称映射
const subjectNames: Record<string, string> = {
  MATH: '数学',
  CHINESE: '语文',
  ENGLISH: '英语',
  PHYSICS: '物理',
  CHEMISTRY: '化学',
};

// 状态配置
const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'red', text: '待复习' },
  reviewing: { color: 'orange', text: '复习中' },
  mastered: { color: 'green', text: '已掌握' },
};

// 表格列
const columns = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    width: 100,
  },
  {
    title: '题目',
    dataIndex: 'question',
    key: 'question',
    ellipsis: true,
  },
  {
    title: '知识点',
    dataIndex: 'knowledgePoint',
    key: 'knowledgePoint',
    width: 150,
  },
  {
    title: '错误次数',
    dataIndex: 'errorCount',
    key: 'errorCount',
    width: 100,
    sorter: (a: MistakeRecord, b: MistakeRecord) => a.errorCount - b.errorCount,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '添加时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    sorter: (a: MistakeRecord, b: MistakeRecord) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
  },
];

// 过滤后的错题
const filteredMistakes = computed(() => {
  let result = mistakes.value;
  if (selectedSubject.value) {
    result = result.filter((m) => m.subject === selectedSubject.value);
  }
  if (selectedStatus.value) {
    result = result.filter((m) => m.status === selectedStatus.value);
  }
  return result;
});

// 统计数据
const stats = computed(() => {
  const total = mistakes.value.length;
  const pending = mistakes.value.filter((m) => m.status === 'pending').length;
  const reviewing = mistakes.value.filter((m) => m.status === 'reviewing').length;
  const mastered = mistakes.value.filter((m) => m.status === 'mastered').length;
  const masteredRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return { total, pending, reviewing, mastered, masteredRate };
});

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 加载数据
const loadMistakes = async () => {
  isLoading.value = true;
  try {
    mistakes.value = await getMistakes(studentId.value);
  } catch (error) {
    console.error('加载错题失败:', error);
    message.error('加载错题失败');
  } finally {
    isLoading.value = false;
  }
};

// 查看详情
const showDetail = (record: MistakeRecord) => {
  currentMistake.value = record;
  detailVisible.value = true;
};

// 开始复习
const startReview = (record: MistakeRecord) => {
  // TODO: 实现复习功能，跳转到AI教师进行专项复习
  message.info(`开始复习：${record.question.slice(0, 20)}...`);
};

onMounted(loadMistakes);
</script>

<template>
  <div class="mistake-book">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stats-row">
      <Col :xs="12" :sm="6">
        <Card :bordered="false">
          <Statistic
            title="错题总数"
            :value="stats.total"
            suffix="题"
          >
            <template #prefix>
              <BookOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false">
          <Statistic
            title="待复习"
            :value="stats.pending"
            suffix="题"
            :value-style="stats.pending > 0 ? { color: '#cf1322' } : {}"
          >
            <template #prefix>
              <ExclamationCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false">
          <Statistic
            title="复习中"
            :value="stats.reviewing"
            suffix="题"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false">
          <Statistic
            title="已掌握"
            :value="stats.mastered"
            suffix="题"
            :value-style="{ color: '#3f8600' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- 掌握度进度 -->
    <Card :bordered="false" class="progress-card">
      <div class="progress-header">
        <span>总体掌握率</span>
        <span class="progress-value">{{ stats.masteredRate }}%</span>
      </div>
      <Progress
        :percent="stats.masteredRate"
        :show-info="false"
        :stroke-color="{
          '0%': '#108ee9',
          '100%': '#87d068',
        }"
      />
    </Card>

    <!-- 错题列表 -->
    <Card title="错题列表" :bordered="false" class="list-card">
      <template #extra>
        <div class="filter-bar">
          <Select
            v-model:value="selectedSubject"
            :options="subjectOptions"
            placeholder="选择科目"
            style="width: 120px"
          />
          <Select
            v-model:value="selectedStatus"
            :options="statusOptions"
            placeholder="选择状态"
            style="width: 120px"
          />
          <Button :icon="h(RedoOutlined)" @click="loadMistakes">刷新</Button>
        </div>
      </template>

      <Spin :spinning="isLoading">
        <Empty v-if="!isLoading && filteredMistakes.length === 0" description="暂无错题记录" />
        <Table
          v-else
          :columns="columns"
          :data-source="filteredMistakes.map((m, i) => ({ ...m, key: i }))"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 题` }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'subject'">
              <Tag color="blue">{{ subjectNames[record.subject] || record.subject }}</Tag>
            </template>
            <template v-else-if="column.key === 'question'">
              <MathRenderer :content="record.question" />
            </template>
            <template v-else-if="column.key === 'errorCount'">
              <Tag :color="record.errorCount >= 3 ? 'red' : record.errorCount >= 2 ? 'orange' : 'default'">
                {{ record.errorCount }} 次
              </Tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="statusConfig[record.status]?.color || 'default'">
                {{ statusConfig[record.status]?.text || record.status }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button type="link" size="small" :icon="h(EyeOutlined)" @click="showDetail(record as MistakeRecord)">
                详情
              </Button>
              <Button
                v-if="record.status !== 'mastered'"
                type="link"
                size="small"
                :icon="h(RedoOutlined)"
                @click="startReview(record as MistakeRecord)"
              >
                复习
              </Button>
            </template>
          </template>
        </Table>
      </Spin>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="错题详情"
      width="700px"
      :footer="null"
    >
      <template v-if="currentMistake">
        <div class="detail-section">
          <div class="detail-label">科目</div>
          <div class="detail-value">
            <Tag color="blue">{{ subjectNames[currentMistake.subject] || currentMistake.subject }}</Tag>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">知识点</div>
          <div class="detail-value">{{ currentMistake.knowledgePoint }}</div>
        </div>

        <div class="detail-section">
          <div class="detail-label">题目</div>
          <div class="detail-value question-text">
            <MathRenderer :content="currentMistake.question" />
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">我的答案</div>
          <div class="detail-value wrong-answer">
            <MathRenderer :content="currentMistake.wrongAnswer" />
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">正确答案</div>
          <div class="detail-value correct-answer">
            <MathRenderer :content="currentMistake.correctAnswer" />
          </div>
        </div>

        <div v-if="currentMistake.explanation" class="detail-section">
          <div class="detail-label">解析</div>
          <div class="detail-value explanation">
            <MathRenderer :content="currentMistake.explanation" />
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">状态信息</div>
          <div class="detail-value">
            <Tag :color="statusConfig[currentMistake.status]?.color || 'default'">
              {{ statusConfig[currentMistake.status]?.text || currentMistake.status }}
            </Tag>
            <span class="meta-info">
              错误 {{ currentMistake.errorCount }} 次 ·
              添加于 {{ formatDate(currentMistake.createdAt) }}
            </span>
          </div>
        </div>

        <div class="detail-actions">
          <Button
            v-if="currentMistake.status !== 'mastered'"
            type="primary"
            :icon="h(RedoOutlined)"
            @click="startReview(currentMistake); detailVisible = false"
          >
            开始复习
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.mistake-book {
  padding: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.progress-card {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-value {
  font-weight: 600;
  color: #1890ff;
}

.list-card {
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.detail-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-of-type {
  border-bottom: none;
}

.detail-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 14px;
  line-height: 1.6;
}

.question-text {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.wrong-answer {
  padding: 12px;
  background: #fff1f0;
  border-radius: 4px;
  border-left: 3px solid #ff4d4f;
}

.correct-answer {
  padding: 12px;
  background: #f6ffed;
  border-radius: 4px;
  border-left: 3px solid #52c41a;
}

.explanation {
  padding: 12px;
  background: #e6f7ff;
  border-radius: 4px;
}

.meta-info {
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}

.detail-actions {
  margin-top: 24px;
  text-align: center;
}
</style>
