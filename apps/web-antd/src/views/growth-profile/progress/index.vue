<script lang="ts" setup>
/**
 * 学习进度页面
 * Phase 1: 从 AI 教师模块迁移到成长档案
 *
 * 功能：
 * - 总体掌握度统计
 * - 知识点掌握情况
 * - 最近学习记录
 */
import { ref, onMounted } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Empty,
  Spin,
} from 'ant-design-vue';
import {
  TrophyOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons-vue';
import MigrationNotice from '#/components/MigrationNotice.vue';
// import { getStudentProgress } from '#/api/ai';
// import type { StudentProgress } from '#/api/ai';

// 状态
const isLoading = ref(false);
const progress = ref<any | null>(null);
const studentId = ref('1'); // TODO: 从用户状态获取

// 会话表格列
const sessionColumns = [
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt' },
  { title: '消息数', dataIndex: 'messageCount', key: 'messageCount' },
];

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 科目名称映射
const subjectNames: Record<string, string> = {
  MATH: '数学',
  CHINESE: '语文',
  ENGLISH: '英语',
  PHYSICS: '物理',
  CHEMISTRY: '化学',
};

// 加载数据
const loadProgress = async () => {
  isLoading.value = true;
  try {
    // TODO: 调用实际 API
    // progress.value = await getStudentProgress(studentId.value);

    // 模拟数据
    progress.value = {
      overallMastery: 0.75,
      recentSessions: [
        {
          subject: 'MATH',
          startedAt: '2026-02-03 10:00:00',
          messageCount: 15,
        },
        {
          subject: 'CHINESE',
          startedAt: '2026-02-02 14:30:00',
          messageCount: 8,
        },
      ],
      pendingMistakes: 12,
      knowledgePoints: [
        { topic: '分数运算', mastery: 0.85 },
        { topic: '几何图形', mastery: 0.70 },
        { topic: '应用题', mastery: 0.60 },
        { topic: '方程求解', mastery: 0.80 },
      ],
    };
  } catch (error) {
    console.error('加载进度失败:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadProgress);
</script>

<template>
  <div class="learning-progress">
    <!-- 迁移提示 -->
    <MigrationNotice />

    <Spin :spinning="isLoading">
      <!-- 统计卡片 -->
      <Row :gutter="16" class="stats-row">
        <Col :xs="12" :sm="6">
          <Card :bordered="false">
            <Statistic
              title="总体掌握度"
              :value="(progress?.overallMastery || 0) * 100"
              suffix="%"
              :precision="0"
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <TrophyOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :xs="12" :sm="6">
          <Card :bordered="false">
            <Statistic
              title="学习会话"
              :value="progress?.recentSessions?.length || 0"
              suffix="次"
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
              title="待复习错题"
              :value="progress?.pendingMistakes || 0"
              suffix="题"
              :value-style="
                progress?.pendingMistakes ? { color: '#cf1322' } : {}
              "
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
              title="知识点"
              :value="progress?.knowledgePoints?.length || 0"
              suffix="个"
            >
              <template #prefix>
                <FireOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- 知识点掌握度 -->
      <Card title="知识点掌握情况" :bordered="false" class="section-card">
        <Empty
          v-if="!progress?.knowledgePoints?.length"
          description="暂无知识点数据"
        />
        <Row v-else :gutter="[16, 16]">
          <Col
            v-for="kp in progress.knowledgePoints"
            :key="kp.topic"
            :xs="24"
            :sm="12"
            :md="8"
          >
            <div class="knowledge-item">
              <div class="kp-header">
                <span class="kp-name">{{ kp.topic }}</span>
                <span class="kp-value"
                  >{{ Math.round(kp.mastery * 100) }}%</span
                >
              </div>
              <Progress
                :percent="Math.round(kp.mastery * 100)"
                :show-info="false"
                :stroke-color="
                  kp.mastery >= 0.8
                    ? '#52c41a'
                    : kp.mastery >= 0.5
                      ? '#faad14'
                      : '#ff4d4f'
                "
              />
            </div>
          </Col>
        </Row>
      </Card>

      <!-- 最近学习记录 -->
      <Card title="最近学习记录" :bordered="false" class="section-card">
        <Table
          :columns="sessionColumns"
          :data-source="
            progress?.recentSessions?.map((s: any, i: number) => ({ ...s, key: i })) || []
          "
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'subject'">
              <Tag color="blue">{{
                subjectNames[record.subject] || record.subject
              }}</Tag>
            </template>
            <template v-else-if="column.key === 'startedAt'">
              {{ formatDate(record.startedAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </Spin>
  </div>
</template>

<style scoped>
.learning-progress {
  padding: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.section-card {
  margin-bottom: 16px;
}

.knowledge-item {
  padding: 8px 0;
}

.kp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.kp-name {
  font-weight: 500;
}

.kp-value {
  color: #666;
}
</style>
