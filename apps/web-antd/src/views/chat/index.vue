<template>
  <div class="chat-page">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <div>
          <div class="sidebar-kicker">Agent Chat</div>
          <h3 class="sidebar-title">会话历史</h3>
        </div>
        <Button type="primary" class="new-session-btn" @click="startNewChat">
          <PlusOutlined />
          新会话
        </Button>
      </div>

      <div class="sidebar-search">
        <Input
          v-model:value="searchText"
          placeholder="搜索历史会话"
          size="small"
          allow-clear
        >
          <template #prefix>
            <SearchOutlined class="search-icon" />
          </template>
        </Input>
      </div>

      <div class="sidebar-section-label history-label">Chat History</div>
      <div class="sidebar-sessions">
        <template v-if="filteredSessions.length > 0">
          <div
            v-for="group in sessionGroups"
            :key="group.label"
            class="session-group"
          >
            <div class="session-group-label">{{ group.label }}</div>
            <div
              v-for="session in group.sessions"
              :key="session.id"
              class="session-item"
              :class="{ active: session.id === activeSessionId }"
              @click="selectSession(session.id)"
            >
              <div class="session-item-content">
                <div class="session-item-title">
                  {{ session.title || '新会话' }}
                </div>
                <div class="session-item-time">
                  {{ getSessionScopeLabel(session.scopeKey) }} ·
                  {{ formatTime(session.updatedAt) }}
                </div>
              </div>
              <div class="session-item-actions" @click.stop>
                <Dropdown :trigger="['click']">
                  <Button type="text" size="small" class="session-action-btn">
                    <MoreOutlined />
                  </Button>
                  <template #overlay>
                    <Menu>
                      <MenuItem @click="renameSession(session)">
                        <EditOutlined /> 重命名
                      </MenuItem>
                      <MenuItem @click="confirmDeleteSession(session)">
                        <DeleteOutlined /> 删除
                      </MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="sidebar-empty">
          <Empty description="暂无会话" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </div>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-topbar">
        <div class="active-session-meta">
          <div class="active-session-title">{{ activeSessionTitle }}</div>
          <div class="active-session-subtitle">
            {{ selectedAgentDescription }}
          </div>
        </div>
        <Button class="topbar-new-btn" @click="startNewChat">
          <PlusOutlined />
          新话题
        </Button>
      </div>

      <div class="chat-messages" ref="messageContainer">
        <div
          v-if="!activeSessionId || messages.length === 0"
          class="welcome-screen"
        >
          <div class="welcome-copy">
            <div class="welcome-brand">
              <div class="welcome-icon">AI</div>
              <span>AI Agent Chat</span>
            </div>
            <h2 class="welcome-title">新建会话</h2>
            <p class="welcome-subtitle">
              面向所有业态的统一智能体入口，选择当前租户可用智能体后开始任务。
            </p>
          </div>

          <div class="example-row">
            <button
              v-for="prompt in starterPrompts"
              :key="prompt.label"
              type="button"
              class="example-pill"
              @click="sendFromCard(prompt.text)"
            >
              <strong>{{ prompt.label }}</strong>
              <span>{{ prompt.description }}</span>
            </button>
          </div>
        </div>

        <div v-for="msg in messages" :key="msg.id" class="message-row">
          <div
            class="message-bubble-wrapper"
            :class="msg.role === 'USER' ? 'message-user' : 'message-assistant'"
          >
            <div v-if="msg.role === 'ASSISTANT'" class="message-avatar">AI</div>

            <div
              class="message-bubble"
              :class="msg.role === 'USER' ? 'bubble-user' : 'bubble-assistant'"
            >
              <MarkdownRenderer
                :content="
                  parseMessageContent(getRenderedMessageContent(msg)).answer
                "
                :streaming="isActiveStreamingMessage(msg)"
              />
              <div
                v-if="
                  msg.role === 'ASSISTANT' &&
                  parseMessageContent(getRenderedMessageContent(msg)).thinking
                "
                class="thinking-block"
              >
                <details class="thinking-details">
                  <summary>
                    <span>思考过程</span>
                  </summary>
                  <MarkdownRenderer
                    :content="
                      parseMessageContent(getRenderedMessageContent(msg))
                        .thinking
                    "
                    :streaming="isActiveStreamingMessage(msg)"
                  />
                </details>
              </div>
              <span
                v-if="isActiveStreamingMessage(msg)"
                class="streaming-cursor"
              >
                <span /><span /><span />
              </span>
            </div>

            <div
              v-if="msg.role === 'USER'"
              class="message-avatar message-avatar-user"
            >
              <UserOutlined />
            </div>
          </div>

          <div
            v-if="
              msg.role === 'ASSISTANT' &&
              msg.status === 'COMPLETE' &&
              msg.content
            "
            class="message-actions"
          >
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                @click="copyMessage(msg.content)"
              >
                <CopyOutlined />
              </Button>
            </Tooltip>
            <Tooltip title="重新生成">
              <Button
                type="text"
                size="small"
                @click="regenerateMessage(msg.id)"
              >
                <SyncOutlined />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="chat-input-container">
          <TextArea
            v-model:value="inputText"
            placeholder="输入题目、截图说明或学习目标"
            :disabled="isStreaming"
            :auto-size="{ minRows: 1, maxRows: 6 }"
            class="chat-textarea"
            @keydown="handleInputKeydown"
          />
          <div class="chat-send-area">
            <Button
              v-if="isStreaming"
              danger
              class="stop-btn"
              @click="stopStreaming"
            >
              <StopOutlined />
              停止
            </Button>
            <Tooltip v-else title="发送">
              <Button
                type="primary"
                shape="circle"
                class="send-btn"
                :disabled="!inputText.trim()"
                @click="submitMessage"
              >
                <SendOutlined />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div class="input-toolbar">
          <button
            type="button"
            class="toolbar-agent-btn"
            :class="{ active: agentPanelOpen }"
            @click="agentPanelOpen = !agentPanelOpen"
          >
            <component :is="selectedAgentIcon" />
            <span>智能体</span>
            <strong>{{ selectedAgentName }}</strong>
          </button>
          <div class="prompt-strip">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              type="button"
              class="prompt-pill"
              :disabled="isStreaming"
              @click="sendFromCard(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
        <div v-if="agentPanelOpen" class="agent-panel">
          <div class="agent-panel-header">
            <div>
              <div class="agent-panel-title">选择智能体</div>
              <div class="agent-panel-subtitle">当前租户可用</div>
            </div>
            <Button type="text" size="small" @click="agentPanelOpen = false">
              收起
            </Button>
          </div>
          <div v-if="agentsLoading" class="agent-panel-state">
            正在加载智能体...
          </div>
          <div v-else-if="tenantAgents.length === 0" class="agent-panel-state">
            当前租户暂无可用智能体
          </div>
          <div v-else class="agent-grid">
            <button
              v-for="agent in tenantAgents"
              :key="agent.key"
              type="button"
              class="agent-card"
              :class="{ selected: agent.key === selectedAgentKey }"
              @click="selectAgent(agent.key)"
            >
              <div class="agent-card-icon" :class="agent.tone">
                <component :is="agent.iconComponent" />
              </div>
              <div class="agent-card-body">
                <div class="agent-scope-name">{{ agent.scopeName }}</div>
                <div class="agent-card-name">{{ agent.displayName }}</div>
                <div class="agent-card-desc">{{ agent.description }}</div>
                <div v-if="agent.capabilities?.length" class="agent-tags">
                  <span
                    v-for="capability in agent.capabilities.slice(0, 3)"
                    :key="capability"
                  >
                    {{ capability }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, h, watch } from 'vue';
