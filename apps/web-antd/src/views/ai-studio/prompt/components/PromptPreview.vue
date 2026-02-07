<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  AlertOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Input,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'ant-design-vue';

import { usePromptParser } from '#/composables/usePromptParser';
import type { PromptVariable } from '#/utils/prompt-engine';

interface Props {
  template: string;
  variables: PromptVariable[];
  modelConfig?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

const props = defineProps<Props>();

// ==================== 状态 ====================

const testData = ref<Record<string, unknown>>({});
const strictMode = ref(false);
const showRaw = ref(false);
const activeTab = ref('preview');

// ==================== PromptEngine ====================

const {
  variables: extractedVars,
  render,
  detectRisks,
  validateData,
} = usePromptParser(
  computed(() => props.template),
  { autoParse: true },
);

// 合并定义的变量和提取的变量
const allVariables = computed(() => {
  const varMap = new Map<string, PromptVariable>();

  // 先添加定义的变量
  for (const v of props.variables) {
    varMap.set(v.name, v);
  }

  // 添加提取的变量（如果未定义）
  for (const v of extractedVars.value) {
    if (!varMap.has(v.name)) {
      varMap.set(v.name, v);
    }
  }

  return Array.from(varMap.values());
});

// ==================== 渲染结果 ====================

const renderResult = computed(() => {
  if (!props.template) return null;
  return render(testData.value, {
    strict: strictMode.value,
    fallback: 'keep',
  });
});

const securityRisks = computed(() => {
  return detectRisks(testData.value);
});

const validation = computed(() => {
  return validateData(testData.value);
});

const variableReplacements = computed(() => {
  if (!renderResult.value) return [];
  return Array.from(renderResult.value.replaced.entries()).map(
    ([name, info]) => ({
      name,
      ...info,
    }),
  );
});

// 使用默认值的变量
const usedDefaults = computed(() => {
  if (!renderResult.value) return [];
  const defaults: string[] = [];
  renderResult.value.replaced.forEach((info, name) => {
    if (info.isDefault) {
      defaults.push(name);
    }
  });
  return defaults;
});

const missingVariables = computed(() => {
  return renderResult.value?.missing || [];
});

// ==================== 方法 ====================

/**
 * 生成测试数据
 */
const generateTestData = () => {
  const data: Record<string, unknown> = {};
  for (const variable of allVariables.value) {
    switch (variable.type) {
      case 'string':
        data[variable.name] = variable.defaultValue || `示例${variable.name}`;
        break;
      case 'text':
        data[variable.name] =
          variable.defaultValue ||
          `这是一段示例文本，对应变量 ${variable.name}`;
        break;
      case 'number':
        data[variable.name] = variable.defaultValue || 42;
        break;
      case 'boolean':
        data[variable.name] = variable.defaultValue ?? true;
        break;
      case 'json':
        data[variable.name] = variable.defaultValue || {
          example: 'data',
          variable: variable.name,
        };
        break;
      case 'image_url':
        data[variable.name] =
          variable.defaultValue || 'https://example.com/sample-image.jpg';
        break;
    }
  }
  testData.value = data;
};

/**
 * 清除测试数据
 */
const clearTestData = () => {
  testData.value = {};
};

/**
 * 高亮显示变量替换
 */
const highlightVariables = (text: string) => {
  return text.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g,
    '<span class="highlight-variable">$&</span>',
  );
};

// ==================== 监听 ====================

