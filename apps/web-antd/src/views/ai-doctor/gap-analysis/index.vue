<script lang="ts" setup>
/**
 * 差距分析页面
 * Phase 2: 杀手级功能 - Gap Analysis
 *
 * 功能：
 * - 学生 vs 年级平均对比
 * - 学生 vs 班级平均对比
 * - 学生 vs 目标学校对比
 * - 学生 vs 班级第一名对比
 * - AI 生成差距诊断建议
 * - 根据差距生成学习处方
 */
import { ref, computed, onMounted } from 'vue';
import {
  Card,
  Select,
  SelectOption,
  Spin,
  Row,
  Col,
  Table,
  Alert,
  Steps,
  Step,
  Button,
  Empty,
  Tag,
  Statistic,
  message,
} from 'ant-design-vue';
import {
  BarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '#/store';
import MigrationNotice from '#/components/MigrationNotice.vue';
import axios from 'axios';

// 状态
const userStore = useUserStore();
const loading = ref(false);
const compareType = ref<'GRADE_AVERAGE' | 'CLASS_AVERAGE' | 'TARGET_SCHOOL' | 'TOP_STUDENT'>('GRADE_AVERAGE');
const targetId = ref<string | undefined>(undefined);
const analysis = ref<any | null>(null);

// 当前学生 ID（从用户状态获取）
const currentStudentId = computed(() => {
  // TODO: 从用户状态获取学生 ID
  // 这里暂时使用演示数据
  return '1';
});

// 差距表格列定义
const gapColumns = [
  {
    title: '能力维度',
    dataIndex: 'ability',
    key: 'ability',
    width: 150,
  },
  {
    title: '学生得分',
    dataIndex: 'studentScore',
    key: 'studentScore',
    width: 120,
    align: 'center' as const,
  },
  {
    title: '对比基准',
    dataIndex: 'benchmarkScore',
    key: 'benchmarkScore',
    width: 120,
    align: 'center' as const,
  },
  {
    title: '差距',
    dataIndex: 'gap',
    key: 'gap',
    width: 150,
    align: 'center' as const,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
  },
];

// 获取对比类型标题
const getBenchmarkTitle = (type: string) => {
  const titles: Record<string, string> = {
    GRADE_AVERAGE: '年级平均水平',
    CLASS_AVERAGE: '班级平均水平',
    TARGET_SCHOOL: '目标学校要求',
    TOP_STUDENT: '班级第一名',
  };
  return titles[type] || '对比基准';
};

// 转换差距数据为表格数据
const getGapTableData = (gaps: any) => {
  if (!gaps) return [];

  return Object.entries(gaps).map(([key, value]: [string, any]) => ({
    key,
    ability: key,
    studentScore: analysis.value?.student?.abilities?.[key]?.toFixed(1) || 'N/A',
    benchmarkScore: analysis.value?.benchmark?.abilities?.[key]?.toFixed(1) || 'N/A',
    gap: value.percentage,
    status: value.status,
  }));
};

// 获取差距颜色
const getGapColor = (status: string) => {
  return status === 'ahead' ? 'success' : 'error';
};

// 获取差距图标
const getGapIcon = (status: string) => {
  return status === 'ahead' ? RiseOutlined : FallOutlined;
};

// 加载分析数据
const loadAnalysis = async () => {
  loading.value = true;
  try {
    const response = await axios.get(
      `/api/ai-doctor/gap-analysis/${currentStudentId.value}`,
      {
        params: {
          compareType: compareType.value,
          targetId: targetId.value,
        },
      },
    );

    analysis.value = response.data;
    message.success('差距分析生成成功！');
  } catch (error: any) {
    console.error('生成差距分析失败:', error);
    message.error(error.message || '生成差距分析失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 生成学习处方
const generatePrescription = () => {
  // TODO: 集成处方生成功能
  message.info('处方生成功能开发中...');
};

// 页面加载时自动生成分析
onMounted(() => {
  loadAnalysis();
});
</script>

<template>
  <div class="gap-analysis-page">
    <!-- 迁移提示 -->
    <MigrationNotice />

    <Card title="差距分析" :bordered="false">
      <template #extra>
        <Select
          v-model:value="compareType"
          style="width: 200px"
          @change="loadAnalysis"
        >
          <SelectOption value="GRADE_AVERAGE">
            <BarChartOutlined /> 年级平均
          </SelectOption>
          <SelectOption value="CLASS_AVERAGE">
            <BarChartOutlined /> 班级平均
          </SelectOption>
          <SelectOption value="TARGET_SCHOOL">
            <TrophyOutlined /> 目标学校
          </SelectOption>
          <SelectOption value="TOP_STUDENT">
            <TrophyOutlined /> 班级第一名
          </SelectOption>
        </Select>
      </template>

      <Spin :spinning="loading">
        <div v-if="analysis" class="analysis-content">
          <!-- 概览统计 -->
          <Row :gutter="16" class="stats-overview">
            <Col :span="6">
              <Card :bordered="false" class="stat-card">
                <Statistic
                  title="学生姓名"
                  :value="analysis.student.studentName"
                >
                  <template #prefix>
                    <span style="font-size: 14px">👤</span>
                  </template>
                </Statistic>
              </Card>
            </Col>
            <Col :span="6">
              <Card :bordered="false" class="stat-card">
                <Statistic
                  title="总题目数"
                  :value="analysis.student.totalQuestions"
                  suffix="道"
                />
              </Card>
            </Col>
            <Col :span="6">
              <Card :bordered="false" class="stat-card">
                <Statistic
                  title="正确题目"
                  :value="analysis.student.correctQuestions"
                  suffix="道"
                  :value-style="{ color: '#3f8600' }"
                />
              </Card>
            </Col>
            <Col :span="6">
              <Card :bordered="false" class="stat-card">
                <Statistic
                  title="正确率"
                  :value="analysis.student.accuracyRate"
                  suffix="%"
                  :precision="1"
                  :value-style="{
                    color: analysis.student.accuracyRate >= 80 ? '#3f8600' : '#cf1322',
                  }"
                />
              </Card>
            </Col>
          </Row>

          <!-- 对比基准说明 -->
          <Alert
            :message="`正在与「${analysis.benchmark.label}」进行对比分析`"
            type="info"
            show-icon
            banner
            class="comparison-alert"
          />

          <!-- 能力雷达图对比 -->
          <Row :gutter="16" class="radar-comparison">
            <Col :span="12">
              <Card title="学生能力画像" size="small" class="radar-card">
                <div class="radar-placeholder">
                  <Empty description="雷达图功能开发中...">
                    <template #image>
                      <BarChartOutlined style="font-size: 48px; color: #1890ff" />
                    </template>
                    <div class="ability-list">
                      <div
                        v-for="(value, key) in analysis.student.abilities"
                        :key="key"
                        class="ability-item"
                      >
                        <span class="ability-name">{{ key }}</span>
                        <span class="ability-value">{{ value.toFixed(1) }} 分</span>
                      </div>
                    </div>
                    <p style="color: #999; margin-top: 16px">
                      将显示五维能力雷达图
                    </p>
                  </Empty>
                </div>
              </Card>
            </Col>
            <Col :span="12">
              <Card :title="getBenchmarkTitle(compareType)" size="small" class="radar-card">
                <div class="radar-placeholder">
                  <Empty description="雷达图功能开发中...">
                    <template #image>
                      <BarChartOutlined style="font-size: 48px; color: #52c41a" />
                    </template>
                    <div class="ability-list">
                      <div
                        v-for="(value, key) in analysis.benchmark.abilities"
                        :key="key"
                        class="ability-item"
                      >
                        <span class="ability-name">{{ key }}</span>
                        <span class="ability-value">{{ value.toFixed(1) }} 分</span>
                      </div>
                    </div>
                    <p style="color: #999; margin-top: 16px">
                      将显示五维能力雷达图
                    </p>
                  </Empty>
                </div>
              </Card>
            </Col>
          </Row>

          <!-- 能力差距详情表格 -->
          <Card title="能力差距详情" class="section-card">
            <Table
              :columns="gapColumns"
              :data-source="getGapTableData(analysis.gaps)"
              :pagination="false"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'gap'">
                  <Tag :color="getGapColor(record.status)">
                    <component :is="getGapIcon(record.status)" />
                    {{ record.gap }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <Tag :color="record.status === 'ahead' ? 'success' : 'error'">
                    {{ record.status === 'ahead' ? '领先' : '落后' }}
                  </Tag>
                </template>
              </template>
            </Table>
          </Card>

          <!-- AI 诊断建议 -->
          <Card title="🤖 AI 诊断建议" class="section-card">
            <blockquote class="diagnosis-text">
              {{ analysis.diagnosis }}
            </blockquote>
          </Card>

          <!-- 改进优先级 -->
          <Card
            v-if="analysis.priority && analysis.priority.length > 0"
            title="📋 改进优先级"
            class="section-card"
          >
            <Steps direction="vertical">
              <Step
                v-for="(item, index) in analysis.priority"
                :key="index"
                :status="index === 0 ? 'process' : 'wait'"
              >
                <template #title>
                  <span class="priority-title">
                    {{ index + 1 }}. {{ item.ability }}
                  </span>
                  <Tag
                    :color="item.urgency === 'high' ? 'error' : item.urgency === 'medium' ? 'warning' : 'default'"
                    class="ml-2"
                  >
                    {{ item.urgency === 'high' ? '紧急' : item.urgency === 'medium' ? '中等' : '一般' }}
                  </Tag>
                </template>
                <template #description>
                  差距：{{ item.gap }} 分，预计需要 {{ item.weeks }} 周提升
                </template>
              </Step>
            </Steps>

            <!-- 预估提升时间 -->
            <Alert
              v-if="analysis.estimatedWeeks > 0"
              :message="`预计通过系统性练习，约 ${analysis.estimatedWeeks} 周可缩小主要差距`"
              type="success"
              show-icon
              class="mt-4"
            />
          </Card>

          <!-- 操作按钮 -->
          <div class="actions">
            <Button type="primary" size="large" @click="generatePrescription">
              <TrophyOutlined />
              根据差距生成专属处方
            </Button>
            <Button size="large" class="ml-4" @click="loadAnalysis">
              <BarChartOutlined />
              重新分析
            </Button>
          </div>
        </div>

        <!-- 空状态 -->
        <Empty v-else description="正在加载差距分析数据...">
          <template #image>
            <BarChartOutlined style="font-size: 64px; color: #1890ff" />
          </template>
        </Empty>
      </Spin>
    </Card>
  </div>
</template>

<style scoped>
.gap-analysis-page {
  padding: 16px;
}

.stats-overview {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  background: #fafafa;
}

.comparison-alert {
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 500;
}

.radar-comparison {
  margin-bottom: 24px;
}

.radar-card {
  height: 100%;
}

.radar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.ability-list {
  margin-top: 16px;
  width: 100%;
  max-width: 300px;
}

.ability-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.ability-name {
  font-weight: 500;
  color: #333;
}

.ability-value {
  color: #1890ff;
  font-weight: bold;
}

.section-card {
  margin-bottom: 24px;
}

.diagnosis-text {
  padding: 20px;
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  background: #f9f9f9;
  border-left: 4px solid #1890ff;
  border-radius: 4px;
  white-space: pre-wrap;
}

.priority-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.ml-2 {
  margin-left: 8px;
}

.ml-4 {
  margin-left: 16px;
}

.actions {
  padding: 24px 0;
  text-align: center;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .stats-overview {
    flex-direction: column;
  }

  .radar-comparison {
    flex-direction: column;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .actions .ml-4 {
    margin-left: 0;
  }
}
</style>