import type { Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  MenuItem,
  Modal,
  Tooltip,
  message,
} from 'ant-design-vue';
import {
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CopyOutlined,
  SyncOutlined,
  SendOutlined,
  StopOutlined,
  BookOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FunctionOutlined,
  NodeIndexOutlined,
  PartitionOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue';
import {
  listScopes,
  listSessions,
  createSession as apiCreateSession,
  updateSession,
  deleteSession as apiDeleteSession,
  getSession,
  sendMessageStream,
  regenerateMessageStream,
  stopMessage,
  type ChatMessage,
  type ChatSession,
  type ScopeInfo,
} from '#/api/ai-chat';
import MarkdownRenderer from './components/MarkdownRenderer.vue';

const TextArea = Input.TextArea;
const route = useRoute();
const router = useRouter();
const CHAT_HOME_PATH = '/chat';

// ==================== State ====================

const sessions = ref<ChatSession[]>([]);
const activeSessionId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const streamingContent = ref('');
const searchText = ref('');
const messageContainer = ref<HTMLElement>();
const abortController = ref<AbortController | null>(null);
const activeStreamMessageId = ref<string | null>(null);
const agentPanelOpen = ref(false);
const agentsLoading = ref(false);
const selectedAgentKey = ref('');
const scopes = ref<ScopeInfo[]>([]);
const loadedSessionId = ref<string | null>(null);
let sessionLoadToken = 0;

const STREAM_IDLE_TIMEOUT_MS = 45_000;

const isStreaming = computed(() => {
  const messageId = activeStreamMessageId.value;
  return (
    !!messageId &&
    messages.value.some((m) => m.id === messageId && m.status === 'STREAMING')
  );
});

function resetStreamingState() {
  abortController.value?.abort();
  abortController.value = null;
  activeStreamMessageId.value = null;
  streamingContent.value = '';
}

// ==================== Agents ====================

type TenantAgent = ScopeInfo['agents'][number] & {
  key: string;
  iconComponent: Component;
  scopeKey: string;
  scopeName: string;
  tone: string;
};

const iconMap: Record<string, Component> = {
  BookOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FunctionOutlined,
  MessageOutlined: BookOutlined,
  NodeIndexOutlined,
  PartitionOutlined,
  RobotOutlined: BookOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
};

const agentToneByCategory: Record<string, string> = {
  custom: 'tone-purple',
  general: 'tone-blue',
  retail: 'tone-cyan',
  tutor: 'tone-green',
  'customer-service': 'tone-amber',
};

const scopeToneByKey: Record<string, string> = {
  platform: 'tone-blue',
  retail: 'tone-cyan',
  tutor: 'tone-green',
};

const agentToneById: Record<string, string> = {
  'homework-grader': 'tone-purple',
  'math-tutor': 'tone-green',
  'problem-solver': 'tone-blue',
};

const tenantAgents = computed<TenantAgent[]>(() =>
  scopes.value.flatMap((scope) =>
    (scope.agents || []).map((agent) => ({
      ...agent,
      key: `${scope.key}:${agent.id}`,
      iconComponent:
        iconMap[agent.icon] || iconMap[scope.icon || ''] || BookOutlined,
      scopeKey: scope.key,
      scopeName: scope.displayName,
      tone:
        agentToneById[agent.id] ||
        scopeToneByKey[scope.key] ||
        agentToneByCategory[agent.category] ||
        'tone-blue',
    })),
  ),
);

const selectedAgent = computed(
  () =>
    tenantAgents.value.find((agent) => agent.key === selectedAgentKey.value) ||
    tenantAgents.value[0],
);

const selectedAgentName = computed(
  () => selectedAgent.value?.displayName || '默认',
);

const selectedAgentDescription = computed(() =>
  selectedAgent.value
    ? `${selectedAgent.value.scopeName} · ${selectedAgent.value.displayName}`
    : '使用默认智能体回答',
);

const selectedAgentIcon = computed(
  () => selectedAgent.value?.iconComponent || BookOutlined,
);

const quickPrompts = [
  '先给我一个提示',
  '用更简单的方式讲',
  '检查我的解法',
  '再出一道同类题',
];

const starterPrompts = [
  {
    label: '学习辅导',
    text: '帮我把这道题拆成 3 个步骤',
    description: '题目讲解、提示引导、变式训练',
  },
  {
    label: '运营分析',
    text: '帮我分析一下今天需要优先处理的运营问题',
    description: '面向门店、客户和任务的业务分析',
  },
  {
    label: '客服助手',
    text: '帮我整理一段清晰、专业的客户回复',
    description: '按当前业态智能体生成可执行回复',
  },
];

// ==================== Session Filtering & Grouping ====================

const filteredSessions = computed(() => {
  if (!searchText.value) return sessions.value;
  const q = searchText.value.toLowerCase();
  return sessions.value.filter((s) =>
    (s.title || '新会话').toLowerCase().includes(q),
  );
});

const sessionGroups = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; sessions: ChatSession[] }[] = [
    { label: '今天', sessions: [] },
    { label: '昨天', sessions: [] },
    { label: '近7天', sessions: [] },
    { label: '更早', sessions: [] },
  ];

  for (const session of filteredSessions.value) {
    const date = new Date(session.updatedAt);
    if (date >= today) {
      groups[0]!.sessions.push(session);
    } else if (date >= yesterday) {
      groups[1]!.sessions.push(session);
    } else if (date >= weekAgo) {
      groups[2]!.sessions.push(session);
    } else {
      groups[3]!.sessions.push(session);
    }
  }

  return groups.filter((g) => g.sessions.length > 0);
});

