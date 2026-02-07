<script lang="ts" setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue';
import {
  Card,
  Input,
  Button,
  Avatar,
  Spin,
  Select,
  Space,
  Tag,
  Tooltip,
  Empty,
  message,
  Modal,
  List,
} from 'ant-design-vue';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  HistoryOutlined,
  SmileOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import { useRouter } from 'vue-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: number;
  detectedMood?: string;
  suggestedActions?: string[];
}

interface Session {
  id: number;
  sessionId: string;
  topic: string;
  counselorPersona: string;
  currentMood: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 咨询师人格配置
const personaOptions = [
  {
    value: 'default',
    label: '默认咨询师',
    description: '平衡、专业的学习顾问',
  },
  { value: 'scholar', label: '学霸导师', description: '注重学术方法和效率' },
  {
    value: 'cheerleader',
    label: '励志教练',
    description: '积极鼓励，提升信心',
  },
  {
    value: 'stress_manager',
    label: '压力管理师',
    description: '帮助缓解学习压力',
  },
  {
    value: 'goal_achiever',
    label: '目标规划师',
    description: '专注目标设定和达成',
  },
];

// 情绪选项
const moodOptions = [
  { value: 'HAPPY', label: '开心', emoji: '😊' },
  { value: 'CONFIDENT', label: '自信', emoji: '💪' },
  { value: 'NEUTRAL', label: '平静', emoji: '😐' },
  { value: 'ANXIOUS', label: '焦虑', emoji: '😰' },
  { value: 'FRUSTRATED', label: '沮丧', emoji: '😔' },
  { value: 'CONFUSED', label: '困惑', emoji: '🤔' },
];

const router = useRouter();
const messages = ref<Message[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const isStreaming = ref(false);
const streamingContent = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// 会话状态
const currentSessionId = ref<string | null>(null);
const selectedPersona = ref('default');
const selectedMood = ref('NEUTRAL');
const sessionTopic = ref('');

// 历史会话
const showHistoryModal = ref(false);
const historyLoading = ref(false);
const historySessions = ref<Session[]>([]);

// 学生 ID (实际应用中从用户上下文获取)
const studentId = ref(1);

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 获取历史会话列表
const fetchHistorySessions = async () => {
  historyLoading.value = true;
  try {
    const response = await requestClient.get(`/ai-doctor/counselor/sessions`, {
      params: { studentId: studentId.value },
    });
    historySessions.value = response.data || response || [];
  } catch (error) {
    console.error('Failed to fetch history sessions:', error);
  } finally {
    historyLoading.value = false;
  }
};

// 加载会话消息
const loadSessionMessages = async (sessionId: string) => {
  try {
    const response = await requestClient.get(
      `/ai-doctor/counselor/session/${sessionId}/messages`,
    );
    const data = response.data || response || [];

    messages.value = data.map((msg: any) => ({
      id: msg.id.toString(),
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      messageId: msg.id,
      detectedMood: msg.detectedMood,
      suggestedActions: msg.suggestedActions,
    }));

    currentSessionId.value = sessionId;
    showHistoryModal.value = false;
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load session messages:', error);
    message.error('加载会话消息失败');
  }
};

// 创建新会话
const createNewSession = async () => {
  if (!sessionTopic.value.trim()) {
    message.warning('请输入咨询主题');
    return;
  }

  isLoading.value = true;
  try {
    const response = await requestClient.post('/ai-doctor/counselor/session', {
      studentId: studentId.value,
      topic: sessionTopic.value,
      counselorPersona: selectedPersona.value,
      currentMood: selectedMood.value,
    });

    const data = response.data || response;
    currentSessionId.value = data.sessionId;

    // 添加欢迎消息
    messages.value = [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          data.welcomeMessage ||
          `您好！我是您的 AI 学习咨询师。今天我们来聊聊"${sessionTopic.value}"。请随时告诉我您的想法和问题。`,
        timestamp: new Date(),
      },
    ];

    sessionTopic.value = '';
    message.success('会话已创建');
  } catch (error: any) {
    console.error('Failed to create session:', error);
    message.error(error.response?.data?.message || '创建会话失败');
  } finally {
    isLoading.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value)
    return;

  // 如果没有会话，先创建
  if (!currentSessionId.value) {
    sessionTopic.value = inputMessage.value.slice(0, 50);
    await createNewSession();
    if (!currentSessionId.value) return;
  }

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date(),
  };
  messages.value.push(userMessage);
  const question = inputMessage.value;
  inputMessage.value = '';
  scrollToBottom();

