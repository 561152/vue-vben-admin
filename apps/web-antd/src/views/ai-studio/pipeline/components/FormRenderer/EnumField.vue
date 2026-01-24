<script lang="ts" setup>
import { ref, watch } from 'vue';
import { FormItem, Select } from 'ant-design-vue';

interface Props {
  modelValue: string | undefined;
  schema: any;
  fieldKey: string;
  required?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

const localValue = ref(props.modelValue ?? props.schema.default);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = newValue ?? props.schema.default;
    }
  },
);

// 将 enum 转换为 Select 选项
const options = (props.schema.enum || []).map((value: string) => ({
  label: value,
  value: value,
}));
</script>

<template>
  <FormItem
    :label="schema.title || fieldKey"
    :name="fieldKey"
    :help="schema.description"
    :required="required"
  >
    <Select
      v-model:value="localValue"
      :options="options"
      :placeholder="`Default: ${schema.default || 'Select...'}`"
    />
  </FormItem>
</template>