const activeSession = computed(() =>
  sessions.value.find((s) => s.id === activeSessionId.value),
);

const activeSessionTitle = computed(
  () => activeSession.value?.title || '新建会话',
);

const selectedScope = computed(() =>
  selectedAgent.value
    ? scopes.value.find((scope) => scope.key === selectedAgent.value?.scopeKey)
    : scopes.value[0],
);

// ==================== Lifecycle ====================

onMounted(async () => {
  await Promise.all([loadSessions(), loadAgents()]);
  await restoreSessionFromRoute();
});

watch(
  () => route.params.sessionId,
  async () => {
    await restoreSessionFromRoute();
  },
);

// ==================== Route State ====================

function getRouteSessionId() {
  const raw = route.params.sessionId;
  return Array.isArray(raw) ? raw[0] : raw;
}

async function goChatHome(replace = false) {
  if (route.path !== CHAT_HOME_PATH) {
    const location = { path: CHAT_HOME_PATH, query: route.query };
    if (replace) {
      await router.replace(location);
    } else {
      await router.push(location);
    }
  }
}

async function syncSessionRoute(sessionId: string, replace = false) {
  const target = `/chat/${sessionId}`;
  if (route.path === target) return;

  const location = { path: target, query: route.query };
  if (replace) {
    await router.replace(location);
  } else {
    await router.push(location);
  }
}

async function restoreSessionFromRoute() {
  const sessionId = getRouteSessionId();
  if (!sessionId) {
    activeSessionId.value = null;
    loadedSessionId.value = null;
    messages.value = [];
    resetStreamingState();
    syncSelectedAgentFromSession(null);
    return;
  }

  if (loadedSessionId.value === sessionId) {
    return;
  }

  await loadSessionDetail(sessionId);
}

// ==================== Session Operations ====================

async function loadSessions() {
  try {
    const data = await listSessions(undefined, { size: 50 });
    sessions.value = data.items || [];
  } catch (e) {
    console.error('Failed to load sessions:', e);
  }
}

async function loadAgents() {
  agentsLoading.value = true;
  try {
    const data = await listScopes();
    scopes.value = data.scopes || [];
    syncSelectedAgentFromSession(activeSession.value);
  } catch (e) {
    console.error('Failed to load agents:', e);
    message.error('获取智能体列表失败');
  } finally {
    agentsLoading.value = false;
  }
}

function upsertSession(session: ChatSession) {
  const index = sessions.value.findIndex((item) => item.id === session.id);
  if (index >= 0) {
    sessions.value[index] = session;
  } else {
    sessions.value.unshift(session);
  }
}

function normalizeLoadedMessages(items: ChatMessage[]) {
  return items.map((item) => {
    if (item.status !== 'STREAMING') return item;
    return {
      ...item,
      content: item.content || '上次回复已中断，请重新发送。',
      status: 'FAILED' as const,
    };
  });
}

async function startNewChat() {
  sessionLoadToken += 1;
  activeSessionId.value = null;
  loadedSessionId.value = null;
  messages.value = [];
  inputText.value = '';
  resetStreamingState();
  agentPanelOpen.value = false;
  syncSelectedAgentFromSession(null);
  await goChatHome();
}

function buildSessionTitle(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return '新会话';
  return normalized.slice(0, 30) + (normalized.length > 30 ? '...' : '');
}

function updateLocalSession(sessionId: string, patch: Partial<ChatSession>) {
  const session = sessions.value.find((item) => item.id === sessionId);
  if (session) {
    Object.assign(session, patch);
  }
}

async function ensureSessionTitle(sessionId: string, content: string) {
  const session = sessions.value.find((item) => item.id === sessionId);
  if (!session || session.title) return;

  const title = buildSessionTitle(content);
  updateLocalSession(sessionId, { title });
  try {
    const result = await updateSession(sessionId, { title });
    if (result.session) {
      upsertSession(result.session);
    }
  } catch (e) {
    console.error('Failed to update session title:', e);
  }
}

