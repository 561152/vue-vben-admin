<script lang="ts" setup>
import { Row, Col } from 'ant-design-vue';
import StatisticCard from './StatisticCard.vue';
import type { Component } from 'vue';

export interface StatisticItem {
  /** 统计标题 */
  title: string;
  /** 统计数值 */
  value: number | string;
  /** 前缀图标组件 */
  prefixIcon?: Component;
  /** 后缀文本 */
  suffix?: string;
  /** 数值颜色 */
  valueColor?: string;
  /** 条件颜色阈值 */
  colorThreshold?: number;
  /** 超过阈值的颜色 */
  positiveColor?: string;
  /** 低于阈值的颜色 */
  negativeColor?: string;
}

interface Props {
  /** 统计项列表 */
  items: StatisticItem[];
  /** 栅格间隔 */
  gutter?: number;
  /** 每项占用的列数（24格） */
  colSpan?: number;
}

const props = withDefaults(defineProps<Props>(), {
  gutter: 16,
  colSpan: 4,
});
</script>

<script lang="ts">
export default {
  name: 'StatisticCardRow',
};
</script>

<template>
  <Row :gutter="props.gutter" class="mb-4">
    <Col v-for="(item, index) in props.items" :key="index" :span="props.colSpan">
      <StatisticCard
        :title="item.title"
        :value="item.value"
        :prefix-icon="item.prefixIcon"
        :suffix="item.suffix"
        :value-color="item.valueColor"
        :color-threshold="item.colorThreshold"
        :positive-color="item.positiveColor"
        :negative-color="item.negativeColor"
      />
    </Col>
  </Row>
</template>
