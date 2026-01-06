<script lang="ts" setup>
import { computed } from 'vue';
import {
  Card,
  Tag,
  Descriptions,
  DescriptionsItem,
  List,
  ListItem,
  Tooltip,
} from 'ant-design-vue';
import {
  BookOutlined,
  AimOutlined,
  FunctionOutlined,
  StarOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue';
import MathRenderer from './MathRenderer.vue';

export interface KnownVariable {
  name: string;
  value: string | number;
  unit?: string;
  description: string;
}

export interface UnknownVariable {
  name: string;
  symbol: string;
  unit?: string;
  description: string;
}

export interface MathematicalModel {
  equations: string[];
  latex: string[];
  explanation: string;
  variables: string[];
}

export interface ProblemAnalysis {
  originalText: string;
  category: string;
  gradeLevel: number;
  knownVariables: KnownVariable[];
  unknownVariables: UnknownVariable[];
  constraints: string[];
  mathematicalModel: MathematicalModel;
  difficulty: 'easy' | 'medium' | 'hard';
  knowledgePoints: string[];
  isWordProblem: boolean;
  confidence: number;
}

const props = defineProps<{
  analysis: ProblemAnalysis;
  showOriginal?: boolean;
}>();

// 难度颜色
const difficultyColor = computed(() => {
  const colors: Record<string, string> = {
    easy: 'green',
    medium: 'orange',
    hard: 'red',
  };
  return colors[props.analysis.difficulty] || 'default';
});

// 难度文本
const difficultyText = computed(() => {
  const texts: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return texts[props.analysis.difficulty] || props.analysis.difficulty;
});

// 类型文本映射
const categoryNames: Record<string, string> = {
  arithmetic: '四则运算',
  word_problem: '应用题',
  fraction: '分数运算',
  ratio: '比例问题',
  linear_equation: '一元一次方程',
  quadratic_equation: '一元二次方程',
  system_of_equations: '方程组',
  inequality: '不等式',
  geometry_basic: '平面几何',
  function: '函数',
  trigonometry: '三角函数',
  sequence: '数列',
  probability: '概率统计',
  calculus: '微积分',
  analytic_geometry: '解析几何',
  expression: '表达式计算',
  simplify: '化简',
  factorization: '因式分解',
  proof: '证明题',
};

const categoryName = computed(() => {
  return categoryNames[props.analysis.category] || props.analysis.category;
});

// 年级文本
const gradeText = computed(() => {
  const grade = props.analysis.gradeLevel;
  if (grade <= 6) return `小学${grade}年级`;
  if (grade <= 9) return `初${grade - 6}年级`;
  return `高${grade - 9}年级`;
});
</script>

<template>
  <Card class="problem-analysis-card" size="small">
    <template #title>
      <div class="card-title">
        <BookOutlined />
        <span>问题分析</span>
      </div>
    </template>

    <template #extra>
      <div class="header-tags">
        <Tag color="blue">{{ categoryName }}</Tag>
        <Tag :color="difficultyColor">{{ difficultyText }}</Tag>
        <Tooltip :title="`适合${gradeText}学生`">
          <Tag color="purple">{{ gradeText }}</Tag>
        </Tooltip>
        <Tag v-if="analysis.isWordProblem" color="cyan">应用题</Tag>
      </div>
    </template>

    <!-- 原始问题 -->
    <div v-if="showOriginal" class="original-section">
      <div class="section-label">原题</div>
      <div class="original-text">{{ analysis.originalText }}</div>
    </div>

    <!-- 已知条件 -->
    <div v-if="analysis.knownVariables.length > 0" class="section">
      <div class="section-title">
        <AimOutlined />
        <span>已知条件</span>
      </div>
      <Descriptions size="small" :column="2" bordered>
        <DescriptionsItem
          v-for="(v, i) in analysis.knownVariables"
          :key="i"
          :label="v.name"
        >
          <span class="value">{{ v.value }}</span>
          <span v-if="v.unit" class="unit">{{ v.unit }}</span>
          <span v-if="v.description" class="desc"> ({{ v.description }})</span>
        </DescriptionsItem>
      </Descriptions>
    </div>

    <!-- 求解目标 -->
    <div v-if="analysis.unknownVariables.length > 0" class="section">
      <div class="section-title">
        <BulbOutlined />
        <span>求解目标</span>
      </div>
      <List size="small" :data-source="analysis.unknownVariables">
        <template #renderItem="{ item }">
          <ListItem>
            <Tag color="blue">{{ item.symbol }}</Tag>
            <span>{{ item.description }}</span>
            <span v-if="item.unit" class="unit">({{ item.unit }})</span>
          </ListItem>
        </template>
      </List>
    </div>

    <!-- 数学模型 -->
    <div v-if="analysis.mathematicalModel.equations.length > 0" class="section">
      <div class="section-title">
        <FunctionOutlined />
        <span>数学模型</span>
      </div>
      <div class="model-explanation">
        {{ analysis.mathematicalModel.explanation }}
      </div>
      <div class="equations-list">
        <div
          v-for="(eq, i) in analysis.mathematicalModel.latex"
          :key="i"
          class="equation-item"
        >
          <MathRenderer :content="`$$${eq}$$`" display-mode />
        </div>
      </div>
    </div>

    <!-- 知识点 -->
    <div v-if="analysis.knowledgePoints.length > 0" class="section">
      <div class="section-title">
        <StarOutlined />
        <span>涉及知识点</span>
      </div>
      <div class="knowledge-tags">
        <Tag
          v-for="(kp, i) in analysis.knowledgePoints"
          :key="i"
          color="geekblue"
        >
          {{ kp }}
        </Tag>
      </div>
    </div>

    <!-- 置信度 -->
    <div class="confidence-bar">
      <span class="confidence-label">分析置信度</span>
      <div class="confidence-track">
        <div
          class="confidence-fill"
          :style="{ width: `${analysis.confidence * 100}%` }"
        ></div>
      </div>
      <span class="confidence-value"
        >{{ Math.round(analysis.confidence * 100) }}%</span
      >
    </div>
  </Card>
</template>

<style scoped>
.problem-analysis-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.card-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
}

.header-tags {
  display: flex;
  gap: 4px;
}

.original-section {
  padding: 12px;
  margin-bottom: 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.section-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.original-text {
  font-size: 14px;
  line-height: 1.6;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.value {
  font-weight: 600;
  color: #1890ff;
}

.unit {
  margin-left: 4px;
  font-size: 12px;
  color: #666;
}

.desc {
  margin-left: 4px;
  font-size: 12px;
  color: #999;
}

.model-explanation {
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
}

.equations-list {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.equation-item {
  padding: 8px 0;
  text-align: center;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.confidence-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.confidence-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #666;
}

.confidence-track {
  flex: 1;
  height: 6px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 3px;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #1890ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.confidence-value {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
}
</style>