  isLoading.value = true;
  streamingContent.value = '';

  try {
    // 尝试流式请求
    const response = await requestClient.post(
      `/ai-doctor/counselor/session/${currentSessionId.value}/message`,
      {
        content: question,
        currentMood: selectedMood.value,
      },
      {
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          // 处理流式响应 (如果后端支持)
          const text = progressEvent.event?.target?.responseText || '';
          if (text) {
            isStreaming.value = true;
            streamingContent.value = text;
            scrollToBottom();
          }
        },
      },
    );

    const data = response.data || response;

    // 添加 AI 响应
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.reply || streamingContent.value || data.content,
      timestamp: new Date(),
      messageId: data.messageId,
      detectedMood: data.detectedMood,
      suggestedActions: data.suggestedActions,
    };
    messages.value.push(assistantMessage);
  } catch (error: any) {
    console.error('Failed to send message:', error);

    // 如果流式失败，回退到普通请求
    if (error.message?.includes('stream')) {
      try {
        const response = await requestClient.post(
          `/ai-doctor/counselor/session/${currentSessionId.value}/message`,
          {
            content: question,
            currentMood: selectedMood.value,
          },
        );

        const data = response.data || response;
        messages.value.push({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || data.content,
          timestamp: new Date(),
          messageId: data.messageId,
          detectedMood: data.detectedMood,
          suggestedActions: data.suggestedActions,
        });
      } catch (retryError) {
        message.error('发送消息失败');
      }
    } else {
      message.error(error.response?.data?.message || '发送消息失败');
    }
  } finally {
    isLoading.value = false;
    isStreaming.value = false;
    streamingContent.value = '';
    scrollToBottom();
  }
};

// 结束会话
const endSession = async () => {
  if (!currentSessionId.value) return;

  try {
    await requestClient.post(
      `/ai-doctor/counselor/session/${currentSessionId.value}/end`,
    );
    message.success('会话已结束');
    currentSessionId.value = null;
    messages.value = [];
  } catch (error) {
    console.error('Failed to end session:', error);
  }
};

