/**
 * Prompt 解析引擎
 * 统一处理变量提取、类型推断、语法高亮、渲染
 */

export interface PromptVariable {
  name: string;
  type: 'string' | 'text' | 'json' | 'image_url' | 'number' | 'boolean';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  inferred: boolean; // 是否自动推断
}

export interface ParseResult {
  variables: PromptVariable[];
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  message: string;
  position: { start: number; end: number };
  type: 'syntax' | 'reference';
}

export interface ParseWarning {
  message: string;
  variable?: string;
  suggestion?: string;
}

export interface RenderOptions {
  strict?: boolean; // 严格模式：缺少变量时报错
  fallback?: 'empty' | 'keep' | 'default'; // 缺失变量处理方式
  defaultValues?: Record<string, unknown>; // 默认值配置
  autoFillDefaults?: boolean; // 是否自动使用变量定义的默认值
}

export interface RenderResult {
  text: string;
  replaced: Map<
    string,
    { original: unknown; replaced: string; isDefault?: boolean }
  >;
  missing: string[];
  tokenEstimate: number;
}

// ==================== 核心正则表达式 ====================

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;

// 类型推断规则
const TYPE_PATTERNS: Array<{
  pattern: RegExp;
  type: PromptVariable['type'];
  confidence: number;
}> = [
  {
    pattern: /image|url|picture|photo|screenshot/i,
    type: 'image_url',
    confidence: 0.8,
  },
  {
    pattern: /json|object|data|schema/i,
    type: 'json',
    confidence: 0.7,
  },
  {
    pattern: /content|text|description|prompt|instruction/i,
    type: 'text',
    confidence: 0.6,
  },
  {
    pattern: /count|number|age|score|rating|temperature/i,
    type: 'number',
    confidence: 0.8,
  },
  {
    pattern: /enabled|active|flag|boolean|is_/i,
    type: 'boolean',
    confidence: 0.7,
  },
];

// ==================== 核心类 ====================

export class PromptEngine {
  private template: string;

  private parsed: ParseResult | null = null;

  constructor(template: string) {
    this.template = template;
  }

  /**
   * 解析模板，提取变量
   */
  parse(): ParseResult {
    if (this.parsed) return this.parsed;

    const variables: PromptVariable[] = [];
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];
    const seen = new Set<string>();

    let match;
    while ((match = VARIABLE_REGEX.exec(this.template)) !== null) {
      const fullMatch = match[0];
      const varName = match[1];
      const start = match.index;
      const end = start + fullMatch.length;

      // 检查变量名合法性
      if (!this.isValidVariableName(varName)) {
        errors.push({
          message: `变量名 "${varName}" 包含非法字符`,
          position: { start, end },
          type: 'syntax',
        });
        continue;
      }

      if (seen.has(varName)) continue;
      seen.add(varName);

      // 推断类型
      const inferred = this.inferVariableType(varName, this.template, start);

      variables.push({
        name: varName,
        type: inferred.type,
        required: !this.hasDefaultValue(varName),
        description: inferred.description,
        inferred: inferred.inferred,
      });

      // 检查嵌套路径（如 user.name）
      if (varName.includes('.')) {
        warnings.push({
          message: `变量 "${varName}" 使用嵌套路径，确保数据结构匹配`,
          variable: varName,
          suggestion: '建议添加默认值处理',
        });
      }
    }

    // 重置正则
    VARIABLE_REGEX.lastIndex = 0;

