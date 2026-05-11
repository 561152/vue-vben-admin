import { requestClient } from '../request';
import { useAccessStore } from '@vben/stores';
import { useAppConfig } from '@vben/hooks';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// ==================== Types ====================

export interface ChatSession {
  id: string;
  title: string;
  scopeKey: string;
  defaultAgentId?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  agentId?: string;
  status: 'STREAMING' | 'COMPLETE' | 'FAILED';
  createdAt: string;
}

export interface ChatMessageEvent {
  type: 'token' | 'final' | 'error';
  messageId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ScopeInfo {
  key: string;
  displayName: string;
  description?: string;
  icon?: string;
  defaultAgentId?: string;
  agents: Array<{
    id: string;
    displayName: string;
    description: string;
    icon: string;
    category: string;
    capabilities?: string[];
  }>;
}

// ==================== Non-streaming API ====================

export async function listScopes(): Promise<{ scopes: ScopeInfo[] }> {
  return requestClient.get('/ai-chat/scopes');
}

export async function listSessions(
  scopeKey?: string,
  options: { page?: number; size?: number } = {},
): Promise<{ items: ChatSession[]; total: number }> {
  const params = {
    ...options,
    ...(scopeKey ? { scope: scopeKey } : {}),
  };
  return requestClient.get('/ai-chat/sessions', { params });
}

export async function createSession(data: {
  scopeKey: string;
  title?: string;
  agentId?: string;
}): Promise<{ session: ChatSession }> {
  return requestClient.post('/ai-chat/sessions', data);
}

export async function getSession(
  sessionId: string,
): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
  return requestClient.get(`/ai-chat/sessions/${sessionId}`);
}

export async function updateSession(
  sessionId: string,
  data: { defaultAgentId?: string; title?: string },
): Promise<{ session: ChatSession | null }> {
  return requestClient.request(`/ai-chat/sessions/${sessionId}`, {
    data,
    method: 'PATCH',
  });
}

export async function deleteSession(
  sessionId: string,
): Promise<{ success: boolean }> {
  return requestClient.delete(`/ai-chat/sessions/${sessionId}`);
}

export async function getMessages(
  sessionId: string,
  limit?: number,
): Promise<{ messages: ChatMessage[] }> {
  const params = limit ? { limit } : {};
  return requestClient.get(`/ai-chat/sessions/${sessionId}/messages`, {
    params,
  });
}

export async function stopMessage(
  messageId: string,
): Promise<{ success: boolean }> {
  return requestClient.post(`/ai-chat/messages/${messageId}/stop`);
}

// ==================== SSE Streaming API ====================

/**
 * Send a message and receive streaming response via POST+SSE.
 * Uses fetch + ReadableStream since EventSource only supports GET.
 */
export async function* sendMessageStream(
  sessionId: string,
  body: { content: string },
  signal?: AbortSignal,
): AsyncGenerator<ChatMessageEvent> {
  const token = useAccessStore().accessToken;
  const url = `${apiURL}/ai-chat/sessions/${sessionId}/messages/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Stream request failed: ${response.status} ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      // Split by double newline (SSE event boundary)
      const parts = buffer.split('\n\n');
      // Keep the last incomplete part in buffer
      buffer = parts.pop() || '';

      for (const part of parts) {
        const event = parseSSEEvent(part);
        if (event) {
          yield event;
        }
      }
    }

    buffer += decoder.decode();
    buffer = buffer.replace(/\r\n/g, '\n');

    // Process remaining buffer
    if (buffer.trim()) {
      const event = parseSSEEvent(buffer);
      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Regenerate a message response via POST+SSE.
 */
export async function* regenerateMessageStream(
  messageId: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatMessageEvent> {
  const token = useAccessStore().accessToken;
  const url = `${apiURL}/ai-chat/messages/${messageId}/regenerate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Regenerate request failed: ${response.status} ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const event = parseSSEEvent(part);
        if (event) {
          yield event;
        }
      }
    }

    buffer += decoder.decode();
    buffer = buffer.replace(/\r\n/g, '\n');

    if (buffer.trim()) {
      const event = parseSSEEvent(buffer);
      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ==================== SSE Parsing ====================

function parseSSEEvent(raw: string): ChatMessageEvent | null {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let eventType = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    } else if (line.startsWith('id:')) {
      // ignore
    }
  }

  const dataStr = dataLines.join('\n');
  if (!dataStr) return null;

  try {
    const parsed = parseJsonValue(dataStr);
    const envelope = normalizeSSEEnvelope(parsed);
    if (!envelope) return null;

    const payload = parseJsonValue(envelope.data);
    return {
      type: (envelope.type || eventType) as ChatMessageEvent['type'],
      messageId: toStringValue(envelope.messageId),
      data: isRecord(payload) ? payload : {},
      timestamp: toStringValue(envelope.timestamp) || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeSSEEnvelope(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonValue(value);
  if (!isRecord(parsed)) return null;

  const nested = parseJsonValue(parsed.data);
  if (
    isRecord(nested) &&
    ('messageId' in nested || 'timestamp' in nested || 'data' in nested) &&
    !('messageId' in parsed)
  ) {
    return {
      ...nested,
      type: parsed.type || nested.type,
    };
  }

  return {
    ...parsed,
    data: nested,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
