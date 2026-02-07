<script lang="ts" setup>
import { computed } from 'vue';
import { Card, Empty } from 'ant-design-vue';

export interface TrendItem {
  /** 日期或标签 */
  date: string;
  /** 数值 */
  value: number;
  /** 可选的第二个数值 */
  value2?: number;
}

interface Props {
  /** 卡片标题 */
  title: string;
  /** 数据源 */
  data: TrendItem[];
  /** 主数据标签 */
  label?: string;
  /** 第二数据标签 */
  label2?: string;
  /** 主数据颜色 */
  color?: string;
  /** 第二数据颜色 */
  color2?: string;
  /** 柱子最大高度 */
  maxHeight?: number;
  /** 柱子宽度 */
  barWidth?: string;
  /** 容器高度 */
  height?: number;
  /** 空数据描述 */
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '数值',
  label2: '',
  color: '#3b82f6', // blue-500
  color2: '#a855f7', // purple-500
  maxHeight: 180,
  barWidth: 'w-10',
  height: 240,
  emptyText: '暂无数据',
});

const maxValue = computed(() => {
  return Math.max(...props.data.map((d) => d.value), 1);
});

const maxValue2 = computed(() => {
  if (!props.data.some((d) => d.value2 !== undefined)) return 1;
  return Math.max(...props.data.map((d) => d.value2 || 0), 1);
});

function getBarHeight(value: number, max: number): number {
  return Math.max(20, (value / max) * props.maxHeight);
}

function formatDateLabel(date: string): string {
  // 如果是 YYYY-MM-DD 格式，只显示 MM-DD
  if (date.length >= 10 && date.includes('-')) {
    return date.slice(5);
  }
  return date;
}
</script>

<script lang="ts">
export default {
  name: 'TrendBarChart',
};
</script>

<template>
  <Card :title="title">
    <div
      v-if="data?.length"
      class="flex items-end justify-around"
      :style="{ height: `${height}px` }"
    >
      <div
        v-for="(item, index) in data"
        :key="index"
        class="flex flex-col items-center"
      >
        <!-- 数值标签 -->
        <div class="mb-1 text-xs" :style="{ color: color }">
          {{ item.value }}
        </div>

        <!-- 主柱子 -->
        <div
          :class="[barWidth, 'rounded-t']"
          :style="{
            height: `${getBarHeight(item.value, maxValue)}px`,
            backgroundColor: color,
          }"
        />

        <!-- 第二柱子（如果有） -->
        <div
          v-if="item.value2 !== undefined"
          :class="barWidth"
          :style="{
            height: `${getBarHeight(item.value2, maxValue2)}px`,
            backgroundColor: color2,
          }"
        />

        <!-- 日期标签 -->
        <div class="mt-2 text-xs text-gray-400">
          {{ formatDateLabel(item.date) }}
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div
      v-if="data?.length && label2"
      class="mt-2 flex justify-center gap-4 text-xs"
    >
      <span>
        <span
          class="mr-1 inline-block h-2 w-2 rounded"
          :style="{ backgroundColor: color }"
        />
        {{ label }}
      </span>
      <span>
        <span
          class="mr-1 inline-block h-2 w-2 rounded"
          :style="{ backgroundColor: color2 }"
        />
        {{ label2 }}
      </span>
    </div>

    <div
      v-if="!data?.length"
      class="flex items-center justify-center"
      :style="{ height: `${height}px` }"
    >
      <Empty :description="emptyText" />
    </div>
  </Card>
</template>
