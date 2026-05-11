<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getTraceDetail, type SpanRow } from '#/api/ai-studio/trace';
import SpanTree from './components/SpanTree.vue';
import FlameGraph from './components/FlameGraph.vue';
import SpanDetailPanel from './components/SpanDetailPanel.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const spans = ref<SpanRow[]>([]);
const selected = ref<SpanRow>();
const traceId = computed(() => String(route.params.traceId ?? ''));

const rootSpan = computed(
  () =>
    spans.value.find((span) => span.parent_span_id == null) ?? spans.value[0],
);
const summary = computed(() => ({
  status: spans.value.some((span) => span.status === 'ERROR') ? 'ERROR' : 'OK',
  spanCount: spans.value.length,
  duration: rootSpan.value?.duration_ms ?? null,
  startedAt: rootSpan.value?.start_time ?? '-',
}));

async function fetchDetail() {
  if (!traceId.value) return;
  loading.value = true;
  try {
    spans.value = await getTraceDetail(traceId.value);
    selected.value = rootSpan.value;
  } catch (error) {
    console.error('Failed to fetch trace detail:', error);
    message.error('获取 Trace 详情失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => void fetchDetail());
</script>

<template>
  <div class="trace-detail-page">
    <a-card :loading="loading">
      <template #title>
        <a-space>
          <a-button type="link" @click="router.push('/ai-studio/trace')"
            >返回</a-button
          >
          <span>Trace {{ traceId }}</span>
        </a-space>
      </template>
      <a-descriptions bordered size="small" :column="4">
        <a-descriptions-item label="状态">
          <a-tag :color="summary.status === 'ERROR' ? 'error' : 'success'">{{
            summary.status
          }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Span 数">{{
          summary.spanCount
        }}</a-descriptions-item>
        <a-descriptions-item label="耗时">{{
          summary.duration == null ? '-' : `${summary.duration}ms`
        }}</a-descriptions-item>
        <a-descriptions-item label="开始时间">{{
          summary.startedAt
        }}</a-descriptions-item>
      </a-descriptions>
      <a-row :gutter="16" class="detail-grid">
        <a-col :span="7">
          <SpanTree
            :spans="spans"
            :selected-id="selected?.span_id"
            @select="selected = $event"
          />
        </a-col>
        <a-col :span="10">
          <FlameGraph
            :spans="spans"
            :selected-id="selected?.span_id"
            @select="selected = $event"
          />
        </a-col>
        <a-col :span="7">
          <SpanDetailPanel :span="selected" />
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<style scoped>
.trace-detail-page {
  padding: 16px;
}

.detail-grid {
  margin-top: 16px;
}
</style>
