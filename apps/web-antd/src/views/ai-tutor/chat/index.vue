<script lang="ts" setup>
import { ref, computed, nextTick, h, watch } from 'vue';
import {
  Card,
  Input,
  Button,
  Select,
  Spin,
  Tag,
  Tooltip,
  Switch,
  message,
} from 'ant-design-vue';
import {
  SendOutlined,
  RobotOutlined,
  BulbOutlined,
  CalculatorOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons-vue';
import {
  startSession,
  sendMessage,
  solveStructured,
  quickAnalyzeProblem,
} from '#/api/ai';
import type {
  MathStep,
  StructuredSolutionResponse,
  ProblemAnalysis,
} from '#/api/ai';
import type { VerificationResult } from './components/VerificationPanel.vue';
import MessageBubble from './components/MessageBubble.vue';
import ProblemAnalysisCard from './components/ProblemAnalysisCard.vue';
import StructuredSolution from './components/StructuredSolution.vue';
import VerificationPanel from './components/VerificationPanel.vue';

interface ChatMessage {
  id: string;
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
  hints?: string[];
  mathSteps?: MathStep[];
  followUpQuestions?: string[];
  strategy?: string;
  // 结构化求解数据
  isStructured?: boolean;
  analysis?: ProblemAnalysis;
  solution?: StructuredSolutionResponse['solution'];
  verification?: VerificationResult;
  teaching?: StructuredSolutionResponse['teaching'];
  metadata?: StructuredSolutionResponse['metadata'];
}

// 状态
const sessionId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const selectedSubject = ref<
  'math' | 'chinese' | 'english' | 'physics' | 'chemistry'
>('math');
const studentId = ref('1'); // TODO: 从用户状态获取
const messagesContainer = ref<HTMLElement | null>(null);

// 结构化求解模式
const structuredMode = ref(false);
const quickAnalysisResult = ref<{
  category: string;
  difficulty: string;
  isWordProblem: boolean;
  gradeLevel: number;
  knowledgePoints: string[];
  hasEquation: boolean;
} | null>(null);

// 问题类型名称映射
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

// 快速分析问题（输入防抖）
let analysisTimer: ReturnType<typeof setTimeout> | null = null;
watch(inputMessage, (val) => {
  if (!structuredMode.value || !val.trim()) {
    quickAnalysisResult.value = null;
    return;
  }

  if (analysisTimer) clearTimeout(analysisTimer);
  analysisTimer = setTimeout(async () => {
    try {
      const result = await quickAnalyzeProblem({ question: val });
      quickAnalysisResult.value = result;
    } catch {
      // 忽略分析错误
    }
  }, 500);
});

// 学科选项
const subjectOptions = [
  { value: 'math', label: '数学', icon: CalculatorOutlined },
  { value: 'chinese', label: '语文', disabled: true },
  { value: 'english', label: '英语', disabled: true },
  { value: 'physics', label: '物理', disabled: true },
  { value: 'chemistry', label: '化学', disabled: true },
];

// 是否有活动会话
const hasActiveSession = computed(() => !!sessionId.value);

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 生成消息 ID
const generateId = () =>
  `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 开始新会话
const handleStartSession = async () => {
  if (!inputMessage.value.trim()) {
    message.warning('请输入你的问题');
    return;
  }

  isLoading.value = true;
  try {
    const response = await startSession({
      studentId: studentId.value,
      subject: selectedSubject.value,
      initialQuestion: inputMessage.value,
    });

    sessionId.value = response.sessionId || null;

    // 添加用户消息
    messages.value.push({
      id: generateId(),
      role: 'student',
      content: inputMessage.value,
      timestamp: new Date(),
    });

    // 添加 AI 回复
    messages.value.push({
      id: generateId(),
      role: 'tutor',
      content: response.response,
      timestamp: new Date(),
      hints: response.hints,
      mathSteps: response.mathSteps,
      followUpQuestions: response.followUpQuestions,
      strategy: response.strategy,
    });

    inputMessage.value = '';
    await scrollToBottom();
  } catch (error: any) {
    message.error(error.message || '开始会话失败');
  } finally {
    isLoading.value = false;
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  // 结构化求解模式
  if (structuredMode.value) {
    await handleStructuredSolve();
    return;
  }

  if (!sessionId.value) {
    await handleStartSession();
    return;
  }

  const userMessage = inputMessage.value;
  inputMessage.value = '';
  quickAnalysisResult.value = null;

  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'student',
    content: userMessage,
    timestamp: new Date(),
  });

  await scrollToBottom();
  isLoading.value = true;

  try {
    const response = await sendMessage({
      sessionId: sessionId.value,
      message: userMessage,
    });

    // 添加 AI 回复
    messages.value.push({
      id: generateId(),
      role: 'tutor',
      content: response.response,
      timestamp: new Date(),
      hints: response.hints,
      mathSteps: response.mathSteps,
      followUpQuestions: response.followUpQuestions,
      strategy: response.strategy,
    });

    await scrollToBottom();
  } catch (error: any) {
    message.error(error.message || '发送消息失败');
  } finally {
    isLoading.value = false;
  }
};

// 结构化求解
const handleStructuredSolve = async () => {
  const userQuestion = inputMessage.value;
  inputMessage.value = '';
  quickAnalysisResult.value = null;

  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'student',
    content: userQuestion,
    timestamp: new Date(),
  });

  await scrollToBottom();
  isLoading.value = true;

  try {
    const response = await solveStructured({
      question: userQuestion,
      studentId: studentId.value,
      options: {
        includeVerification: true,
        includeTeaching: true,
        verificationLevel: 'comprehensive',
      },
    });

    // 添加结构化 AI 回复
    messages.value.push({
      id: generateId(),
      role: 'tutor',
      content: response.teaching.explanation,
      timestamp: new Date(),
      isStructured: true,
      analysis: response.analysis,
      solution: response.solution,
      verification: response.verification,
      teaching: response.teaching,
      metadata: response.metadata,
      hints: response.teaching.hints,
      followUpQuestions: response.teaching.followUpQuestions,
      strategy: 'structured',
    });

    await scrollToBottom();
  } catch (error: any) {
    message.error(error.message || '结构化求解失败');
  } finally {
    isLoading.value = false;
  }
};

// 新建会话
const handleNewSession = () => {
  sessionId.value = null;
  messages.value = [];
  inputMessage.value = '';
};

// 使用追问问题
const handleFollowUp = (question: string) => {
  inputMessage.value = question;
};

// 按回车发送
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};
</script>

<template>
  <div class="ai-tutor-chat">
    <!-- 头部工具栏 -->
    <Card class="toolbar-card" :bordered="false">
      <div class="toolbar">
        <div class="toolbar-left">
          <RobotOutlined class="logo-icon" />
          <span class="title">AI 智能教师</span>
          <Tag v-if="hasActiveSession" color="green">会话中</Tag>
          <Tag v-else color="default">未开始</Tag>
        </div>
        <div class="toolbar-right">
          <Tooltip
            title="结构化求解模式：自动分析问题、建立数学模型、三重验证答案"
          >
            <div class="mode-switch">
              <ExperimentOutlined
                :style="{ color: structuredMode ? '#1890ff' : '#999' }"
              />
              <Switch v-model:checked="structuredMode" size="small" />
              <span :class="{ active: structuredMode }">结构化求解</span>
            </div>
          </Tooltip>
          <Select
            v-model:value="selectedSubject"
            :options="subjectOptions"
            style="width: 120px"
            :disabled="hasActiveSession && !structuredMode"
          />
          <Tooltip title="新建会话">
            <Button
              type="text"
              :icon="h(ReloadOutlined)"
              @click="handleNewSession"
            />
          </Tooltip>
        </div>
      </div>
    </Card>

    <!-- 消息区域 -->
    <div ref="messagesContainer" class="messages-container">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <RobotOutlined class="welcome-icon" />
        <h2>你好，我是 AI 智能教师</h2>
        <p v-if="structuredMode">
          <Tag color="blue">结构化求解模式</Tag>
          我会分析问题、建立数学模型、求解并验证答案
        </p>
        <p v-else>有什么数学问题需要我帮忙吗？</p>
        <div class="quick-questions">
          <p class="quick-title">试试这些问题：</p>
          <div class="quick-list">
            <template v-if="structuredMode">
              <Tag
                class="quick-tag"
                @click="
                  inputMessage =
                    '小明有5个苹果，小红给了他3个，现在小明有几个苹果？'
                "
              >
                小学应用题
              </Tag>
              <Tag
                class="quick-tag"
                @click="inputMessage = '解方程 x² - 5x + 6 = 0'"
              >
                一元二次方程
              </Tag>
              <Tag
                class="quick-tag"
                @click="
                  inputMessage =
                    '甲乙两人共有100元，甲比乙多20元，甲乙各有多少元？'
                "
              >
                方程组应用题
              </Tag>
            </template>
            <template v-else>
              <Tag
                class="quick-tag"
                @click="inputMessage = '解方程 x² - 5x + 6 = 0'"
              >
                解方程 x² - 5x + 6 = 0
              </Tag>
              <Tag
                class="quick-tag"
                @click="inputMessage = '求导 f(x) = x³ + 2x²'"
              >
                求导 f(x) = x³ + 2x²
              </Tag>
              <Tag class="quick-tag" @click="inputMessage = '因式分解 x² - 9'">
                因式分解 x² - 9
              </Tag>
            </template>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <template v-for="msg in messages" :key="msg.id">
        <!-- 结构化消息 -->
        <div
          v-if="msg.isStructured && msg.role === 'tutor'"
          class="structured-message"
        >
          <!-- 用户头像和消息内容 -->
          <div class="message-bubble is-ai">
            <div class="avatar ai-avatar">
              <SafetyCertificateOutlined />
            </div>
            <div class="structured-content">
              <!-- 问题分析 -->
              <ProblemAnalysisCard
                v-if="msg.analysis"
                :analysis="msg.analysis"
                :show-original="true"
              />

              <!-- 解题过程 -->
              <StructuredSolution
                v-if="msg.solution"
                :solution="msg.solution"
                :show-method="true"
              />

              <!-- 验证结果 -->
              <VerificationPanel
                v-if="msg.verification"
                :verification="msg.verification"
              />

              <!-- 教学回复 -->
              <MessageBubble
                :message="{
                  ...msg,
                  isStructured: false,
                }"
                @follow-up="handleFollowUp"
              />
            </div>
          </div>
        </div>

        <!-- 普通消息 -->
        <MessageBubble v-else :message="msg" @follow-up="handleFollowUp" />
      </template>

      <!-- 加载中 -->
      <div v-if="isLoading" class="loading-indicator">
        <Spin size="small" />
        <span>AI 正在思考...</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <Card class="input-card" :bordered="false">
      <!-- 快速分析预览 -->
      <div
        v-if="structuredMode && quickAnalysisResult"
        class="quick-analysis-preview"
      >
        <Tag color="processing">
          {{
            categoryNames[quickAnalysisResult.category] ||
            quickAnalysisResult.category
          }}
        </Tag>
        <Tag
          :color="
            quickAnalysisResult.difficulty === 'easy'
              ? 'green'
              : quickAnalysisResult.difficulty === 'medium'
                ? 'orange'
                : 'red'
          "
        >
          {{
            quickAnalysisResult.difficulty === 'easy'
              ? '简单'
              : quickAnalysisResult.difficulty === 'medium'
                ? '中等'
                : '困难'
          }}
        </Tag>
        <Tag v-if="quickAnalysisResult.isWordProblem" color="cyan">应用题</Tag>
        <Tag v-if="quickAnalysisResult.hasEquation" color="purple">含方程</Tag>
        <span class="preview-label">预检测</span>
      </div>

      <div class="input-area">
        <Input.TextArea
          v-model:value="inputMessage"
          :placeholder="
            structuredMode
              ? '输入应用题或计算题，AI将分析、求解并验证...'
              : hasActiveSession
                ? '继续提问...'
                : '输入你的数学问题，开始学习之旅'
          "
          :auto-size="{ minRows: 1, maxRows: 4 }"
          :disabled="isLoading"
          @keypress="handleKeyPress"
        />
        <Button
          type="primary"
          :icon="h(structuredMode ? ExperimentOutlined : SendOutlined)"
          :loading="isLoading"
          :disabled="!inputMessage.trim()"
          @click="handleSendMessage"
        >
          {{ structuredMode ? '求解' : '发送' }}
        </Button>
      </div>
      <div class="input-tips">
        <BulbOutlined />
        <span v-if="structuredMode">
          结构化模式：输入后自动分析问题、建立数学模型、符号计算求解、三重验证答案
        </span>
        <span v-else>
          提示：可以输入数学表达式，如 x^2 表示 x²，sqrt(x) 表示 √x
        </span>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.ai-tutor-chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: #f5f7fa;
}

.toolbar-card {
  flex-shrink: 0;
  margin-bottom: 0;
  border-radius: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo-icon {
  font-size: 24px;
  color: #1890ff;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.welcome-message {
  padding: 60px 20px;
  color: #666;
  text-align: center;
}

.welcome-icon {
  margin-bottom: 20px;
  font-size: 64px;
  color: #1890ff;
}

.welcome-message h2 {
  margin-bottom: 8px;
  color: #333;
}

.quick-questions {
  margin-top: 30px;
}

.quick-title {
  margin-bottom: 12px;
  color: #999;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quick-tag {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.quick-tag:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.loading-indicator {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  color: #666;
}

.input-card {
  flex-shrink: 0;
  border-top: 1px solid #e8e8e8;
  border-radius: 0;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area :deep(.ant-input) {
  flex: 1;
}

.input-tips {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border-radius: 4px;
}

.mode-switch span {
  transition: color 0.2s;
}

.mode-switch span.active {
  font-weight: 500;
  color: #1890ff;
}

/* 快速分析预览 */
.quick-analysis-preview {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  border-radius: 6px;
}

.preview-label {
  margin-left: auto;
  font-size: 11px;
  color: #999;
}

/* 结构化消息 */
.structured-message {
  margin-bottom: 20px;
}

.structured-message .message-bubble {
  display: flex;
  gap: 12px;
  padding: 0 20px;
}

.structured-message .avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 50%;
}

.structured-message .ai-avatar {
  color: #52c41a;
  background: #f6ffed;
}

.structured-content {
  flex: 1;
  max-width: calc(100% - 60px);
}

.structured-content :deep(.message-bubble) {
  padding: 0;
  margin-bottom: 0;
}

.structured-content :deep(.message-content) {
  max-width: 100%;
}

/* 结构化模式加载指示器 */
.loading-indicator.structured {
  padding: 20px;
  text-align: center;
}
</style>
