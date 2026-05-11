<script setup lang="ts">
import type { TraceAggregateItem } from '#/api/ai-studio/trace';

defineProps<{ rows: TraceAggregateItem[]; loading: boolean }>();
</script>

<template>
  <a-card
    size="small"
    title="Trace 聚合"
    :loading="loading"
    class="aggregate-card"
  >
    <a-empty v-if="rows.length === 0" description="暂无聚合数据" />
    <div v-else class="bars">
      <div v-for="item in rows" :key="String(item.bucket)" class="bar-row">
        <span class="bucket">{{ item.bucket }}</span>
        <a-progress
          :percent="Math.min(100, Number(item.trace_count))"
          :format="() => `${item.trace_count} traces`"
        />
      </div>
    </div>
  </a-card>
</template>

<style scoped>
.aggregate-card {
  margin-bottom: 16px;
}

.bar-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  align-items: center;
}

.bucket {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
  white-space: nowrap;
}
</style>