// 当变量变化时，自动填充缺失的测试数据
watch(
  allVariables,
  (vars) => {
    for (const variable of vars) {
      if (!(variable.name in testData.value)) {
        // 设置默认值
        switch (variable.type) {
          case 'string':
            testData.value[variable.name] = variable.defaultValue || '';
            break;
          case 'text':
            testData.value[variable.name] = variable.defaultValue || '';
            break;
          case 'number':
            testData.value[variable.name] = variable.defaultValue || 0;
            break;
          case 'boolean':
            testData.value[variable.name] = variable.defaultValue ?? true;
            break;
          case 'json':
            testData.value[variable.name] = variable.defaultValue || {};
            break;
          case 'image_url':
            testData.value[variable.name] = variable.defaultValue || '';
            break;
        }
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <Card size="small" class="prompt-preview">
    <Tabs v-model:active-key="activeTab">
      <!-- 预览标签 -->
      <Tabs.TabPane key="preview" tab="实时预览">
        <div class="preview-container">
          <!-- 工具栏 -->
          <div class="toolbar mb-3">
            <Space>
              <Button type="primary" size="small" @click="generateTestData">
                生成测试数据
              </Button>
              <Button size="small" @click="clearTestData">清除数据</Button>
              <Switch
                v-model:checked="strictMode"
                size="small"
                checked-children="严格"
                un-checked-children="宽松"
              />
              <Switch
                v-model:checked="showRaw"
                size="small"
                checked-children="原始"
                un-checked-children="渲染"
              />
            </Space>
          </div>

          <!-- 渲染结果 -->
          <div v-if="renderResult" class="render-result">
            <!-- 警告信息 -->
            <Alert
              v-if="securityRisks.length > 0"
              type="warning"
              :message="安全风险提示"
              class="mb-3"
            >
              <template #description>
                <ul class="mb-0">
                  <li v-for="risk in securityRisks" :key="risk">{{ risk }}</li>
                </ul>
              </template>
            </Alert>

            <Alert
              v-if="missingVariables.length > 0"
              type="error"
              :message="`缺少 ${missingVariables.length} 个必需变量`"
              class="mb-3"
            >
              <template #description>
                <Space wrap>
                  <Tag v-for="v in missingVariables" :key="v" color="error">
                    {{ v }}
                  </Tag>
                </Space>
              </template>
            </Alert>

            <Alert
              v-if="usedDefaults.length > 0"
              type="info"
              class="mb-3"
              show-icon
            >
              <template #message>
                <Space>
                  <span>以下变量使用了默认值：</span>
                  <Tag
                    v-for="v in usedDefaults"
                    :key="v"
                    color="blue"
                    size="small"
                  >
                    {{ v }}
                  </Tag>
                </Space>
              </template>
            </Alert>

            <Alert
              v-if="
                validation.valid &&
                missingVariables.length === 0 &&
                usedDefaults.length === 0
              "
              type="success"
              message="所有必需变量已填充"
              class="mb-3"
              show-icon
            />

            <!-- 渲染内容 -->
            <Card size="small" title="渲染结果" class="result-card">
              <pre
                v-if="showRaw"
                class="content-raw"
                v-html="highlightVariables(renderResult.text)"
              />
              <pre v-else class="content-rendered">{{ renderResult.text }}</pre>
            </Card>

            <!-- 统计信息 -->
            <div class="stats mt-3">
              <Space>
                <Tag>Token 预估: {{ renderResult.tokenEstimate }}</Tag>
                <Tag>字符数: {{ renderResult.text.length }}</Tag>
                <Tag>替换变量: {{ renderResult.replaced.size }}</Tag>
              </Space>
            </div>
          </div>

          <Empty v-else description="请输入模板内容" />
        </div>
      </Tabs.TabPane>

      <!-- 变量输入标签 -->
      <Tabs.TabPane key="variables" tab="测试数据">
        <div class="variables-input">
          <Typography.Paragraph type="secondary" class="mb-3">
            为模板变量输入测试数据，查看渲染效果
          </Typography.Paragraph>

          <div
            v-for="variable in allVariables"
            :key="variable.name"
            class="variable-input-row"
          >
            <div class="variable-label">
              <Typography.Text strong>
                {{ variable.name }}
                <span v-if="variable.required" class="required">*</span>
              </Typography.Text>
              <Typography.Text type="secondary" class="text-xs">
                {{ variable.description }}
              </Typography.Text>
              <Tag size="small" class="ml-2">{{ variable.type }}</Tag>
            </div>

            <div class="variable-value">
              <Input.TextArea
                v-if="variable.type === 'text'"
                v-model:value="testData[variable.name]"
                :placeholder="输入 ${variable.name} 的值"
                :rows="3"
              />
              <Input.TextArea
                v-else-if="variable.type === 'json'"
                v-model:value="testData[variable.name]"
                :placeholder="输入 JSON 格式的值"
                :rows="3"
              />
              <Input
                v-else-if="variable.type === 'number'"
                v-model:value="testData[variable.name]"
                type="number"
                :placeholder="输入数字"
              />
              <Switch
                v-else-if="variable.type === 'boolean'"
                v-model:checked="testData[variable.name]"
              />
              <Input
                v-else
                v-model:value="testData[variable.name]"
                :placeholder="输入 ${variable.name} 的值"
              />
            </div>
          </div>

          <Empty
            v-if="allVariables.length === 0"
            description="暂无变量，请在模板中使用 {{变量名}} 语法添加变量"
          />
        </div>
      </Tabs.TabPane>

      <!-- 变量替换追踪 -->
      <Tabs.TabPane key="trace" tab="替换追踪">
        <div class="trace-panel">
          <Typography.Paragraph type="secondary" class="mb-3">
            查看变量替换的详细信息
          </Typography.Paragraph>

          <Collapse v-if="variableReplacements.length > 0">
            <Collapse.Panel
              v-for="[name, info] in variableReplacements"
              :key="name"
              :header="
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>{{ name }}</span>
                </Space>
              "
            >
              <div class="trace-detail">
                <div class="trace-item">
                  <Typography.Text type="secondary">原始值:</Typography.Text>
                  <pre class="trace-value">{{
                    JSON.stringify(info.original, null, 2)
                  }}</pre>
                </div>
                <div class="trace-item">
                  <Typography.Text type="secondary">替换后:</Typography.Text>
                  <pre class="trace-value">{{ info.replaced }}</pre>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>

          <div v-if="missingVariables.length > 0" class="mt-3">
            <Typography.Text type="danger">未替换的变量:</Typography.Text>
            <Space wrap class="mt-2">
              <Tag v-for="v in missingVariables" :key="v" color="error">
                <WarningOutlined />
                {{ v }}
              </Tag>
            </Space>
          </div>

          <Empty
            v-if="
              variableReplacements.length === 0 && missingVariables.length === 0
            "
            description="暂无替换记录"
          />
        </div>
      </Tabs.TabPane>
    </Tabs>
  </Card>
</template>

<style lang="less" scoped>
.prompt-preview {
  .preview-container {
    min-height: 300px;
  }

  .result-card {
    :deep(.ant-card-body) {
      padding: 12px;
    }
  }

  .content-raw,
  .content-rendered {
    margin: 0;
    padding: 12px;
    background: #f6f8fa;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    max-height: 400px;
    overflow: auto;
  }

  :deep(.highlight-variable) {
    background: #fff2f0;
    color: #cf1322;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: bold;
  }

  .variable-input-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;

    .variable-label {
      width: 150px;
      flex-shrink: 0;

      .required {
        color: #ff4d4f;
        margin-left: 4px;
      }
    }

    .variable-value {
      flex: 1;
    }
  }

  .trace-detail {
    .trace-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .trace-value {
      margin: 8px 0 0;
      padding: 8px;
      background: #f6f8fa;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
</style>