async function createSession(
  options: { replaceRoute?: boolean; title?: string } = {},
) {
  try {
    const agent = selectedAgent.value;
    const scope = selectedScope.value;
    if (!scope) {
      message.error('当前租户暂无可用智能体');
      return undefined;
    }
    const { session } = await apiCreateSession({
      scopeKey: agent?.scopeKey || scope.key,
      ...(agent?.id ? { agentId: agent.id } : {}),
      ...(options.title ? { title: options.title } : {}),
    });
    sessionLoadToken += 1;
    upsertSession(session);
    activeSessionId.value = session.id;
    loadedSessionId.value = session.id;
    syncSelectedAgentFromSession(session);
    messages.value = [];
    resetStreamingState();
    await syncSessionRoute(session.id, options.replaceRoute ?? true);
    return session;
  } catch (e) {
    console.error('Failed to create session:', e);
    message.error('创建会话失败');
    return undefined;
  }
}

async function selectSession(
  sessionId: string,
  options: { syncRoute?: boolean } = {},
) {
  if (options.syncRoute !== false) {
    await syncSessionRoute(sessionId);
  }
  await loadSessionDetail(sessionId);
}

async function loadSessionDetail(sessionId: string) {
  const token = ++sessionLoadToken;
  activeSessionId.value = sessionId;
  resetStreamingState();
  try {
    const data = await getSession(sessionId);
    if (token !== sessionLoadToken) return;

    upsertSession(data.session);
    syncSelectedAgentFromSession(data.session);
    messages.value = normalizeLoadedMessages(data.messages || []);
    loadedSessionId.value = sessionId;
    nextTick(scrollToBottom);
  } catch (e) {
    if (token !== sessionLoadToken) return;

    console.error('Failed to load messages:', e);
    message.error('加载会话失败');
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = null;
      loadedSessionId.value = null;
      messages.value = [];
      await goChatHome(true);
    }
  }
}

async function renameSession(session: ChatSession) {
  const newName = ref(session.title || '');
  Modal.confirm({
    title: '重命名会话',
    content: () =>
      h(Input, {
        defaultValue: newName.value,
        autofocus: true,
        placeholder: '请输入会话名称',
        'onUpdate:value': (value: string) => {
          newName.value = value;
        },
        onChange: (event: Event) => {
          newName.value = (event.target as HTMLInputElement).value;
        },
        onInput: (event: Event) => {
          newName.value = (event.target as HTMLInputElement).value;
        },
      }),
    onOk: async () => {
      const title = newName.value.trim();
      if (!title) {
        message.warning('会话名称不能为空');
        return Promise.reject(new Error('Session title is empty'));
      }
      if (title !== session.title) {
        const result = await updateSession(session.id, { title });
        if (result.session) {
          upsertSession(result.session);
        } else {
          updateLocalSession(session.id, { title });
        }
      }
    },
  });
}

async function selectAgent(agentKey: string) {
  const previousAgentKey = selectedAgentKey.value;
  selectedAgentKey.value = agentKey;
  agentPanelOpen.value = false;

  if (!activeSessionId.value) return;

  const agent = selectedAgent.value;
  if (!agent) return;

  if (activeSession.value?.scopeKey !== agent.scopeKey) {
    sessionLoadToken += 1;
    activeSessionId.value = null;
    loadedSessionId.value = null;
    messages.value = [];
    await goChatHome();
    return;
  }

  try {
    const result = await updateSession(activeSessionId.value, {
      defaultAgentId: agent.id,
    });
    const session = result.session;
    const local = sessions.value.find((s) => s.id === activeSessionId.value);
    if (session && local) {
      local.defaultAgentId = session.defaultAgentId;
      local.updatedAt = session.updatedAt;
    }
  } catch (e) {
    selectedAgentKey.value = previousAgentKey;
    console.error('Failed to update session agent:', e);
    message.error('切换智能体失败');
  }
}

async function confirmDeleteSession(session: ChatSession) {
  Modal.confirm({
    title: '删除会话',
    content: `确定删除「${session.title || '新会话'}」吗？`,
    okType: 'danger',
    onOk: async () => {
      await apiDeleteSession(session.id);
      sessions.value = sessions.value.filter((s) => s.id !== session.id);
      if (activeSessionId.value === session.id) {
        sessionLoadToken += 1;
        activeSessionId.value = null;
        loadedSessionId.value = null;
        messages.value = [];
        await goChatHome(true);
      }
    },
  });
}

// ==================== Send Message ====================

async function submitMessage() {
  const content = inputText.value.trim();
  if (!content) return;

  if (!activeSessionId.value) {
    const session = await createSession({
      replaceRoute: true,
      title: buildSessionTitle(content),
    });
    if (!session) return;
  }
  await sendMessage(content);
}

