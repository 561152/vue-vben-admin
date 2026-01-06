<script lang="ts" setup>
import { computed } from 'vue';
import { Card, Tag, Collapse, CollapsePanel, Steps, Step } from 'ant-design-vue';
import {
  UserOutlined,
  RobotOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons-vue';
import MathRenderer from './MathRenderer.vue';
import type { MathStep } from '#/api/ai';

interface ChatMessage {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  hints?: string[];
  mathSteps?: MathStep[];
  followUpQuestions?: string[];
  strategy?: string;
  isStructured?: boolean;
}

const props = defineProps<{
  message: ChatMessage;
}>();

const emit = defineEmits<{
  (e: 'follow-up', question: string): void;
}>();

// 是否是 AI 消息
const isAI = computed(() => props.message.role === 'tutor');

// 格式化时间
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

// 处理思考过程（移除 <think> 标签内容用于简洁显示）
const displayContent = computed(() => {
  let content = props.message.content;
  // 移除 <think>...</think> 标签内容
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
  return content.trim();
});

// 提取思考过程
const thinkingContent = computed(() => {
  const match = props.message.content.match(/<think>([\s\S]*?)<\/think>/);
  return match?.[1]?.trim() ?? null;
});

// 策略标签颜色
const strategyColor = computed(() => {
  const colors: Record<string, string> = {
    scaffolding: 'blue',
    socratic: 'green',
    direct: 'orange',
    exploratory: 'purple',
  };
  return colors[props.message.strategy || ''] || 'default';
});

// 策略标签文本
const strategyText = computed(() => {
  const texts: Record<string, string> = {
    scaffolding: '脚手架式',
    socratic: '苏格拉底式',
    direct: '直接讲解',
    exploratory: '探究式',
  };
  return texts[props.message.strategy || ''] || props.message.strategy;
});
</script>

<template>
  <div class="message-bubble" :class="{ 'is-ai': isAI }">
    <!-- 头像 -->
    <div class="avatar" :class="{ 'ai-avatar': isAI }">
      <RobotOutlined v-if="isAI" />
      <UserOutlined v-else />
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息头部 -->
      <div class="message-header">
        <span class="sender">{{ isAI ? 'AI 教师' : '我' }}</span>
        <span class="time">{{ formattedTime }}</span>
        <Tag v-if="isAI && message.strategy" :color="strategyColor" size="small">
          {{ strategyText }}
        </Tag>
      </div>

      <!-- 消息正文 -->
      <Card class="message-body" :bordered="false" size="small">
        <div class="content-text">
          <MathRenderer :content="displayContent" />
        </div>

        <!-- 思考过程（可折叠） -->
        <Collapse v-if="thinkingContent" ghost class="thinking-collapse">
          <CollapsePanel key="thinking" header="查看 AI 思考过程">
            <div class="thinking-content">
              {{ thinkingContent }}
            </div>
          </CollapsePanel>
        </Collapse>

        <!-- 解题步骤 -->
        <div v-if="message.mathSteps && message.mathSteps.length > 0" class="math-steps">
          <div class="section-title">
            <CalculatorOutlined />
            <span>解题步骤</span>
          </div>
          <Steps direction="vertical" size="small" :current="-1">
            <Step
              v-for="step in message.mathSteps"
              :key="step.step"
              :title="step.description"
            >
              <template #description>
                <div class="step-content">
                  <MathRenderer v-if="step.latex" :content="`$${step.latex}$`" />
                  <span v-else>{{ step.expression }}</span>
                  <p v-if="step.explanation" class="step-explanation">
                    {{ step.explanation }}
                  </p>
                </div>
              </template>
            </Step>
          </Steps>
        </div>

        <!-- 提示 -->
        <div v-if="message.hints && message.hints.length > 0" class="hints-section">
          <div class="section-title">
            <BulbOutlined />
            <span>思考提示</span>
          </div>
          <div class="hints-list">
            <div v-for="(hint, index) in message.hints" :key="index" class="hint-item">
              <Tag color="gold">提示 {{ index + 1 }}</Tag>
              <span>{{ hint }}</span>
            </div>
          </div>
        </div>

        <!-- 追问建议 -->
        <div v-if="message.followUpQuestions && message.followUpQuestions.length > 0" class="follow-up-section">
          <div class="section-title">
            <QuestionCircleOutlined />
            <span>可以继续问</span>
          </div>
          <div class="follow-up-list">
            <Tag
              v-for="(question, index) in message.followUpQuestions"
              :key="index"
              class="follow-up-tag"
              @click="emit('follow-up', question)"
            >
              {{ question }}
            </Tag>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 0 20px;
}

.message-bubble.is-ai {
  flex-direction: row;
}

.message-bubble:not(.is-ai) {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: #e6f7ff;
  color: #1890ff;
}

.avatar.ai-avatar {
  background: #f6ffed;
  color: #52c41a;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-bubble:not(.is-ai) .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.sender {
  font-weight: 500;
  color: #333;
}

.time {
  color: #999;
}

.message-body {
  background: #fff;
  border-radius: 12px;
}

.message-bubble:not(.is-ai) .message-body {
  background: #1890ff;
  color: #fff;
}

.message-bubble:not(.is-ai) .message-body :deep(.ant-card-body) {
  color: #fff;
}

.content-text {
  line-height: 1.8;
  white-space: pre-wrap;
}

.thinking-collapse {
  margin-top: 12px;
}

.thinking-collapse :deep(.ant-collapse-header) {
  padding: 4px 0 !important;
  font-size: 12px;
  color: #999;
}

.thinking-content {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0 8px;
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.math-steps {
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.step-content {
  padding: 4px 0;
}

.step-explanation {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.hints-section {
  margin-top: 12px;
  padding: 12px;
  background: #fffbe6;
  border-radius: 8px;
}

.hints-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.follow-up-section {
  margin-top: 12px;
}

.follow-up-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.follow-up-tag {
  cursor: pointer;
  padding: 4px 12px;
}

.follow-up-tag:hover {
  color: #1890ff;
  border-color: #1890ff;
}
</style>
