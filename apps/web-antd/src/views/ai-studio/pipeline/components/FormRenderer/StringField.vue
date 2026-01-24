<script lang="ts" setup>
import { ref, watch } from 'vue';
import { FormItem, Input } from 'ant-design-vue';

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

const localValue = ref(props.modelValue ?? props.schema.default ?? '');

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = newValue ?? props.schema.default ?? '';
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
    <Input
      v-model:value="localValue"
      :placeholder="
        schema.default ? `Default: ${schema.default}` : schema.description
      "
    />
  </FormItem>
</template>