async function sendMessage(content?: string) {
  const messageContent = content ?? inputText.value.trim();
  if (!messageContent || !activeSessionId.value || isStreaming.value) return;

  const sessionId = activeSessionId.value;
  inputText.value = '';
  await ensureSessionTitle(sessionId, messageContent);

  // Add user message
  messages.value.push({
    id: `user-${Date.now()}`,
    sessionId,
    role: 'USER',
    content: messageContent,
    status: 'COMPLETE',
    createdAt: new Date().toISOString(),
  });

  // Add assistant placeholder
  let assistantMessageId = `assistant-${Date.now()}`;
  messages.value.push({
    id: assistantMessageId,
    sessionId,
    role: 'ASSISTANT',
    content: '',
    status: 'STREAMING',
    createdAt: new Date().toISOString(),
  });
  streamingContent.value = '';
  activeStreamMessageId.value = assistantMessageId;

  scrollToBottom();

  const controller = new AbortController();
  abortController.value = controller;
  let streamFinished = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  };

  const refreshIdleTimer = () => {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      if (!streamFinished && !controller.signal.aborted) {
        controller.abort();
        finalizeStreaming(assistantMessageId, '响应超时，请稍后重试');
      }
    }, STREAM_IDLE_TIMEOUT_MS);
  };

  try {
    refreshIdleTimer();
    for await (const event of sendMessageStream(
      sessionId,
      { content: messageContent },
      controller.signal,
    )) {
      refreshIdleTimer();
      if (event.type === 'token') {
        const eventData = event.data as { isFinished?: boolean };
        if (event.messageId && event.messageId !== assistantMessageId) {
          const streamingMsg = messages.value.find(
            (msg) =>
              msg.id === assistantMessageId && msg.status === 'STREAMING',
          );
          if (streamingMsg) {
            streamingMsg.id = event.messageId;
            assistantMessageId = event.messageId;
            activeStreamMessageId.value = event.messageId;
          }
        }
        const tokenContent = extractStreamContent(event.data);
        streamingContent.value += tokenContent;
        scrollToBottom();
        if (eventData.isFinished) {
          streamFinished = true;
          finalizeStreaming(event.messageId || assistantMessageId);
        }
      } else if (event.type === 'final') {
        streamFinished = true;
        finalizeStreaming(
          event.messageId || assistantMessageId,
          undefined,
          extractStreamContent(event.data),
        );
      } else if (event.type === 'error') {
        streamFinished = true;
        finalizeStreaming(
          event.messageId || assistantMessageId,
          (event.data as { message?: string }).message || '生成失败',
        );
      }
    }

    if (!streamFinished) {
      streamFinished = true;
      finalizeStreaming(assistantMessageId);
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      // User stopped generation
      finalizeStreaming(assistantMessageId);
    } else {
      console.error('Stream error:', e);
      finalizeStreaming(assistantMessageId, e.message || '发送失败');
    }
  } finally {
    clearIdleTimer();
    abortController.value = null;
  }

  await ensureSessionTitle(sessionId, messageContent);
}

async function sendFromCard(text: string) {
  if (isStreaming.value) return;
  if (!activeSessionId.value) {
    const session = await createSession({
      replaceRoute: true,
      title: buildSessionTitle(text),
    });
    if (!session) return;
  }
  inputText.value = text;
  await sendMessage(text);
}

function stopStreaming() {
  const messageId = activeStreamMessageId.value;
  abortController.value?.abort();
  if (messageId && !messageId.startsWith('assistant-')) {
    stopMessage(messageId).catch(() => {});
  }
  if (messageId) {
    finalizeStreaming(messageId, '已停止生成');
  }
}

function isActiveStreamingMessage(msg: ChatMessage) {
  return msg.status === 'STREAMING' && activeStreamMessageId.value === msg.id;
}

function getRenderedMessageContent(msg: ChatMessage) {
  return isActiveStreamingMessage(msg)
    ? streamingContent.value || msg.content
    : msg.content;
}

function parseMessageContent(content: string) {
  const thinkingParts: string[] = [];
  const answer = content
    .replace(/<(think|thinking)>[\s\S]*?<\/\1>/gi, (match: string) => {
      const inner = match
        .replace(/^<(think|thinking)>/i, '')
        .replace(/<\/(think|thinking)>$/i, '')
        .trim();
      if (inner) {
        thinkingParts.push(inner);
      }
      return '';
    })
    .trim();

  return {
    answer,
    thinking: thinkingParts.join('\n\n').trim(),
  };
}

function findActiveStreamingMessage(messageId?: string) {
  const targetId = messageId || activeStreamMessageId.value;
  if (targetId) {
    const byTargetId = messages.value.find(
      (msg) => msg.id === targetId && msg.status === 'STREAMING',
    );
    if (byTargetId) return byTargetId;
  }

  const activeId = activeStreamMessageId.value;
  if (activeId && activeId !== targetId) {
    const byActiveId = messages.value.find(
      (msg) => msg.id === activeId && msg.status === 'STREAMING',
    );
    if (byActiveId) return byActiveId;
  }

  return [...messages.value]
    .reverse()
    .find((msg) => msg.status === 'STREAMING');
}

function finalizeStreaming(
  messageId?: string,
  error?: string,
  finalContent?: string,
) {
  const streamingMsg = findActiveStreamingMessage(messageId);
  if (streamingMsg) {
    const resolvedContent =
      finalContent || streamingContent.value || streamingMsg.content;
    streamingMsg.content = resolvedContent;
    streamingMsg.status = error ? 'FAILED' : 'COMPLETE';
    if (error) {
      streamingMsg.content = resolvedContent || `错误: ${error}`;
    } else if (!streamingMsg.content) {
      streamingMsg.content = '未收到模型响应。';
    }
    if (messageId && !messageId.startsWith('assistant-')) {
      streamingMsg.id = messageId;
    }
  }

  if (!messageId || messageId === activeStreamMessageId.value || streamingMsg) {
    activeStreamMessageId.value = null;
  }
  streamingContent.value = '';
}

function extractStreamContent(data: unknown): string {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';

  const record = data as Record<string, unknown>;
  if (typeof record.content === 'string') return record.content;
  return extractStreamContent(record.data);
}

// ==================== Regenerate ====================

