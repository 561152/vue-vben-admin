<template>
  <div class="correction-editor">
    <a-textarea
      v-model:value="localValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      @change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Textarea as ATextarea } from 'ant-design-vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入批改意见...',
  rows: 4,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  },
);

const handleChange = () => {
  emit('update:modelValue', localValue.value);
  emit('change', localValue.value);
};
</script>

<style scoped lang="less">
.correction-editor {
  width: 100%;
}
</style>