// 提交反馈
const submitFeedback = async (
  messageId: number | undefined,
  rating: 'up' | 'down',
) => {
  if (!messageId) return;

  try {
    await requestClient.post('/ai-studio/feedback', {
      executionId: currentSessionId.value,
      messageId,
      rating,
    });
    message.success(
      rating === 'up' ? '感谢您的认可！' : '感谢您的反馈，我们会改进！',
    );
  } catch (error) {
    console.error('Failed to submit feedback:', error);
  }
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 显示历史会话
const showHistory = () => {
  fetchHistorySessions();
  showHistoryModal.value = true;
};

// 开始新对话
const startNewChat = () => {
  currentSessionId.value = null;
  messages.value = [];
  sessionTopic.value = '';
};

// 获取情绪 Emoji
const getMoodEmoji = (mood: string) => {
  return moodOptions.find((m) => m.value === mood)?.emoji || '😐';
};

// 跳转到 FAQ 页面
const navigateToFAQ = () => {
  router.push('/ai-doctor/counselor/faq');
};

onMounted(() => {
  // 可以在这里加载最近的会话
});
</script>

<template>
  <div class="counselor-container">
    <Card :bordered="false" class="chat-card">
      <template #title>
        <Space>
          <RobotOutlined />
          <span>AI 咨询师</span>
          <Tag v-if="currentSessionId" color="green">会话中</Tag>
        </Space>
      </template>

      <template #extra>
        <Space>
          <Tooltip title="常见问题">
            <Button type="text" @click="navigateToFAQ">
              <template #icon><QuestionCircleOutlined /></template>
            </Button>
          </Tooltip>
          <Tooltip title="历史会话">
            <Button type="text" @click="showHistory">
              <template #icon><HistoryOutlined /></template>
            </Button>
          </Tooltip>
          <Tooltip title="新对话">
            <Button type="text" @click="startNewChat">
              <template #icon><ReloadOutlined /></template>
            </Button>
          </Tooltip>
        </Space>
      </template>

      <!-- 会话设置（未开始会话时显示） -->
      <div
        v-if="!currentSessionId && messages.length === 0"
        class="session-setup"
      >
        <div class="setup-title">开始新的咨询会话</div>

        <div class="setup-section">
          <label>选择咨询师风格</label>
          <Select v-model:value="selectedPersona" style="width: 100%">
            <Select.Option
              v-for="persona in personaOptions"
              :key="persona.value"
              :value="persona.value"
            >
              <div>
                <div>{{ persona.label }}</div>
                <div class="option-desc">{{ persona.description }}</div>
              </div>
            </Select.Option>
          </Select>
        </div>

        <div class="setup-section">
          <label>您现在的心情</label>
          <div class="mood-selector">
            <Tooltip
              v-for="mood in moodOptions"
              :key="mood.value"
              :title="mood.label"
            >
              <Button
                :type="selectedMood === mood.value ? 'primary' : 'default'"
                shape="circle"
                size="large"
                @click="selectedMood = mood.value"
              >
                {{ mood.emoji }}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div class="setup-section">
          <label>咨询主题</label>
          <Input
            v-model:value="sessionTopic"
            placeholder="例如：最近数学成绩下降，感到很焦虑"
            @pressEnter="createNewSession"
          />
        </div>

        <Button
          type="primary"
          size="large"
          block
          :loading="isLoading"
          @click="createNewSession"
        >
          开始咨询
        </Button>

        <!-- FAQ 快速链接 -->
        <div class="faq-tip">
          <QuestionCircleOutlined />
          <span>
            不知道问什么？
            <a @click="navigateToFAQ">查看常见问题</a>
          </span>
        </div>
      </div>

      <!-- 聊天区域 -->
      <template v-else>
        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'message',
              msg.role === 'user' ? 'user-message' : 'assistant-message',
            ]"
          >
            <Avatar
              :class="msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'"
              :style="{
                backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a',
              }"
            >
              <template #icon>
                <UserOutlined v-if="msg.role === 'user'" />
                <RobotOutlined v-else />
              </template>
            </Avatar>
            <div class="message-content">
              <div class="message-text">
                {{ msg.content }}
              </div>

              <!-- 情绪检测和建议 -->
              <div
                v-if="msg.role === 'assistant' && msg.detectedMood"
                class="message-meta"
              >
                <Tag color="blue">
                  <SmileOutlined /> 检测到情绪:
                  {{ getMoodEmoji(msg.detectedMood) }}
                </Tag>
              </div>

              <div
                v-if="msg.suggestedActions && msg.suggestedActions.length > 0"
                class="suggested-actions"
              >
                <div class="actions-label">建议行动:</div>
                <Tag v-for="(action, idx) in msg.suggestedActions" :key="idx">
                  {{ action }}
                </Tag>
              </div>

              <div class="message-footer">
                <span class="message-time">
                  {{ msg.timestamp.toLocaleTimeString() }}
                </span>

                <!-- 反馈按钮（仅 AI 消息） -->
                <Space
                  v-if="msg.role === 'assistant' && msg.messageId"
                  class="feedback-buttons"
                >
                  <Tooltip title="有帮助">
                    <Button
                      type="text"
                      size="small"
                      @click="submitFeedback(msg.messageId, 'up')"
                    >
                      <template #icon><LikeOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip title="需要改进">
                    <Button
                      type="text"
                      size="small"
                      @click="submitFeedback(msg.messageId, 'down')"
                    >
                      <template #icon><DislikeOutlined /></template>
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </div>
          </div>

          <!-- 流式输出中 -->
          <div
            v-if="isStreaming && streamingContent"
            class="message assistant-message"
          >
            <Avatar
              class="assistant-avatar"
              :style="{ backgroundColor: '#52c41a' }"
            >
              <template #icon><RobotOutlined /></template>
            </Avatar>
            <div class="message-content">
              <div class="message-text streaming">
                {{ streamingContent }}
                <span class="cursor">|</span>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div
            v-if="isLoading && !isStreaming"
            class="message assistant-message"
          >
            <Avatar
              class="assistant-avatar"
              :style="{ backgroundColor: '#52c41a' }"
            >
              <template #icon><RobotOutlined /></template>
            </Avatar>
            <div class="message-content">
              <Spin size="small" />
              <span style="margin-left: 8px">正在思考...</span>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <Select
            v-model:value="selectedMood"
            style="width: 80px"
            placeholder="心情"
          >
            <Select.Option
              v-for="mood in moodOptions"
              :key="mood.value"
              :value="mood.value"
            >
              {{ mood.emoji }}
            </Select.Option>
          </Select>
          <Input.TextArea
            v-model:value="inputMessage"
            placeholder="请输入您的问题..."
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keypress="handleKeyPress"
          />
          <Button
            type="primary"
            :loading="isLoading"
            :disabled="!inputMessage.trim()"
            @click="sendMessage"
          >
            <template #icon><SendOutlined /></template>
            发送
          </Button>
        </div>
      </template>
    </Card>

    <!-- 历史会话弹窗 -->
    <Modal
      v-model:open="showHistoryModal"
      title="历史会话"
      width="600px"
      :footer="null"
    >
      <Spin :spinning="historyLoading">
        <List
          :data-source="historySessions"
          :locale="{ emptyText: '暂无历史会话' }"
        >
          <template #renderItem="{ item }">
            <List.Item>
              <List.Item.Meta
                :title="item.topic"
                :description="`${personaOptions.find((p) => p.value === item.counselorPersona)?.label || '默认咨询师'} · ${item.messageCount} 条消息`"
              />
              <template #actions>
                <Button
                  type="link"
                  @click="loadSessionMessages(item.sessionId)"
                >
                  继续会话
                </Button>
              </template>
            </List.Item>
          </template>
        </List>
      </Spin>
    </Modal>
  </div>
</template>

<style scoped>
.counselor-container {
  height: calc(100vh - 120px);
  padding: 16px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-card :deep(.ant-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.session-setup {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  padding: 40px;
  margin: 0 auto;
}

.setup-title {
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-section label {
  font-weight: 500;
  color: rgb(0 0 0 / 65%);
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.mood-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.messages-container {
  flex: 1;
  padding: 16px;
  margin-bottom: 16px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 8px;
}

.message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-message {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  margin: 0 12px;
}

.message-text {
  padding: 12px 16px;
  line-height: 1.6;
  background: #fff;
  border-radius: 8px;
}

.message-text.streaming {
  position: relative;
}

.message-text .cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

.user-message .message-text {
  color: #fff;
  background: #1890ff;
}

.message-meta {
  margin-top: 8px;
}

.suggested-actions {
  margin-top: 8px;
}

.actions-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.message-footer {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.user-message .message-footer {
  justify-content: flex-end;
}

.feedback-buttons {
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .feedback-buttons {
  opacity: 1;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-container :deep(.ant-input) {
  flex: 1;
}

.faq-tip {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.faq-tip a {
  color: #1890ff;
  cursor: pointer;
  text-decoration: none;
}

.faq-tip a:hover {
  text-decoration: underline;
}
</style>
