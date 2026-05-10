export type ModelCapability = 'EMBEDDING' | 'LLM' | 'VISION';

export interface ModelPreset {
  capability: ModelCapability;
  name: string;
}

export interface ProviderPreset {
  defaultBaseUrl: string;
  models: ModelPreset[];
}

export type AiProviderKey =
  | 'ANTHROPIC'
  | 'CUSTOM'
  | 'DEEPSEEK'
  | 'MOONSHOT'
  | 'OLLAMA'
  | 'ONEAPI'
  | 'OPENAI'
  | 'QWEN';

export const PROVIDER_PRESETS: Record<AiProviderKey, ProviderPreset> = {
  OPENAI: {
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { name: 'gpt-4o', capability: 'LLM' },
      { name: 'gpt-4o-mini', capability: 'LLM' },
      { name: 'gpt-4-turbo', capability: 'LLM' },
      { name: 'gpt-4o', capability: 'VISION' },
      { name: 'text-embedding-3-large', capability: 'EMBEDDING' },
      { name: 'text-embedding-3-small', capability: 'EMBEDDING' },
    ],
  },
  ANTHROPIC: {
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      { name: 'claude-opus-4-7', capability: 'LLM' },
      { name: 'claude-sonnet-4-6', capability: 'LLM' },
      { name: 'claude-haiku-4-5', capability: 'LLM' },
      { name: 'claude-opus-4-7', capability: 'VISION' },
    ],
  },
  DEEPSEEK: {
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: [
      { name: 'deepseek-chat', capability: 'LLM' },
      { name: 'deepseek-reasoner', capability: 'LLM' },
    ],
  },
  QWEN: {
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { name: 'qwen-max', capability: 'LLM' },
      { name: 'qwen-plus', capability: 'LLM' },
      { name: 'qwen-vl-max', capability: 'VISION' },
      { name: 'qwen-vl-plus', capability: 'VISION' },
      { name: 'text-embedding-v2', capability: 'EMBEDDING' },
    ],
  },
  MOONSHOT: {
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { name: 'moonshot-v1-8k', capability: 'LLM' },
      { name: 'moonshot-v1-32k', capability: 'LLM' },
      { name: 'moonshot-v1-128k', capability: 'LLM' },
    ],
  },
  OLLAMA: {
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: [
      { name: 'llama3.1', capability: 'LLM' },
      { name: 'qwen2.5', capability: 'LLM' },
      { name: 'nomic-embed-text', capability: 'EMBEDDING' },
    ],
  },
  ONEAPI: {
    defaultBaseUrl: 'http://localhost:3001/v1',
    models: [
      { name: 'gpt-4o', capability: 'LLM' },
      { name: 'qwen-vl-max', capability: 'VISION' },
      { name: 'text-embedding-3-large', capability: 'EMBEDDING' },
    ],
  },
  CUSTOM: {
    defaultBaseUrl: '',
    models: [],
  },
};