async function regenerateMessage(messageId: string) {
  if (isStreaming.value) return;

  // Remove messages after and including this one
  const idx = messages.value.findIndex((m) => m.id === messageId);
  if (idx === -1) return;

  messages.value.splice(idx);

  // Add new assistant placeholder
  const newId = `assistant-${Date.now()}`;
  messages.value.push({
    id: newId,
    sessionId: activeSessionId.value!,
    role: 'ASSISTANT',
    content: '',
    status: 'STREAMING',
    createdAt: new Date().toISOString(),
  });
  streamingContent.value = '';
  activeStreamMessageId.value = newId;

  const controller = new AbortController();
  abortController.value = controller;
  let streamFinished = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  };

  const refreshIdleTimer = () => {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      if (!streamFinished && !controller.signal.aborted) {
        controller.abort();
        finalizeStreaming(newId, '响应超时，请稍后重试');
      }
    }, STREAM_IDLE_TIMEOUT_MS);
  };

  try {
    refreshIdleTimer();
    for await (const event of regenerateMessageStream(
      messageId,
      controller.signal,
    )) {
      refreshIdleTimer();
      if (event.type === 'token') {
        if (
          event.messageId &&
          event.messageId !== activeStreamMessageId.value
        ) {
          const streamingMsg = findActiveStreamingMessage();
          if (streamingMsg) {
            streamingMsg.id = event.messageId;
            activeStreamMessageId.value = event.messageId;
          }
        }
        const tokenContent = extractStreamContent(event.data);
        streamingContent.value += tokenContent;
        scrollToBottom();
      } else if (event.type === 'final') {
        streamFinished = true;
        finalizeStreaming(
          event.messageId,
          undefined,
          extractStreamContent(event.data),
        );
      } else if (event.type === 'error') {
        streamFinished = true;
        finalizeStreaming(
          event.messageId,
          (event.data as { message?: string }).message || '重新生成失败',
        );
      }
    }

    if (!streamFinished) {
      streamFinished = true;
      finalizeStreaming(newId);
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      finalizeStreaming(newId);
    } else {
      finalizeStreaming(newId, e.message || '重新生成失败');
    }
  } finally {
    clearIdleTimer();
    abortController.value = null;
  }
}

// ==================== Utilities ====================

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitMessage();
  }
}

function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    message.success('已复制');
  });
}

function findAgentKey(scopeKey: string, agentId?: string) {
  const scope = scopes.value.find((item) => item.key === scopeKey);
  if (!scope) return '';
  const resolvedAgentId =
    agentId || scope.defaultAgentId || scope.agents[0]?.id || '';
  return resolvedAgentId ? `${scope.key}:${resolvedAgentId}` : '';
}

function syncSelectedAgentFromSession(session?: ChatSession | null) {
  const sessionAgentKey = session
    ? findAgentKey(session.scopeKey, session.defaultAgentId)
    : '';
  const firstAgentKey = tenantAgents.value[0]?.key || '';
  selectedAgentKey.value =
    sessionAgentKey || selectedAgentKey.value || firstAgentKey;
}

function getSessionScopeLabel(scopeKey: string) {
  return (
    scopes.value.find((scope) => scope.key === scopeKey)?.displayName ||
    scopeKey
  );
}

function formatTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString();
}
</script>

<style scoped>
@keyframes dot-blink {
  0%,
  80%,
  100% {
    opacity: 0;
  }

  40% {
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .agent-grid,
  .example-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .chat-page {
    flex-direction: column;
    height: calc(100vh - 88px);
    min-height: 620px;
  }

  .chat-sidebar {
    width: 100%;
    height: 220px;
    max-height: 34vh;
    border-right: none;
    border-bottom: 1px solid var(--chat-sidebar-border);
  }

  .sidebar-sessions {
    min-height: 84px;
  }

  .chat-topbar {
    height: 58px;
    padding: 0 16px;
  }

  .welcome-title {
    font-size: 26px;
  }

  .agent-grid,
  .example-row {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 84%;
  }

  .chat-input-area {
    max-height: 44vh;
    padding: 8px 14px 14px;
  }

  .input-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .prompt-strip {
    width: 100%;
  }
}

.chat-page {
  --chat-bg: #f7f8fa;
  --chat-panel: #fbfcfd;
  --chat-panel-strong: #fff;
  --chat-sidebar-bg: #eef1f4;
  --chat-sidebar-border: #dde4ea;
  --chat-sidebar-hover: #e4e9ee;
  --chat-sidebar-active: #e3f1e8;
  --chat-sidebar-active-bar: #6a9b7b;
  --chat-sidebar-text: #20252a;
  --chat-sidebar-muted: #717b86;
  --chat-sidebar-time: #9aa4ad;
  --chat-main-border: #dde4ea;
  --chat-empty-bg: #fbfcfd;
  --chat-empty-border: #dfe6ec;
  --chat-empty-hover-bg: #eef5f1;
  --chat-empty-hover-border: #cbd7d2;
  --chat-bubble-user-bg: #2b6f5c;
  --chat-bubble-user-text: #fff;
  --chat-bubble-assistant-bg: transparent;
  --chat-bubble-assistant-text: #252a2f;
  --chat-avatar-bot-bg: #1f6b58;
  --chat-avatar-bot-color: #fff;
  --chat-avatar-user-bg: #e5ebf0;
  --chat-avatar-user-color: #52606b;
  --chat-thinking-bg: #f1f4f6;
  --chat-thinking-border: #d8e0e6;
  --chat-thinking-text: #56616c;
  --chat-input-bg: #fff;
  --chat-input-border: #d4dde5;
  --chat-input-shadow: rgb(27 50 65 / 12%);
  --chat-dot-color: #7a8590;
  --chat-welcome-icon-bg: #1f6b58;
  --chat-welcome-icon-color: #fff;
  --chat-welcome-subtitle: #66717c;
  --chat-link-color: #1f6b58;

  display: flex;
  height: calc(100vh - 88px);
  min-height: 520px;
  overflow: hidden;
  color: var(--chat-sidebar-text);
  background: var(--chat-bg);
}

:root.dark .chat-page,
.dark .chat-page {
  --chat-bg: #161819;
  --chat-panel: #1d2022;
  --chat-panel-strong: #24282b;
  --chat-sidebar-bg: #1f2225;
  --chat-sidebar-border: #333a3f;
  --chat-sidebar-hover: #292f33;
  --chat-sidebar-active: #20332b;
  --chat-sidebar-active-bar: #7bb28f;
  --chat-sidebar-text: #edf1f2;
  --chat-sidebar-muted: #a0aaaf;
  --chat-sidebar-time: #7b858c;
  --chat-main-border: #333a3f;
  --chat-empty-bg: #24282b;
  --chat-empty-border: #343b40;
  --chat-empty-hover-bg: #2d3438;
  --chat-empty-hover-border: #48535a;
  --chat-bubble-user-bg: #3d8d73;
  --chat-bubble-user-text: #fff;
  --chat-bubble-assistant-bg: transparent;
  --chat-bubble-assistant-text: #edf1f2;
  --chat-avatar-bot-bg: #3d8d73;
  --chat-avatar-bot-color: #fff;
  --chat-avatar-user-bg: #333a3f;
  --chat-avatar-user-color: #edf1f2;
  --chat-thinking-bg: #202427;
  --chat-thinking-border: #3a4248;
  --chat-thinking-text: #aeb8bf;
  --chat-input-bg: #24282b;
  --chat-input-border: #475159;
  --chat-input-shadow: rgb(0 0 0 / 28%);
  --chat-dot-color: #a0aaaf;
  --chat-welcome-icon-bg: #3d8d73;
  --chat-welcome-icon-color: #fff;
  --chat-welcome-subtitle: #a0aaaf;
  --chat-link-color: #87c99d;
}

/* ==================== Sidebar ==================== */

.chat-sidebar {
  display: flex;
  flex-direction: column;
  width: 296px;
  min-height: 0;
  background: var(--chat-sidebar-bg);
  border-right: 1px solid var(--chat-sidebar-border);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 18px 14px;
}

.sidebar-kicker {
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--chat-sidebar-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--chat-sidebar-text);
}

