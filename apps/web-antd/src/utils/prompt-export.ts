/**
 * 提示词导出工具
 * 支持 JSON、LangChain 等格式导出
 */

import type { PromptTemplate } from '#/api/ai-studio/prompt-template';

export interface ExportOptions {
  format: 'json' | 'langchain' | 'markdown';
  includeMetadata?: boolean;
  pretty?: boolean;
}

/**
 * 导出为 JSON 格式
 */
export function exportAsJson(
  template: Partial<PromptTemplate>,
  options: { pretty?: boolean } = {},
): string {
  const { pretty = true } = options;

  const exportData = {
    name: template.name,
    key: template.key,
    description: template.description,
    templateContent: template.templateContent,
    variables: template.variables,
    defaultValues: template.defaultValues,
    modelConfig: template.modelConfig,
    category: template.category,
    tags: template.tags,
    version: template.version,
    exportAt: new Date().toISOString(),
    exportFormat: 'omnireach-prompt-v1',
  };

  return JSON.stringify(exportData, null, pretty ? 2 : undefined);
}

/**
 * 导出为 LangChain PromptTemplate 格式
 */
export function exportAsLangChain(template: Partial<PromptTemplate>): string {
  const variableNames =
    template.variables?.map((v) => v.name) ||
    extractVariablesFromTemplate(template.templateContent || '');

  const langChainTemplate = {
    _type: 'prompt',
    input_variables: variableNames,
    template: template.templateContent,
    template_format: 'f-string',
    // LangChain 额外配置
    metadata: {
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      version: template.version,
    },
  };

  return JSON.stringify(langChainTemplate, null, 2);
}

/**
 * 导出为 LangChain ChatPromptTemplate 格式（消息列表）
 */
export function exportAsLangChainChat(
  template: Partial<PromptTemplate>,
): string {
  const variableNames =
    template.variables?.map((v) => v.name) ||
    extractVariablesFromTemplate(template.templateContent || '');

  const chatTemplate = {
    _type: 'chat_prompt',
    input_variables: variableNames,
    messages: [
      {
        role: 'system',
        content: template.templateContent,
      },
    ],
    metadata: {
      name: template.name,
      description: template.description,
    },
  };

  return JSON.stringify(chatTemplate, null, 2);
}

/**
 * 导出为 Markdown 文档
 */
export function exportAsMarkdown(template: Partial<PromptTemplate>): string {
  const lines: string[] = [];

  // 标题
  lines.push(`# ${template.name}`);
  lines.push('');

  // 描述
  if (template.description) {
    lines.push(`> ${template.description}`);
    lines.push('');
  }

  // 元信息
  lines.push('## 元信息');
  lines.push('');
  lines.push(`- **标识**: \`${template.key}\``);
  lines.push(`- **分类**: ${template.category || '未分类'}`);
  lines.push(`- **版本**: v${template.version || 1}`);
  if (template.tags?.length) {
    lines.push(`- **标签**: ${template.tags.join(', ')}`);
  }
  lines.push('');

  // 变量定义
  if (template.variables?.length) {
    lines.push('## 变量定义');
    lines.push('');
    lines.push('| 变量名 | 类型 | 必填 | 描述 | 默认值 |');
    lines.push('|--------|------|------|------|--------|');
    for (const v of template.variables) {
      const required = v.required ? '是' : '否';
      const defaultValue = v.defaultValue
        ? String(v.defaultValue).substring(0, 20)
        : '-';
      lines.push(
        `| ${v.name} | ${v.type} | ${required} | ${v.description || '-'} | ${defaultValue} |`,
      );
    }
    lines.push('');
  }

  // 提示词内容
  lines.push('## 提示词内容');
  lines.push('');
  lines.push('```');
  lines.push(template.templateContent || '');
  lines.push('```');
  lines.push('');

  // 模型配置
  if (template.modelConfig) {
    lines.push('## 模型配置');
    lines.push('');
    lines.push(`- **模型**: ${template.modelConfig.model}`);
    lines.push(`- **Temperature**: ${template.modelConfig.temperature}`);
    lines.push(`- **Top P**: ${template.modelConfig.top_p}`);
    lines.push(`- **Max Tokens**: ${template.modelConfig.max_tokens}`);
    lines.push('');
  }

  // 导出信息
  lines.push('---');
  lines.push('');
  lines.push(`*导出时间: ${new Date().toLocaleString()}*`);
  lines.push(`*导出工具: OmniReach AI Studio*`);

  return lines.join('\n');
}

/**
 * 导出为 OpenAI API 格式
 */
export function exportAsOpenAI(template: Partial<PromptTemplate>): string {
  const messages = [
    {
      role: 'system',
      content: template.templateContent,
    },
  ];

  const openAIFormat = {
    model: template.modelConfig?.model || 'gpt-4o',
    messages,
    temperature: template.modelConfig?.temperature ?? 0.7,
    top_p: template.modelConfig?.top_p ?? 1,
    max_tokens: template.modelConfig?.max_tokens ?? 2048,
  };

  return JSON.stringify(openAIFormat, null, 2);
}

/**
 * 执行导出
 */
export function exportPrompt(
  template: Partial<PromptTemplate>,
  options: ExportOptions,
): { content: string; filename: string; mimeType: string } {
  const { format } = options;

  let content: string;
  let filename: string;
  let mimeType: string;

  const safeName = (template.key || template.name || 'prompt').replace(
    /[^a-z0-9_-]/gi,
    '_',
  );

  switch (format) {
    case 'json':
      content = exportAsJson(template, { pretty: options.pretty });
      filename = `${safeName}.json`;
      mimeType = 'application/json';
      break;

    case 'langchain':
      content = exportAsLangChain(template);
      filename = `${safeName}_langchain.json`;
      mimeType = 'application/json';
      break;

    case 'markdown':
      content = exportAsMarkdown(template);
      filename = `${safeName}.md`;
      mimeType = 'text/markdown';
      break;

    default:
      content = exportAsJson(template);
      filename = `${safeName}.json`;
      mimeType = 'application/json';
  }

  return { content, filename, mimeType };
}

/**
 * 下载文件
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 从模板内容提取变量
 */
function extractVariablesFromTemplate(template: string): string[] {
  const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  return matches;
}

/**
 * 生成临时预览链接
 */
export async function generatePreviewLink(
  template: Partial<PromptTemplate>,
): Promise<string> {
  // 创建一个临时的 base64 编码的分享数据
  const shareData = {
    ...template,
    _preview: true,
    _createdAt: Date.now(),
  };

  const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));

  // 构建预览 URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/ai-studio/prompt/preview?data=${encoded}`;
}

export default {
  exportAsJson,
  exportAsLangChain,
  exportAsLangChainChat,
  exportAsMarkdown,
  exportAsOpenAI,
  exportPrompt,
  downloadFile,
  generatePreviewLink,
};
