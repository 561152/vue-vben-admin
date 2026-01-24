<script lang="ts" setup>
import { ref, watch } from 'vue';
import { FormItem, Switch } from 'ant-design-vue';

interface Props {
  modelValue: boolean | undefined;
  schema: any;
  fieldKey: string;
  required?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean | undefined];
}>();

const localValue = ref(props.modelValue ?? props.schema.default ?? false);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = newValue ?? props.schema.default ?? false;
    }
  },
);
</script>

<template>
  <FormItem
    :label="schema.title || fieldKey"
    :name="fieldKey"
    :help="schema.description"
    :required="required"
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <Switch v-model:checked="localValue" />
      <span style="color: #999; font-size: 12px">
        当前: {{ localValue ? '开启' : '关闭' }}
        <template v-if="schema.default !== undefined">
          | 默认: {{ schema.default ? '开启' : '关闭' }}
        </template>
      </span>
    </div>
  </FormItem>
</template>
