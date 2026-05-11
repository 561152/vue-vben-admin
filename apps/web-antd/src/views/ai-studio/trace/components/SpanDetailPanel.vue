<script setup lang="ts">
import { computed } from 'vue';
import type { SpanRow } from '#/api/ai-studio/trace';

const props = defineProps<{ span?: SpanRow }>();

function formatJson(value: unknown) {
  if (value == null) return '-';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

const items = computed(() =>
  props.span
    ? [
        { label: 'Span ID', value: props.span.span_id },
        { label: 'Parent', value: props.span.parent_span_id ?? '-' },
        { label: 'Kind', value: props.span.span_kind },
        { label: 'Status', value: props.span.status },
        {
          label: 'Duration',
          value:
            props.span.duration_ms == null
              ? '-'
              : `${props.span.duration_ms}ms`,
        },
        { label: 'Error', value: props.span.error_message ?? '-' },
      ]
    : [],
);
</script>

<template>
  <a-card size="small" title="Span 详情">
    <a-empty v-if="!span" description="选择一个 span 查看详情" />
    <template v-else>
      <a-descriptions size="small" bordered :column="1">
        <a-descriptions-item
          v-for="item in items"
          :key="item.label"
          :label="item.label"
          >{{ item.value }}</a-descriptions-item
        >
      </a-descriptions>
      <a-divider />
      <h4>Attributes</h4>
      <pre>{{ formatJson(span.attributes) }}</pre>
      <h4>Events</h4>
      <pre>{{ formatJson(span.events) }}</pre>
    </template>
  </a-card>
</template>

<style scoped>
pre {
  max-height: 280px;
  padding: 12px;
  overflow: auto;
  background: #f7f8fa;
  border-radius: 4px;
}
</style>
