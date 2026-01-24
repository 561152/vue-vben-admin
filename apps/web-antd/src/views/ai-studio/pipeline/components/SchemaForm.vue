<script lang="ts" setup>
import { ref, watch, computed, h } from 'vue';
import { Form } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import {
  StringField,
  NumberField,
  BooleanField,
  EnumField,
} from './FormRenderer';

interface Props {
  schema: any;
  modelValue: Record<string, any>;
  readonly?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>];
  validate: [valid: boolean, errors: any[]];
}>();

const formRef = ref();
const formData = ref<Record<string, any>>({ ...props.modelValue });

// 监听表单数据变化
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true },
);

// 监听外部 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    formData.value = { ...newValue };
  },
  { deep: true },
);

// 根据 Schema 类型选择组件
function getFieldComponent(prop: any) {
  if (prop.enum && Array.isArray(prop.enum)) return EnumField;
  if (prop.type === 'boolean') return BooleanField;
  if (prop.type === 'number' || prop.type === 'integer') return NumberField;
  return StringField;
}

// 检查是否必填
function isRequired(key: string): boolean {
  return props.schema.required?.includes(key) || false;
}

// 构建验证规则
const validationRules = computed(() => {
  const rules: Record<string, Rule[]> = {};

  if (!props.schema.properties) return rules;

  Object.entries(props.schema.properties).forEach(
    ([key, prop]: [string, any]) => {
      const fieldRules: Rule[] = [];

      // 必填验证
      if (isRequired(key)) {
        fieldRules.push({
          required: true,
          message: `${prop.title || key} is required`,
        });
      }

      // 数字范围验证
      if (prop.type === 'number' || prop.type === 'integer') {
        if (prop.minimum !== undefined) {
          fieldRules.push({
            type: 'number',
            min: prop.minimum,
            message: `Minimum: ${prop.minimum}`,
          });
        }
        if (prop.maximum !== undefined) {
          fieldRules.push({
            type: 'number',
            max: prop.maximum,
            message: `Maximum: ${prop.maximum}`,
          });
        }
      }

      // 字符串格式验证
      if (prop.type === 'string' && prop.format === 'uri') {
        fieldRules.push({
          type: 'url',
          message: 'Must be a valid URL',
        });
      }

      if (fieldRules.length > 0) {
        rules[key] = fieldRules;
      }
    },
  );

  return rules;
});

// 渲染字段组件
function renderField(key: string, prop: any) {
  const Component = getFieldComponent(prop);

  return h(Component, {
    modelValue: formData.value[key],
    schema: prop,
    fieldKey: key,
    required: isRequired(key),
    'onUpdate:modelValue': (value: any) => {
      formData.value[key] = value;
    },
  });
}

// 暴露验证方法
const validate = async () => {
  try {
    await formRef.value?.validate();
    emit('validate', true, []);
    return true;
  } catch (error: any) {
    emit('validate', false, error.errorFields || []);
    return false;
  }
};

defineExpose({
  validate,
});
</script>

<template>
  <Form
    ref="formRef"
    :model="formData"
    :rules="validationRules"
    layout="vertical"
    :disabled="readonly"
  >
    <template v-if="schema && schema.properties">
      <template v-for="(prop, key) in schema.properties" :key="key">
        <component :is="() => renderField(key as string, prop)" />
      </template>
    </template>
    <div v-else style=" padding: 40px;color: #999; text-align: center">
      No schema properties found
    </div>
  </Form>
</template>