.new-session-btn {
  min-width: 88px;
  height: 34px;
  font-weight: 600;
  border-radius: 999px;
}

.sidebar-section-label {
  padding: 10px 18px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--chat-sidebar-muted);
}

.history-label {
  padding-top: 6px;
}

.sidebar-search {
  padding: 0 14px 12px;
}

.sidebar-search :deep(.ant-input-affix-wrapper) {
  background: rgb(255 255 255 / 58%);
  border-color: transparent;
  border-radius: 999px;
}

.search-icon {
  color: var(--chat-sidebar-muted);
}

.sidebar-sessions {
  flex: 1;
  min-height: 0;
  padding-bottom: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.session-group-label {
  padding: 8px 18px 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--chat-sidebar-muted);
}

.session-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 0 10px 4px;
  cursor: pointer;
  border-radius: 12px;
  transition: background 0.2s;
}

.session-item:hover {
  background: var(--chat-sidebar-hover);
}

.session-item.active {
  background: var(--chat-sidebar-active);
}

.session-item.active::before {
  position: absolute;
  left: 6px;
  width: 4px;
  height: 42%;
  content: '';
  background: var(--chat-sidebar-active-bar);
  border-radius: 999px;
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-title {
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  color: var(--chat-sidebar-text);
  white-space: nowrap;
}

.session-item-time {
  padding-left: 6px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--chat-sidebar-time);
}

.session-item-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-item-actions {
  opacity: 1;
}

.session-action-btn {
  padding: 0 4px !important;
  font-size: 12px !important;
}

/* ==================== Main Chat ==================== */

.chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  background: var(--chat-bg);
}

.chat-topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 28px;
  border-bottom: 1px solid rgb(221 228 234 / 72%);
}

.active-session-title {
  max-width: 52vw;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 700;
  color: var(--chat-sidebar-text);
  white-space: nowrap;
}

.active-session-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: var(--chat-sidebar-muted);
}

.topbar-new-btn {
  border-radius: 999px;
}

/* ==================== Messages ==================== */

.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 30px 0 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.message-row {
  max-width: 860px;
  padding: 0 28px;
  margin: 0 auto;
}

.message-bubble-wrapper {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: var(--chat-avatar-bot-color);
  background: var(--chat-avatar-bot-bg);
  border-radius: 10px;
}

.message-avatar-user {
  color: var(--chat-avatar-user-color);
  background: var(--chat-avatar-user-bg);
}

.message-bubble {
  max-width: min(72%, 680px);
  padding: 11px 16px;
  font-size: 15px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.thinking-block {
  margin-top: 10px;
}

.thinking-details {
  color: var(--chat-thinking-text);
  background: var(--chat-thinking-bg);
  border: 1px solid var(--chat-thinking-border);
  border-radius: 10px;
}

.thinking-details summary {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  cursor: pointer;
  list-style: none;
}

.thinking-details summary::-webkit-details-marker {
  display: none;
}

.thinking-details summary::before {
  width: 0;
  height: 0;
  content: '';
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid currentcolor;
  transition: transform 0.16s ease;
}

.thinking-details[open] summary::before {
  transform: rotate(90deg);
}

.thinking-details .markdown-renderer {
  padding: 0 10px 10px 23px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--chat-thinking-text);
}

.bubble-user {
  color: var(--chat-bubble-user-text);
  background: var(--chat-bubble-user-bg);
  border-radius: 18px 18px 4px;
}

.bubble-assistant {
  color: var(--chat-bubble-assistant-text);
  background: var(--chat-bubble-assistant-bg);
  border-radius: 0;
}

.message-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-start;
  max-width: 860px;
  padding: 0 28px 14px 76px;
  margin: 0 auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-row:hover .message-actions {
  opacity: 1;
}

/* Streaming cursor animation */
.streaming-cursor {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  margin-left: 2px;
}

.streaming-cursor span {
  display: inline-block;
  width: 4px;
  height: 4px;
  background: var(--chat-dot-color);
  border-radius: 50%;
  animation: dot-blink 1.4s infinite both;
}

.streaming-cursor span:nth-child(2) {
  animation-delay: 0.2s;
}

.streaming-cursor span:nth-child(3) {
  animation-delay: 0.4s;
}

/* ==================== Welcome Screen ==================== */

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100%;
  padding: 46px 28px 24px;
}

.welcome-copy {
  width: min(760px, 100%);
  text-align: center;
}

