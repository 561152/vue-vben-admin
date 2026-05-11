<script setup lang="ts">
import dayjs from 'dayjs';
import type { TraceListItem } from '#/api/ai-studio/trace';

interface TracePagination {
  current: number;
  pageSize: number;
  total: number;
}

defineProps<{
  rows: TraceListItem[];
  loading: boolean;
  pagination: TracePagination;
}>();

const emit = defineEmits<{
  change: [pagination: TracePagination];
  open: [traceId: string];
}>();

const columns = [
  {
    title: 'Trace ID',
    dataIndex: 'trace_id',
    key: 'trace_id',
    width: 240,
    ellipsis: true,
  },
  {
    title: 'Pipeline',
    dataIndex: 'pipeline_id',
    key: 'pipeline_id',
    width: 120,
  },
  {
    title: 'Execution',
    dataIndex: 'execution_id',
    key: 'execution_id',
    width: 140,
  },
  {
    title: 'Root Span',
    dataIndex: 'root_span_kind',
    key: 'root_span_kind',
    width: 140,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'Span 数', dataIndex: 'span_count', key: 'span_count', width: 90 },
  {
    title: 'Tokens',
    dataIndex: 'total_tokens',
    key: 'total_tokens',
    width: 100,
  },
  { title: '耗时', dataIndex: 'duration_ms', key: 'duration_ms', width: 100 },
  { title: '开始时间', dataIndex: 'start_time', key: 'start_time', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

function handleChange(pagination: unknown) {
  const value = pagination as Partial<TracePagination>;
  emit('change', {
    current: value.current ?? 1,
    pageSize: value.pageSize ?? 20,
    total: value.total ?? 0,
  });
}
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="rows"
    :loading="loading"
    :pagination="pagination"
    :scroll="{ x: 1310 }"
    row-key="trace_id"
    @change="handleChange"
  >
    <template #emptyText>
      暂无 Trace。请确认工作流已携带 tenant.id 并完成写入。
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :color="record.status === 'ERROR' ? 'error' : 'success'">{{
          record.status
        }}</a-tag>
      </template>
      <template v-else-if="column.key === 'duration_ms'">
        {{ record.duration_ms == null ? '-' : `${record.duration_ms}ms` }}
      </template>
      <template v-else-if="column.key === 'start_time'">
        {{
          record.start_time
            ? dayjs(record.start_time).format('YYYY-MM-DD HH:mm:ss')
            : '-'
        }}
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button
          type="link"
          size="small"
          @click="emit('open', record.trace_id)"
          >查看</a-button
        >
      </template>
    </template>
  </a-table>
</template>
