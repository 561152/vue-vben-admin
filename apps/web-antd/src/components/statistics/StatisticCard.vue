<script lang="ts" setup>
import { h, type Component } from 'vue';
import { Card, Statistic } from 'ant-design-vue';

interface Props {
  /** 统计标题 */
  title: string;
  /** 统计数值 */
  value: number | string;
  /** 前缀图标组件 */
  prefixIcon?: Component;
  /** 后缀文本（如 %） */
  suffix?: string;
  /** 数值颜色 */
  valueColor?: string;
  /** 条件颜色阈值（超过阈值使用 positiveColor，否则使用 negativeColor） */
  colorThreshold?: number;
  /** 超过阈值的颜色 */
  positiveColor?: string;
  /** 低于阈值的颜色 */
  negativeColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  suffix: '',
  valueColor: undefined,
  colorThreshold: undefined,
  positiveColor: '#52c41a',
  negativeColor: '#faad14',
});

const computedValueStyle = computed(() => {
  if (props.valueColor) {
    return { color: props.valueColor };
  }
  if (props.colorThreshold !== undefined && typeof props.value === 'number') {
    return {
      color:
        props.value >= props.colorThreshold
          ? props.positiveColor
          : props.negativeColor,
    };
  }
  return undefined;
});
</script>

<script lang="ts">
import { computed } from 'vue';

export default {
  name: 'StatisticCard',
};
</script>

<template>
  <Card>
    <Statistic
      :title="title"
      :value="value"
      :prefix="prefixIcon ? h(prefixIcon) : undefined"
      :suffix="suffix"
      :value-style="computedValueStyle"
    />
  </Card>
</template>
