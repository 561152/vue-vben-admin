<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { FormItem, InputNumber, Slider, Space } from 'ant-design-vue';

interface Props {
  modelValue: number | undefined;
  schema: any;
  fieldKey: string;
  required?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const localValue = ref(
  props.modelValue ?? props.schema.default ?? props.schema.minimum ?? 0,
);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value =
        newValue ?? props.schema.default ?? props.schema.minimum ?? 0;
    }
  },
);

// 判断是否使用 Slider（有范围且范围不太大）
const useSlider = computed(() => {
  const min = props.schema.minimum;
  const max = props.schema.maximum;
  return (
    min !== undefined &&
    max !== undefined &&
    max - min <= 100 &&
    max - min >= 0
  );
});

// Slider 刻度标记
const marks = computed(() => {
  if (!useSlider.value) return {};

  const min = props.schema.minimum || 0;
  const max = props.schema.maximum || 100;
  const defaultVal = props.schema.default;

  const result: Record<number, string> = {
    [min]: String(min),
    [max]: String(max),
  };

  if (defaultVal !== undefined && defaultVal !== min && defaultVal !== max) {
    result[defaultVal] = `${defaultVal}`;
  }

  return result;
});

const step = computed(() => {
  return props.schema.multipleOf || (useSlider.value ? 0.1 : 1);
});
</script>

<template>
  <FormItem
    :label="schema.title || fieldKey"
    :name="fieldKey"
    :help="schema.description"
    :required="required"
  >
    <Space direction="vertical" style="width: 100%">
      <!-- Slider 模式 -->
      <Slider
        v-if="useSlider"
        v-model:value="localValue"
        :min="schema.minimum || 0"
        :max="schema.maximum || 100"
        :step="step"
        :marks="marks"
      />

      <!-- 输入框（Slider 模式下也显示，用于精确输入） -->
      <InputNumber
        v-model:value="localValue"
        :min="schema.minimum"
        :max="schema.maximum"
        :step="step"
        :placeholder="`Default: ${schema.default}`"
        style="width: 100%"
      />

      <!-- 默认值提示 -->
      <div v-if="schema.default !== undefined" style="color: #999; font-size: 12px">
        默认值: {{ schema.default }}
      </div>
    </Space>
  </FormItem>
</template>