    this.parsed = { variables, errors, warnings };
    return this.parsed;
  }

  /**
   * 更新模板并重新解析
   */
  setTemplate(template: string): void {
    this.template = template;
    this.parsed = null;
  }

  /**
   * 渲染模板
   */
  render(
    data: Record<string, unknown>,
    options: RenderOptions = {},
  ): RenderResult {
    const {
      strict = false,
      fallback = 'keep',
      defaultValues = {},
      autoFillDefaults = true,
    } = options;
    const replaced = new Map<
      string,
      { original: unknown; replaced: string; isDefault?: boolean }
    >();
    const missing: string[] = [];

    let text = this.template;
    const parseResult = this.parse();

    // 按变量名长度降序，避免短变量名干扰长变量名
    const sortedVars = [...parseResult.variables].sort(
      (a, b) => b.name.length - a.name.length,
    );

    for (const variable of sortedVars) {
      const regex = new RegExp(
        `\\{\\{\\s*${this.escapeRegex(variable.name)}\\s*\\}\\}`,
        'g',
      );
      let value = this.getNestedValue(data, variable.name);
      let isDefaultValue = false;

      // 如果值为空且启用自动填充，尝试使用默认值
      if ((value === undefined || value === null) && autoFillDefaults) {
        // 优先级：1. 传入的 defaultValues  2. 变量定义的 defaultValue
        if (defaultValues[variable.name] !== undefined) {
          value = defaultValues[variable.name];
          isDefaultValue = true;
        } else if (variable.defaultValue !== undefined) {
          value = variable.defaultValue;
          isDefaultValue = true;
        }
      }

      if (value === undefined || value === null) {
        missing.push(variable.name);
        if (strict) {
          throw new Error(`缺少必需变量: ${variable.name}`);
        }

        // 应用 fallback 策略
        const replacement = this.applyFallback(fallback, variable);
        text = text.replace(regex, replacement);
      } else {
        const strValue = this.formatValue(value, variable.type);
        replaced.set(variable.name, {
          original: value,
          replaced: strValue,
          isDefault: isDefaultValue,
        });
        text = text.replace(regex, strValue);
      }
    }

    return {
      text,
      replaced,
      missing,
      tokenEstimate: this.estimateTokens(text),
    };
  }

  /**
   * 语法高亮（生成 HTML）
   */
  highlight(): string {
    return this.template.replace(
      VARIABLE_REGEX,
      (match, varName) =>
        `<span class="prompt-variable" data-var="${varName}">${match}</span>`,
    );
  }

  /**
   * 检测安全风险（Prompt Injection）
   */
  detectSecurityRisks(data: Record<string, unknown>): string[] {
    const risks: string[] = [];
    const dangerousPatterns = [
      /ignore\s+previous\s+instructions?/i,
      /disregard\s+(all|previous)\s+prompts?/i,
      /you\s+are\s+now\s+/i,
      /new\s+role\s*:/i,
      /DAN\s*\(|do\s+anything\s+now/i,
      /system\s*:\s*you\s+/i,
    ];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            risks.push(`变量 "${key}" 可能包含注入攻击内容`);
          }
        }
      }
    }

    return risks;
  }

  /**
   * 获取模板
   */
  getTemplate(): string {
    return this.template;
  }

  // ==================== 私有方法 ====================

  private isValidVariableName(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(name);
  }

  private inferVariableType(
    name: string,
    template: string,
    position: number,
  ): { type: PromptVariable['type']; inferred: boolean; description?: string } {
    // 根据变量名推断
    for (const { pattern, type } of TYPE_PATTERNS) {
      if (pattern.test(name)) {
        return { type, inferred: true };
      }
    }

    // 根据上下文推断
    const contextStart = Math.max(0, position - 100);
    const contextEnd = Math.min(template.length, position + 100);
    const context = template.slice(contextStart, contextEnd).toLowerCase();

    if (context.includes('image') || context.includes('url')) {
      return { type: 'image_url', inferred: true };
    }

    return { type: 'string', inferred: true };
  }

  private hasDefaultValue(_varName: string): boolean {
    // 检查是否有默认值配置
    return false;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) return undefined;
    return path.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  private formatValue(value: unknown, type: string): string {
    if (type === 'json' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  private applyFallback(
    fallback: RenderOptions['fallback'],
    variable: PromptVariable,
  ): string {
    if (fallback === 'default' && variable.defaultValue !== undefined) {
      return String(variable.defaultValue);
    }
    if (fallback === 'empty') {
      return '';
    }
    return `{{${variable.name}}}`; // keep
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private estimateTokens(text: string): number {
    // 简单估算：中文字符 1:1，英文单词 1:1.5
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return Math.ceil(chineseChars + englishWords * 1.5);
  }
}

// ==================== 辅助函数 ====================

/**
 * 快速解析模板
 */
export function parsePrompt(template: string): ParseResult {
  const engine = new PromptEngine(template);
  return engine.parse();
}

/**
 * 快速渲染模板
 */
export function renderPrompt(
  template: string,
  data: Record<string, unknown>,
  options?: RenderOptions,
): RenderResult {
  const engine = new PromptEngine(template);
  return engine.render(data, options);
}

/**
 * 批量提取变量
 */
export function extractVariables(template: string): string[] {
  const engine = new PromptEngine(template);
  return engine.parse().variables.map((v) => v.name);
}

export default PromptEngine;
