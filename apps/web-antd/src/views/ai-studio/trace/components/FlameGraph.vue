<script setup lang="ts">
import { computed } from 'vue';
import type { SpanRow } from '#/api/ai-studio/trace';

const props = defineProps<{ spans: SpanRow[]; selectedId?: string }>();
const emit = defineEmits<{ select: [span: SpanRow] }>();

const maxDuration = computed(() =>
  Math.max(1, ...props.spans.map((span) => span.duration_ms ?? 1)),
);
</script>

<template>
  <a-card size="small" title="Flame Graph" class="flame-card">
    <a-empty v-if="spans.length === 0" description="没有可视化数据" />
    <div v-else class="flame-list">
      <button
        v-for="span in spans"
        :key="span.span_id"
        class="flame-bar"
        :class="{
          active: span.span_id === selectedId,
          error: span.status === 'ERROR',
        }"
        :style="{
          width: `${Math.max(8, ((span.duration_ms ?? 1) / maxDuration) * 100)}%`,
          marginLeft: `${span.parent_span_id ? 24 : 0}px`,
        }"
        @click="emit('select', span)"
      >
        <span>{{ span.name }}</span>
        <strong>{{ span.duration_ms ?? '-' }}ms</strong>
      </button>
    </div>
  </a-card>
</template>

<style scoped>
.flame-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flame-bar {
  display: flex;
  justify-content: space-between;
  min-width: 160px;
  padding: 6px 10px;
  color: #234;
  cursor: pointer;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.flame-bar.error {
  background: #fff1f0;
  border-color: #ffa39e;
}

.flame-bar.active {
  outline: 2px solid #1677ff;
}
</style>
