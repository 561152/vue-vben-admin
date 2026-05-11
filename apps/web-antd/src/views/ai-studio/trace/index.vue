<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  getTraceAggregate,
  getTraces,
  type TraceAggregateItem,
  type TraceListItem,
} from '#/api/ai-studio/trace';
import TraceFilters from './components/TraceFilters.vue';
import TraceList from './components/TraceList.vue';
import AggregateChart from './components/AggregateChart.vue';

const router = useRouter();
const loading = ref(false);
const aggregateLoading = ref(false);
const traces = ref<TraceListItem[]>([]);
const aggregates = ref<TraceAggregateItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const filters = ref({
  dateRange: [dayjs().subtract(24, 'hour'), dayjs()] as [
    dayjs.Dayjs,
    dayjs.Dayjs,
  ],
  pipelineId: undefined as string | undefined,
  status: undefined as string | undefined,
});

function params() {
  return {
    startTime: filters.value.dateRange[0].toISOString(),
    endTime: filters.value.dateRange[1].toISOString(),
    pipelineId: filters.value.pipelineId || undefined,
    status: filters.value.status,
    page: pagination.value.current,
    pageSize: pagination.value.pageSize,
  };
}

async function fetchTraces() {
  loading.value = true;
  try {
    const response = await getTraces(params());
    traces.value = Array.isArray(response)
      ? response
      : ((response as any).data ?? []);
    pagination.value.total = (response as any).total ?? traces.value.length;
  } catch (error) {
    console.error('Failed to fetch traces:', error);
    message.error('获取 Trace 列表失败');
  } finally {
    loading.value = false;
  }
}

async function fetchAggregates() {
  aggregateLoading.value = true;
  try {
    const response = await getTraceAggregate({
      startTime: filters.value.dateRange[0].toISOString(),
      endTime: filters.value.dateRange[1].toISOString(),
      dimension: 'status',
    });
    aggregates.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Failed to fetch trace aggregates:', error);
    aggregates.value = [];
  } finally {
    aggregateLoading.value = false;
  }
}

function search() {
  pagination.value.current = 1;
  void fetchTraces();
  void fetchAggregates();
}

function reset() {
  filters.value = {
    dateRange: [dayjs().subtract(24, 'hour'), dayjs()],
    pipelineId: undefined,
    status: undefined,
  };
  search();
}

function handleTableChange(next: {
  current: number;
  pageSize: number;
  total: number;
}) {
  pagination.value.current = next.current;
  pagination.value.pageSize = next.pageSize;
  void fetchTraces();
}

function openTrace(traceId: string) {
  router.push(`/ai-studio/trace/${traceId}`);
}

onMounted(() => {
  void fetchTraces();
  void fetchAggregates();
});
</script>

<template>
  <div class="trace-page">
    <a-card title="Trace Viewer">
      <template #extra>
        <a-button @click="search">刷新</a-button>
      </template>
      <TraceFilters v-model="filters" @search="search" @reset="reset" />
      <AggregateChart :rows="aggregates" :loading="aggregateLoading" />
      <TraceList
        :rows="traces"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        @open="openTrace"
      />
    </a-card>
  </div>
</template>

<style scoped>
.trace-page {
  padding: 16px;
}
</style>
