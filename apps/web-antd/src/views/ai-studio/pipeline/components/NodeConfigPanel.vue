<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Divider,
  Button,
  Collapse,
  Tag,
  Tooltip,
  Space,
  Alert,
  AutoComplete,
} from 'ant-design-vue';
import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  CodeOutlined,
} from '@ant-design/icons-vue';

interface InputMapping {
  [key: string]: string;
}

interface OutputMapping {
  [key: string]: string;
}

interface NodeData {
  stepKey: string;
  name: string;
  type: string;
  componentRef?: {
    type: string;
    key: string;
  };
  config?: Record<string, any>;
  inputMapping?: InputMapping;
  outputMapping?: OutputMapping;
  condition?: string;
  dependencies?: string[];
}

interface ComponentSchema {
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  outputSchema?: {
    type: string;
    properties?: Record<string, any>;
  };
  configSchema?: {
    type: string;
    properties?: Record<string, any>;
  };
}

interface Props {
  node: NodeData | null;
  componentSchema?: ComponentSchema;
  availableSteps: Array<{ stepKey: string; name: string; outputSchema?: any }>;
}

interface Emits {
  (e: 'update', node: NodeData): void;
  (e: 'delete'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formState = ref<NodeData>({
  stepKey: '',
  name: '',
  type: 'tool',
});

const inputMappings = ref<Array<{ key: string; value: string }>>([]);
const outputMappings = ref<Array<{ key: string; value: string }>>([]);
const activeKeys = ref(['basic', 'input', 'output', 'config', 'condition']);

// 模板语法提示
const templateSuggestions = computed(() => {
  const suggestions: string[] = ['$.inputs.', '$.tenantId', '$.executionId'];

  // 添加上游步骤的输出引用
  props.availableSteps.forEach((step) => {
    if (step.stepKey !== formState.value.stepKey) {
      suggestions.push(`$.outputs.${step.stepKey}.`);
      suggestions.push(`{{steps.${step.stepKey}.data}}`);
      suggestions.push(`{{steps.${step.stepKey}.data.}}`);
    }
  });

  // 添加全局变量引用
  suggestions.push('{{global.studentId}}');
  suggestions.push('{{global.tenantId}}');
  suggestions.push('{{global.subject}}');

  return suggestions;
});

// 获取上游步骤选项
const upstreamStepOptions = computed(() => {
  return props.availableSteps
    .filter((step) => step.stepKey !== formState.value.stepKey)
    .map((step) => ({
      label: `${step.name} (${step.stepKey})`,
      value: step.stepKey,
    }));
});

// 从 inputSchema 获取输入字段
const inputFields = computed(() => {
  const schema = props.componentSchema?.inputSchema;
  if (!schema?.properties) return [];

  return Object.entries(schema.properties).map(
    ([key, prop]: [string, any]) => ({
      key,
      type: prop.type,
      description: prop.description || '',
      required: schema.required?.includes(key) || false,
      enum: prop.enum,
      default: prop.default,
    }),
  );
});

// 从 outputSchema 获取输出字段
const outputFields = computed(() => {
  const schema = props.componentSchema?.outputSchema;
  if (!schema?.properties) return [];

  return Object.entries(schema.properties).map(
    ([key, prop]: [string, any]) => ({
      key,
      type: prop.type,
      description: prop.description || '',
    }),
  );
});

// 从 configSchema 获取配置字段
const configFields = computed(() => {
  const schema = props.componentSchema?.configSchema;
  if (!schema?.properties) return [];

  return Object.entries(schema.properties).map(
    ([key, prop]: [string, any]) => ({
      key,
      type: prop.type,
      description: prop.description || '',
      enum: prop.enum,
      default: prop.default,
    }),
  );
});

// 初始化表单数据
const initForm = () => {
  if (!props.node) return;

  formState.value = {
    ...props.node,
    config: { ...props.node.config },
  };

  // 转换 inputMapping 为数组
  inputMappings.value = props.node.inputMapping
    ? Object.entries(props.node.inputMapping).map(([key, value]) => ({
        key,
        value,
      }))
    : [];

  // 转换 outputMapping 为数组
  outputMappings.value = props.node.outputMapping
    ? Object.entries(props.node.outputMapping).map(([key, value]) => ({
        key,
        value,
      }))
    : [];

  // 如果有 inputSchema 但没有映射，自动添加
  if (inputFields.value.length > 0 && inputMappings.value.length === 0) {
    inputFields.value.forEach((field) => {
      inputMappings.value.push({
        key: field.key,
        value: field.default !== undefined ? JSON.stringify(field.default) : '',
      });
    });
  }
};

// 添加输入映射
const addInputMapping = () => {
  inputMappings.value.push({ key: '', value: '' });
};

// 移除输入映射
const removeInputMapping = (index: number) => {
  inputMappings.value.splice(index, 1);
};

// 添加输出映射
const addOutputMapping = () => {
  outputMappings.value.push({ key: '', value: '' });
};

// 移除输出映射
const removeOutputMapping = (index: number) => {
  outputMappings.value.splice(index, 1);
};

// 保存配置
const handleSave = () => {
  // 转换映射数组为对象
  const inputMapping: InputMapping = {};
  inputMappings.value.forEach((m) => {
    if (m.key) inputMapping[m.key] = m.value;
  });

  const outputMapping: OutputMapping = {};
  outputMappings.value.forEach((m) => {
    if (m.key) outputMapping[m.key] = m.value;
  });

  emit('update', {
    ...formState.value,
    inputMapping,
    outputMapping,
  });
};

// 删除节点
const handleDelete = () => {
  emit('delete');
};

// 插入模板
const insertTemplate = (field: { key: string }, template: string) => {
  const mapping = inputMappings.value.find((m) => m.key === field.key);
  if (mapping) {
    mapping.value = template;
  }
};

// 渲染配置字段
const getConfigFieldComponent = (field: any) => {
  if (field.enum) return 'select';
  if (field.type === 'boolean') return 'switch';
  if (field.type === 'number' || field.type === 'integer') return 'number';
  return 'input';
};

watch(() => props.node, initForm, { immediate: true });
</script>

<template>
  <div class="node-config-panel" v-if="node">
    <div class="panel-header">
      <div class="header-title">
        <span>节点配置</span>
        <Tag v-if="formState.type" color="blue">{{ formState.type }}</Tag>
      </div>
      <Space>
        <Button size="small" type="text" danger @click="handleDelete">
          <template #icon><DeleteOutlined /></template>
        </Button>
      </Space>
    </div>

    <div class="panel-content">
      <Collapse v-model:activeKey="activeKeys" ghost>
        <!-- 基本信息 -->
        <Collapse.Panel key="basic" header="基本信息">
          <Form layout="vertical" :model="formState" size="small">
            <Form.Item label="步骤标识" required>
              <Input v-model:value="formState.stepKey" disabled />
              <div class="form-hint">步骤的唯一标识，不可修改</div>
            </Form.Item>

            <Form.Item label="步骤名称" required>
              <Input
                v-model:value="formState.name"
                placeholder="输入步骤名称"
              />
            </Form.Item>

            <Form.Item label="组件类型">
              <Select v-model:value="formState.type" disabled>
                <Select.Option value="llm">LLM 模型</Select.Option>
                <Select.Option value="ocr">OCR 识别</Select.Option>
                <Select.Option value="tool">业务工具</Select.Option>
                <Select.Option value="retrieval">向量检索</Select.Option>
                <Select.Option value="transform">数据转换</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item v-if="formState.componentRef" label="绑定组件">
              <Input :value="formState.componentRef.key" disabled />
            </Form.Item>

            <Form.Item label="依赖步骤">
              <Select
                v-model:value="formState.dependencies"
                mode="multiple"
                placeholder="选择前置依赖步骤"
                :options="upstreamStepOptions"
              />
              <div class="form-hint">
                <LinkOutlined /> 本步骤将在所选步骤完成后执行
              </div>
            </Form.Item>
          </Form>
        </Collapse.Panel>

        <!-- 输入映射 -->
        <Collapse.Panel key="input" header="输入映射">
          <Alert type="info" show-icon style="margin-bottom: 12px">
            <template #message>
              使用 <code>$.inputs.xxx</code> 引用流程输入，
              <code>$.outputs.stepKey.data</code> 引用上游输出
            </template>
          </Alert>

          <div class="mapping-list">
            <div
              v-for="(mapping, index) in inputMappings"
              :key="index"
              class="mapping-item"
            >
              <div class="mapping-row">
                <Form.Item label="参数名" style="flex: 1; margin-bottom: 8px">
                  <AutoComplete
                    v-model:value="mapping.key"
                    :options="
                      inputFields.map((f) => ({
                        value: f.key,
                        label: `${f.key}${f.required ? ' *' : ''}`,
                      }))
                    "
                    placeholder="参数名称"
                  />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  size="small"
                  @click="removeInputMapping(index)"
                >
                  <template #icon><DeleteOutlined /></template>
                </Button>
              </div>

              <Form.Item style="margin-bottom: 8px">
                <AutoComplete
                  v-model:value="mapping.value"
                  :options="templateSuggestions.map((s) => ({ value: s }))"
                  placeholder="$.inputs.xxx 或 $.outputs.stepKey.data"
                >
                  <template #prefix><CodeOutlined /></template>
                </AutoComplete>
              </Form.Item>

              <!-- 字段描述 -->
              <div
                v-if="inputFields.find((f) => f.key === mapping.key)"
                class="field-hint"
              >
                <QuestionCircleOutlined />
                {{
                  inputFields.find((f) => f.key === mapping.key)?.description
                }}
                <Tag
                  v-if="
                    inputFields.find((f) => f.key === mapping.key)?.required
                  "
                  color="red"
                  size="small"
                  >必填</Tag
                >
              </div>

              <Divider style="margin: 8px 0" />
            </div>
          </div>

          <Button type="dashed" block @click="addInputMapping">
            <template #icon><PlusOutlined /></template>
            添加输入映射
          </Button>
        </Collapse.Panel>

        <!-- 输出映射 -->
        <Collapse.Panel key="output" header="输出映射">
          <Alert type="info" show-icon style="margin-bottom: 12px">
            <template #message>
              将组件输出映射到流程上下文，供下游步骤使用
            </template>
          </Alert>

          <div class="mapping-list">
            <div
              v-for="(mapping, index) in outputMappings"
              :key="index"
              class="mapping-item"
            >
              <div class="mapping-row">
                <Form.Item
                  label="输出变量名"
                  style="flex: 1; margin-bottom: 8px"
                >
                  <Input v-model:value="mapping.key" placeholder="输出变量名" />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  size="small"
                  @click="removeOutputMapping(index)"
                >
                  <template #icon><DeleteOutlined /></template>
                </Button>
              </div>

              <Form.Item style="margin-bottom: 8px">
                <AutoComplete
                  v-model:value="mapping.value"
                  :options="
                    outputFields.map((f) => ({ value: `$.data.${f.key}` }))
                  "
                  placeholder="$.data.xxx"
                >
                  <template #prefix><CodeOutlined /></template>
                </AutoComplete>
              </Form.Item>

              <Divider style="margin: 8px 0" />
            </div>
          </div>

          <Button type="dashed" block @click="addOutputMapping">
            <template #icon><PlusOutlined /></template>
            添加输出映射
          </Button>
        </Collapse.Panel>

        <!-- 组件配置 -->
        <Collapse.Panel
          v-if="configFields.length > 0"
          key="config"
          header="组件配置"
        >
          <Form layout="vertical" size="small">
            <Form.Item
              v-for="field in configFields"
              :key="field.key"
              :label="field.key"
            >
              <!-- Select -->
              <Select
                v-if="field.enum"
                v-model:value="formState.config![field.key]"
                :placeholder="field.description"
              >
                <Select.Option
                  v-for="opt in field.enum"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </Select.Option>
              </Select>

              <!-- Switch -->
              <Switch
                v-else-if="field.type === 'boolean'"
                v-model:checked="formState.config![field.key]"
              />

              <!-- Number -->
              <InputNumber
                v-else-if="field.type === 'number' || field.type === 'integer'"
                v-model:value="formState.config![field.key]"
                :placeholder="field.description"
                style="width: 100%"
              />

              <!-- Input -->
              <Input
                v-else
                v-model:value="formState.config![field.key]"
                :placeholder="field.description"
              />

              <div v-if="field.description" class="form-hint">
                {{ field.description }}
              </div>
            </Form.Item>
          </Form>
        </Collapse.Panel>

        <!-- 条件执行 -->
        <Collapse.Panel key="condition" header="条件执行">
          <Form layout="vertical" size="small">
            <Form.Item label="执行条件">
              <Input.TextArea
                v-model:value="formState.condition"
                :rows="3"
                placeholder="例: $.inputs.updateKnowledgeState == true && $.inputs.studentId != null"
              />
              <div class="form-hint">
                <QuestionCircleOutlined />
                当条件为空或返回 true 时执行此步骤。 支持 <code>==</code>,
                <code>!=</code>, <code>&&</code>, <code>||</code> 等表达式。
              </div>
            </Form.Item>
          </Form>
        </Collapse.Panel>
      </Collapse>
    </div>

    <div class="panel-footer">
      <Space>
        <Button @click="emit('close')">取消</Button>
        <Button type="primary" @click="handleSave">保存配置</Button>
      </Space>
    </div>
  </div>

  <div v-else class="empty-panel">
    <div class="empty-content">
      <QuestionCircleOutlined style="font-size: 48px; color: #d9d9d9" />
      <p>点击节点查看配置</p>
    </div>
  </div>
</template>

<style scoped>
.node-config-panel {
  display: flex;
  flex-direction: column;
  width: 380px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e8e8e8;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  padding: 0 8px;
  overflow-y: auto;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-collapse-header) {
  padding: 8px 12px !important;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
  padding: 8px 12px !important;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);

  code {
    padding: 1px 4px;
    font-family: 'Courier New', monospace;
    background: #f5f5f5;
    border-radius: 2px;
  }
}

.mapping-list {
  margin-bottom: 12px;
}

.mapping-item {
  padding: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.mapping-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.field-hint {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 380px;
  height: 100%;
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
}

.empty-content {
  color: rgb(0 0 0 / 45%);
  text-align: center;
}
</style>