.welcome-brand {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 6px 12px 6px 6px;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 700;
  color: var(--chat-sidebar-text);
  background: rgb(255 255 255 / 65%);
  border: 1px solid var(--chat-empty-border);
  border-radius: 999px;
}

.welcome-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 12px;
  font-weight: 800;
  color: var(--chat-welcome-icon-color);
  background: var(--chat-welcome-icon-bg);
  border-radius: 12px;
}

.welcome-title {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--chat-sidebar-text);
}

.welcome-subtitle {
  max-width: 520px;
  margin: 0 auto 30px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--chat-welcome-subtitle);
}

.tone-blue {
  color: #2e6d9f;
  background: #e8f1f6;
}

.tone-amber {
  color: #996822;
  background: #f7edda;
}

.tone-green {
  color: #2f785c;
  background: #e4f1e8;
}

.tone-purple {
  color: #70539d;
  background: #eee8f8;
}

.tone-red {
  color: #a04740;
  background: #f7e8e3;
}

.tone-cyan {
  color: #26727c;
  background: #e1f0ef;
}

.example-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: min(860px, 100%);
  margin-top: 8px;
}

.example-pill {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 88px;
  padding: 14px;
  color: var(--chat-sidebar-muted);
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 70%);
  border: 1px solid var(--chat-empty-border);
  border-radius: 16px;
  transition:
    color 0.18s,
    border-color 0.18s,
    background 0.18s,
    transform 0.18s;
}

.example-pill strong {
  font-size: 14px;
  color: var(--chat-sidebar-text);
}

.example-pill span {
  font-size: 12px;
  line-height: 1.5;
}

.example-pill:hover {
  color: var(--chat-sidebar-text);
  background: var(--chat-panel-strong);
  border-color: var(--chat-empty-hover-border);
  transform: translateY(-1px);
}

/* ==================== Input Area ==================== */

.chat-input-area {
  flex-shrink: 0;
  max-height: min(46vh, 420px);
  padding: 10px 28px 22px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: linear-gradient(
    180deg,
    rgb(247 248 250 / 0%),
    var(--chat-bg) 34%
  );
}

.input-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 860px;
  margin: 10px auto 0;
}

.toolbar-agent-btn {
  display: inline-flex;
  flex-shrink: 0;
  gap: 7px;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  color: var(--chat-sidebar-muted);
  cursor: pointer;
  background: rgb(255 255 255 / 68%);
  border: 1px solid var(--chat-empty-border);
  border-radius: 999px;
  transition:
    color 0.18s,
    border-color 0.18s,
    background 0.18s;
}

.toolbar-agent-btn.active,
.toolbar-agent-btn:hover {
  color: var(--chat-sidebar-text);
  background: var(--chat-panel-strong);
  border-color: var(--chat-empty-hover-border);
}

.toolbar-agent-btn strong {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--chat-sidebar-text);
  white-space: nowrap;
}

.prompt-strip {
  display: flex;
  flex: 1;
  gap: 8px;
  justify-content: flex-start;
  min-width: 0;
  margin: 0;
  overflow-x: auto;
}

.prompt-pill {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--chat-sidebar-muted);
  cursor: pointer;
  background: rgb(255 255 255 / 58%);
  border: 1px solid transparent;
  border-radius: 999px;
}

.prompt-pill:hover:not(:disabled) {
  color: var(--chat-sidebar-text);
  background: var(--chat-panel-strong);
  border-color: var(--chat-empty-border);
}

.prompt-pill:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.chat-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 860px;
  min-height: 64px;
  padding: 13px 14px 13px 18px;
  margin: 0 auto;
  background: var(--chat-input-bg);
  border: 1px solid var(--chat-input-border);
  border-radius: 24px;
  box-shadow: 0 18px 42px var(--chat-input-shadow);
}

.chat-textarea {
  flex: 1;
  resize: none !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chat-textarea :deep(.ant-input) {
  min-height: 38px !important;
  padding: 7px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--chat-sidebar-text);
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chat-send-area {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding-bottom: 2px;
}

.send-btn {
  width: 38px;
  height: 38px;
  box-shadow: none;
}

.stop-btn {
  height: 36px;
  border-radius: 999px;
}

.agent-panel {
  max-width: 860px;
  max-height: 260px;
  padding: 14px;
  margin: 12px auto 0;
  overflow-y: auto;
  background: rgb(255 255 255 / 88%);
  border: 1px solid var(--chat-empty-border);
  border-radius: 20px;
  box-shadow: 0 18px 44px rgb(27 50 65 / 12%);
}

.agent-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.agent-panel-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--chat-sidebar-text);
}

.agent-panel-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: var(--chat-sidebar-muted);
}

.agent-panel-state {
  padding: 18px;
  font-size: 13px;
  color: var(--chat-sidebar-muted);
  text-align: center;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.agent-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 112px;
  padding: 13px;
  color: var(--chat-sidebar-text);
  text-align: left;
  cursor: pointer;
  background: var(--chat-panel);
  border: 1px solid var(--chat-empty-border);
  border-radius: 16px;
  transition:
    border-color 0.18s,
    background 0.18s,
    transform 0.18s;
}

.agent-card:hover,
.agent-card.selected {
  background: var(--chat-panel-strong);
  border-color: var(--chat-sidebar-active-bar);
  transform: translateY(-1px);
}

.agent-card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 22px;
  border-radius: 12px;
}

.agent-card-body {
  min-width: 0;
}

.agent-scope-name {
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 700;
  color: var(--chat-sidebar-muted);
  white-space: nowrap;
}

.agent-card-name {
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: 800;
  color: var(--chat-sidebar-text);
}

.agent-card-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--chat-sidebar-muted);
}

.agent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 9px;
}

.agent-tags span {
  padding: 2px 7px;
  font-size: 11px;
  color: var(--chat-sidebar-muted);
  background: rgb(0 0 0 / 4%);
  border-radius: 999px;
}
</style>
