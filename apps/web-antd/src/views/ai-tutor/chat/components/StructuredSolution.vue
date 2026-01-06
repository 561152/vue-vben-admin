<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Timeline, TimelineItem, Tag, Result, Button, Collapse, CollapsePanel } from 'ant-design-vue';
import {
  CheckCircleOutlined,
  CalculatorOutlined,
  RightOutlined,
  CopyOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import MathRenderer from './MathRenderer.vue';

export interface SolutionStep {
  stepNumber: number;
  description: string;
  expression: string;
  latex?: string;
  explanation?: string;
  verified?: boolean;
}

export interface FinalAnswer {
  value: string;
  unit?: string;
  latex?: string;
}

export interface SolutionData {
  method: string;
  steps: SolutionStep[];
  finalAnswer: FinalAnswer;
  alternativeAnswers?: string[];
}

const props = defineProps<{
  solution: SolutionData;
  showMethod?: boolean;
}>();

// 展开的步骤
const expandedSteps = ref<number[]>([]);

// 切换步骤展开状态
const toggleStep = (stepNumber: number) => {
  const index = expandedSteps.value.indexOf(stepNumber);
  if (index > -1) {
    expandedSteps.value.splice(index, 1);
  } else {
    expandedSteps.value.push(stepNumber);
  }
};

// 是否展开
const isExpanded = (stepNumber: number) => expandedSteps.value.includes(stepNumber);

// 复制答案
const copyAnswer = async () => {
  try {
    await navigator.clipboard.writeText(props.solution.finalAnswer.value);
    message.success('答案已复制到剪贴板');
  } catch {
    message.error('复制失败');
  }
};

// 步骤颜色
const getStepColor = (step: SolutionStep, index: number, total: number) => {
  if (step.verified) return 'green';
  if (index === total - 1) return 'blue';
  return 'gray';
};
</script>

<template>
  <Card class="structured-solution-card" size="small">
    <template #title>
      <div class="card-title">
        <CalculatorOutlined />
        <span>解题过程</span>
        <Tag v-if="showMethod" color="blue">{{ solution.method }}</Tag>
      </div>
    </template>

    <!-- 解题步骤时间线 -->
    <div class="steps-container">
      <Timeline>
        <TimelineItem
          v-for="(step, index) in solution.steps"
          :key="step.stepNumber"
          :color="getStepColor(step, index, solution.steps.length)"
        >
          <div
            class="step-header"
            :class="{ clickable: step.explanation }"
            @click="step.explanation && toggleStep(step.stepNumber)"
          >
            <div class="step-title">
              <Tag color="blue" size="small">步骤 {{ step.stepNumber }}</Tag>
              <span class="step-desc">{{ step.description }}</span>
              <RightOutlined
                v-if="step.explanation"
                class="expand-icon"
                :class="{ expanded: isExpanded(step.stepNumber) }"
              />
            </div>
          </div>

          <div class="step-content">
            <!-- 数学表达式 -->
            <div class="step-expression">
              <MathRenderer
                v-if="step.latex"
                :content="`$${step.latex}$`"
              />
              <span v-else class="plain-expr">{{ step.expression }}</span>
            </div>

            <!-- 详细解释（可折叠） -->
            <Collapse
              v-if="step.explanation"
              v-model:activeKey="expandedSteps"
              ghost
              class="step-explanation-collapse"
            >
              <CollapsePanel :key="step.stepNumber" :show-arrow="false">
                <template #header>
                  <span></span>
                </template>
                <div class="step-explanation">
                  {{ step.explanation }}
                </div>
              </CollapsePanel>
            </Collapse>
          </div>

          <!-- 验证标记 -->
          <CheckCircleOutlined
            v-if="step.verified"
            class="verified-icon"
          />
        </TimelineItem>
      </Timeline>
    </div>

    <!-- 最终答案 -->
    <div class="final-answer-section">
      <Result status="success" class="answer-result">
        <template #title>
          <span class="answer-title">最终答案</span>
        </template>
        <template #subTitle>
          <div class="answer-value">
            <MathRenderer
              v-if="solution.finalAnswer.latex"
              :content="`$$${solution.finalAnswer.latex}$$`"
              display-mode
            />
            <span v-else class="plain-answer">{{ solution.finalAnswer.value }}</span>
            <span v-if="solution.finalAnswer.unit" class="answer-unit">
              {{ solution.finalAnswer.unit }}
            </span>
          </div>
        </template>
        <template #extra>
          <Button size="small" @click="copyAnswer">
            <template #icon><CopyOutlined /></template>
            复制答案
          </Button>
        </template>
      </Result>

      <!-- 多个答案 -->
      <div v-if="solution.alternativeAnswers && solution.alternativeAnswers.length > 1" class="alt-answers">
        <span class="alt-label">其他解：</span>
        <Tag v-for="(ans, i) in solution.alternativeAnswers" :key="i" color="default">
          {{ ans }}
        </Tag>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.structured-solution-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.steps-container {
  padding: 16px 0;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.step-header.clickable {
  cursor: pointer;
}

.step-header.clickable:hover .step-desc {
  color: #1890ff;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-desc {
  font-weight: 500;
  color: #333;
  transition: color 0.2s;
}

.expand-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.step-content {
  padding-left: 8px;
}

.step-expression {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.plain-expr {
  font-size: 14px;
  color: #333;
}

.step-explanation-collapse {
  margin: 0;
}

.step-explanation-collapse :deep(.ant-collapse-header) {
  display: none;
}

.step-explanation-collapse :deep(.ant-collapse-content) {
  border: none;
}

.step-explanation {
  font-size: 13px;
  color: #666;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
  margin-top: 4px;
}

.verified-icon {
  color: #52c41a;
  font-size: 16px;
  margin-left: 8px;
}

.final-answer-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  margin-top: 8px;
}

.answer-result {
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
}

.answer-result :deep(.ant-result-icon) {
  margin-bottom: 8px;
}

.answer-result :deep(.ant-result-icon .anticon) {
  font-size: 32px;
}

.answer-title {
  font-size: 14px;
  color: #666;
}

.answer-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plain-answer {
  font-size: 24px;
  font-weight: 600;
  color: #52c41a;
}

.answer-unit {
  font-size: 16px;
  color: #666;
}

.alt-answers {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
}

.alt-label {
  font-size: 12px;
  color: #666;
}
</style>
