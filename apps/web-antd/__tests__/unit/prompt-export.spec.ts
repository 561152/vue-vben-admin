import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportAsJson,
  exportAsLangChain,
  exportAsLangChainChat,
  exportAsMarkdown,
  exportAsOpenAI,
  exportPrompt,
  downloadFile,
  generatePreviewLink,
} from '#/utils/prompt-export';
import type { PromptTemplate } from '#/api/ai-studio/prompt-template';

// Mock window for Node.js environment
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'http://localhost:5666',
    },
  },
  writable: true,
});

describe('prompt-export', () => {
  const mockTemplate: Partial<PromptTemplate> = {
    name: 'Test Prompt',
    key: 'test-prompt',
    description: 'A test prompt',
    templateContent: 'Hello {{name}}, welcome to {{platform}}!',
    variables: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'User name',
      },
      {
        name: 'platform',
        type: 'string',
        required: false,
        description: 'Platform name',
        defaultValue: 'OmniReach',
      },
    ],
    category: 'test',
    tags: ['test', 'example'],
    version: 1,
    modelConfig: {
      model: 'gpt-4o',
      temperature: 0.7,
      top_p: 1,
      max_tokens: 2048,
    },
  };

  describe('exportAsJson', () => {
    it('should export template as JSON', () => {
      const json = exportAsJson(mockTemplate);
      const parsed = JSON.parse(json);

      expect(parsed.name).toBe('Test Prompt');
      expect(parsed.key).toBe('test-prompt');
      expect(parsed.exportFormat).toBe('omnireach-prompt-v1');
      expect(parsed).toHaveProperty('exportAt');
    });

    it('should pretty print by default', () => {
      const json = exportAsJson(mockTemplate);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should support compact format', () => {
      const json = exportAsJson(mockTemplate, { pretty: false });
      expect(json).not.toContain('\n');
    });
  });

  describe('exportAsLangChain', () => {
    it('should export as LangChain PromptTemplate format', () => {
      const json = exportAsLangChain(mockTemplate);
      const parsed = JSON.parse(json);

      expect(parsed._type).toBe('prompt');
      expect(parsed.input_variables).toContain('name');
      expect(parsed.input_variables).toContain('platform');
      expect(parsed.template).toBe(mockTemplate.templateContent);
      expect(parsed.template_format).toBe('f-string');
    });

    it('should include metadata', () => {
      const json = exportAsLangChain(mockTemplate);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.name).toBe('Test Prompt');
      expect(parsed.metadata.category).toBe('test');
    });
  });

  describe('exportAsLangChainChat', () => {
    it('should export as LangChain ChatPromptTemplate format', () => {
      const json = exportAsLangChainChat(mockTemplate);
      const parsed = JSON.parse(json);

      expect(parsed._type).toBe('chat_prompt');
      expect(parsed.messages).toHaveLength(1);
      expect(parsed.messages[0].role).toBe('system');
      expect(parsed.messages[0].content).toBe(mockTemplate.templateContent);
    });
  });

  describe('exportAsMarkdown', () => {
    it('should export as Markdown document', () => {
      const md = exportAsMarkdown(mockTemplate);

      expect(md).toContain('# Test Prompt');
      expect(md).toContain('A test prompt');
      expect(md).toContain('## 元信息');
      expect(md).toContain('## 变量定义');
      expect(md).toContain('## 提示词内容');
    });

    it('should include variable table', () => {
      const md = exportAsMarkdown(mockTemplate);

      expect(md).toContain('| 变量名 |');
      expect(md).toContain('| name |');
      expect(md).toContain('| platform |');
    });

    it('should include model config', () => {
      const md = exportAsMarkdown(mockTemplate);

      expect(md).toContain('## 模型配置');
      expect(md).toContain('gpt-4o');
      expect(md).toContain('Temperature');
    });
  });

  describe('exportAsOpenAI', () => {
    it('should export as OpenAI API format', () => {
      const json = exportAsOpenAI(mockTemplate);
      const parsed = JSON.parse(json);

      expect(parsed.model).toBe('gpt-4o');
      expect(parsed.messages).toHaveLength(1);
      expect(parsed.messages[0].role).toBe('system');
      expect(parsed.temperature).toBe(0.7);
      expect(parsed.max_tokens).toBe(2048);
    });
  });

  describe('exportPrompt', () => {
    it('should export as JSON by default', () => {
      const result = exportPrompt(mockTemplate, { format: 'json' });

      expect(result.filename).toBe('test-prompt.json');
      expect(result.mimeType).toBe('application/json');
      expect(JSON.parse(result.content).name).toBe('Test Prompt');
    });

    it('should export as LangChain', () => {
      const result = exportPrompt(mockTemplate, { format: 'langchain' });

      expect(result.filename).toBe('test-prompt_langchain.json');
      expect(result.mimeType).toBe('application/json');
    });

    it('should export as Markdown', () => {
      const result = exportPrompt(mockTemplate, { format: 'markdown' });

      expect(result.filename).toBe('test-prompt.md');
      expect(result.mimeType).toBe('text/markdown');
    });

    it('should sanitize filename', () => {
      const templateWithSpecialChars = {
        ...mockTemplate,
        key: 'test@prompt#123',
      };
      const result = exportPrompt(templateWithSpecialChars, { format: 'json' });

      expect(result.filename).toBe('test_prompt_123.json');
    });
  });

  describe('generatePreviewLink', () => {
    it('should generate a preview link with encoded data', async () => {
      const link = await generatePreviewLink(mockTemplate);

      expect(link).toContain('/ai-studio/prompt/preview?data=');
      expect(link).toContain('http://localhost:5666');
    });
  });
});
