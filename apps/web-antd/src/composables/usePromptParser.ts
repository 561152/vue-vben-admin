import { computed, ref, watch, type Ref } from 'vue';

import {
  PromptEngine,
  type ParseResult,
  type PromptVariable,
  type RenderOptions,
  type RenderResult,
} from '#/utils/prompt-engine';

export interface UsePromptParserOptions {
  autoParse?: boolean;
  onError?: (errors: ParseResult['errors']) => void;
  onWarning?: (warnings: ParseResult['warnings']) => void;
}

/**
 * Vue Composable: Prompt 解析器
 * 提供响应式的 Prompt 解析和渲染能力
 */
export function usePromptParser(
  template: Ref<string> | string,
  options: UsePromptParserOptions = {},
) {
  const { autoParse = true, onError, onWarning } = options;

  // 模板引用
  const templateRef = ref(template);

  // PromptEngine 实例（延迟创建）
  const engine = computed(() => new PromptEngine(templateRef.value));

  // 解析结果（缓存）
  const parseResult = ref<ParseResult>({
    variables: [],
    errors: [],
    warnings: [],
  });

  // 计算属性
  const variables = computed(() => parseResult.value.variables);
  const errors = computed(() => parseResult.value.errors);
  const warnings = computed(() => parseResult.value.warnings);
  const hasErrors = computed(() => parseResult.value.errors.length > 0);
  const hasWarnings = computed(() => parseResult.value.warnings.length > 0);
  const isValid = computed(() => !hasErrors.value);

  // 必需变量列表
  const requiredVariables = computed(() =>
    variables.value.filter((v) => v.required),
  );

  // 可选变量列表
  const optionalVariables = computed(() =>
    variables.value.filter((v) => !v.required),
  );

  // 变量名列表（快速访问）
  const variableNames = computed(() => variables.value.map((v) => v.name));

  // 执行解析
  const parse = (): ParseResult => {
    const result = engine.value.parse();
    parseResult.value = result;

    if (result.errors.length > 0 && onError) {
      onError(result.errors);
    }

    if (result.warnings.length > 0 && onWarning) {
      onWarning(result.warnings);
    }

    return result;
  };

  // 渲染模板（支持默认值自动填充）
  const render = (
    data: Record<string, unknown>,
    renderOptions?: RenderOptions,
  ): RenderResult => {
    return engine.value.render(data, {
      autoFillDefaults: true,
      ...renderOptions,
    });
  };

  // 渲染模板（带默认值追踪）
  const renderWithDefaults = (
    data: Record<string, unknown>,
    renderOptions?: Omit<RenderOptions, 'autoFillDefaults'>,
  ): RenderResult & {
    usedDefaults: string[];
    filledData: Record<string, unknown>;
  } => {
    const result = engine.value.render(data, {
      autoFillDefaults: true,
      ...renderOptions,
    });

    const usedDefaults: string[] = [];
    result.replaced.forEach((info, name) => {
      if (info.isDefault) {
        usedDefaults.push(name);
      }
    });

    // 构建填充后的完整数据
    const filledData = { ...data };
    variables.value.forEach((v) => {
      if (filledData[v.name] === undefined) {
        if (v.defaultValue !== undefined) {
          filledData[v.name] = v.defaultValue;
        }
      }
    });

    return {
      ...result,
      usedDefaults,
      filledData,
    };
  };

  // 语法高亮
  const highlight = (): string => {
    return engine.value.highlight();
  };

  // 检测安全风险
  const detectRisks = (data: Record<string, unknown>): string[] => {
    return engine.value.detectSecurityRisks(data);
  };

  // 获取变量类型
  const getVariableType = (
    name: string,
  ): PromptVariable['type'] | undefined => {
    return variables.value.find((v) => v.name === name)?.type;
  };

  // 检查变量是否存在
  const hasVariable = (name: string): boolean => {
    return variables.value.some((v) => v.name === name);
  };

  // 自动解析监听
  if (autoParse) {
    watch(
      templateRef,
      () => {
        parse();
      },
      { immediate: true },
    );
  }

  // 创建测试数据（默认值）
  const createTestData = (): Record<string, unknown> => {
    const data: Record<string, unknown> = {};
    for (const variable of variables.value) {
      switch (variable.type) {
        case 'string':
          data[variable.name] = variable.defaultValue ?? `示例${variable.name}`;
          break;
        case 'text':
          data[variable.name] =
            variable.defaultValue ??
            `这是一段示例文本内容，对应变量 ${variable.name}`;
          break;
        case 'number':
          data[variable.name] = variable.defaultValue ?? 0;
          break;
        case 'boolean':
          data[variable.name] = variable.defaultValue ?? true;
          break;
        case 'json':
          data[variable.name] = variable.defaultValue ?? { example: 'data' };
          break;
        case 'image_url':
          data[variable.name] =
            variable.defaultValue ?? 'https://example.com/image.jpg';
          break;
        default:
          data[variable.name] = variable.defaultValue ?? '';
      }
    }
    return data;
  };

  // 验证数据是否包含所有必需变量
  const validateData = (
    data: Record<string, unknown>,
  ): { valid: boolean; missing: string[] } => {
    const missing = requiredVariables.value
      .filter((v) => data[v.name] === undefined || data[v.name] === null)
      .map((v) => v.name);
    return { valid: missing.length === 0, missing };
  };

  return {
    // 响应式数据
    template: templateRef,
    variables,
    errors,
    warnings,
    hasErrors,
    hasWarnings,
    isValid,
    requiredVariables,
    optionalVariables,
    variableNames,

    // 方法
    parse,
    render,
    renderWithDefaults,
    highlight,
    detectRisks,
    getVariableType,
    hasVariable,
    createTestData,
    validateData,
  };
}

export default usePromptParser;
