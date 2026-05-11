<script setup lang="ts">
import type dayjs from 'dayjs';

const model = defineModel<{
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  pipelineId?: string;
  status?: string;
}>({ required: true });

const emit = defineEmits<{ search: []; reset: [] }>();

const statusOptions = [
  { label: '成功', value: 'OK' },
  { label: '失败', value: 'ERROR' },
];
</script>

<template>
  <div class="trace-filters">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-range-picker
          v-model:value="model.dateRange"
          show-time
          style="width: 100%"
        />
      </a-col>
      <a-col :span="5">
        <a-input
          v-model:value="model.pipelineId"
          allow-clear
          placeholder="Pipeline ID"
        />
      </a-col>
      <a-col :span="5">
        <a-select
          v-model:value="model.status"
          allow-clear
          placeholder="状态"
          :options="statusOptions"
          style="width: 100%"
        />
      </a-col>
      <a-col :span="6">
        <a-space>
          <a-button type="primary" @click="emit('search')">搜索</a-button>
          <a-button @click="emit('reset')">重置</a-button>
        </a-space>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.trace-filters {
  margin-bottom: 16px;
}
</style>
