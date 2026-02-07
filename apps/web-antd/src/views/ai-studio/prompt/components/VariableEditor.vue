<script lang="tsx" setup>
import { computed, ref, watch } from 'vue';

import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'ant-design-vue';

import type { PromptVariable } from '#/utils/prompt-engine';

interface VariableEditorItem extends PromptVariable {
  id: string; // 用于表格行标识
}

interface Props {
  modelValue: PromptVariable[];
  autoExtract?: boolean;
  template?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: PromptVariable[]];
  change: [value: PromptVariable[]];
}>();

// ==================== 状态 ====================

const variables = ref<VariableEditorItem[]>([]);

// ==================== 计算属性 ====================

const variableTypes = [
  { value: 'string', label: '字符串', color: 'blue' },
  { value: 'text', label: '长文本', color: 'cyan' },
  { value: 'number', label: '数字', color: 'green' },
  { value: 'boolean', label: '布尔值', color: 'purple' },
  { value: 'json', label: 'JSON', color: 'orange' },
  { value: 'image_url', label: '图片URL', color: 'magenta' },
];

// ==================== 方法 ====================

/**
 * 生成唯一ID
 */
const generateId = () =>
  `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 添加变量
 */
const addVariable = () => {
  const newVar: VariableEditorItem = {
    id: generateId(),
    name: '',
    type: 'string',
    required: true,
    inferred: false,
  };
  variables.value.push(newVar);
  emitUpdate();
};

/**
 * 删除变量
 */
const removeVariable = (id: string) => {
  const index = variables.value.findIndex((v) => v.id === id);
  if (index > -1) {
    variables.value.splice(index, 1);
    emitUpdate();
  }
};

/**
 * 更新变量
 */
const updateVariable = (id: string, updates: Partial<VariableEditorItem>) => {
  const variable = variables.value.find((v) => v.id === id);
  if (variable) {
    Object.assign(variable, updates);
    emitUpdate();
  }
};

/**
 * 发送更新事件
 */
const emitUpdate = () => {
  const cleanVariables = variables.value.map(({ id, ...rest }) => rest);
  emit('update:modelValue', cleanVariables);
  emit('change', cleanVariables);
};

/**
 * 从模板自动提取变量
 */
const autoExtractVariables = () => {
  if (!props.template) return;

  const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;
  const extracted = new Set<string>();
  let match;

  while ((match = regex.exec(props.template)) !== null) {
    extracted.add(match[1]);
  }

  // 保留已有定义的变量，添加新提取的
  const existingNames = new Set(variables.value.map((v) => v.name));
  const newVars: VariableEditorItem[] = [];

  for (const name of extracted) {
    if (!existingNames.has(name)) {
      // 推断类型
      let type: PromptVariable['type'] = 'string';
      if (/image|url|picture/i.test(name)) type = 'image_url';
      else if (/json|data|object/i.test(name)) type = 'json';
      else if (/content|text|description/i.test(name)) type = 'text';
      else if (/count|number|age|score/i.test(name)) type = 'number';
      else if (/enabled|active|flag|is_/i.test(name)) type = 'boolean';

      newVars.push({
        id: generateId(),
        name,
        type,
        required: true,
        inferred: true,
      });
    }
  }

  if (newVars.length > 0) {
    variables.value.push(...newVars);
    emitUpdate();
  }
};

// ==================== 监听 ====================

// 监听外部值变化
watch(
  () => props.modelValue,
  (val) => {
    if (val && val.length !== variables.value.length) {
      variables.value = val.map((v) => ({
        ...v,
        id: generateId(),
      }));
    }
  },
  { immediate: true },
);

// 监听模板变化自动提取
watch(
  () => props.template,
  () => {
    if (props.autoExtract) {
      autoExtractVariables();
    }
  },
  { debounce: 500 },
);

// ==================== 表格列定义 ====================

const columns = [
  {
    title: '变量名',
    key: 'name',
    width: 150,
  },
  {
    title: '类型',
    key: 'type',
    width: 120,
  },
  {
    title: '必填',
    key: 'required',
    width: 80,
    align: 'center',
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '默认值',
    key: 'defaultValue',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center',
  },
];
</script>

<template>
  <Card size="small">
    <template #title>
      <Space>
        <span>变量定义</span>
        <Tooltip title="定义提示词中使用的变量，支持从模板自动提取">
          <QuestionCircleOutlined />
        </Tooltip>
      </Space>
    </template>
    <template #extra>
      <Space>
        <Button type="dashed" size="small" @click="autoExtractVariables">
          自动提取
        </Button>
        <Button type="primary" size="small" @click="addVariable">
          <PlusOutlined />
          添加变量
        </Button>
      </Space>
    </template>
    <Table
      :columns="columns"
      :data-source="variables"
      size="small"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <!-- 变量名 -->
        <template v-if="column.key === 'name'">
          <Input
            v-model:value="record.name"
            placeholder="变量名"
            @change="emitUpdate"
          />
          <Tag v-if="record.inferred" color="blue" class="mt-1" size="small">
            自动推断
          </Tag>
        </template>

        <!-- 类型 -->
        <template v-if="column.key === 'type'">
          <Select
            v-model:value="record.type"
            style="width: 100%"
            @change="emitUpdate"
          >
            <Select.Option
              v-for="t in variableTypes"
              :key="t.value"
              :value="t.value"
            >
              <Tag :color="t.color" size="small">{{ t.label }}</Tag>
            </Select.Option>
          </Select>
        </template>

        <!-- 必填 -->
        <template v-if="column.key === 'required'">
          <Switch
            v-model:checked="record.required"
            size="small"
            @change="emitUpdate"
          />
        </template>

        <!-- 描述 -->
        <template v-if="column.key === 'description'">
          <Input
            v-model:value="record.description"
            placeholder="变量描述"
            @change="emitUpdate"
          />
        </template>

        <!-- 默认值 -->
        <template v-if="column.key === 'defaultValue'">
          <Input
            v-model:value="record.defaultValue"
            placeholder="默认值"
            @change="emitUpdate"
          />
        </template>

        <!-- 操作 -->
        <template v-if="column.key === 'action'">
          <Button
            type="text"
            danger
            size="small"
            @click="removeVariable(record.id)"
          >
            <DeleteOutlined />
          </Button>
        </template>
      </template>

      <!-- 空状态 -->
      <template #emptyText>
        <div class="py-8 text-center">
          <Typography.Text type="secondary">
            暂无变量定义，点击"添加变量"或"自动提取"
          </Typography.Text>
        </div>
      </template>
    </Table>

    <!-- 提示信息 -->
    <div class="mt-3">
      <Typography.Text type="secondary" class="text-xs">
        提示：变量名只能包含字母、数字、下划点和点号，且不能以数字开头。使用
        <code v-pre>{{变量名}}</code>
        语法在模板中引用变量。
      </Typography.Text>
    </div>
  </Card>
</template>

<style lang="less" scoped>
:deep(.ant-table-cell) {
  padding: 8px !important;
}
</style>
