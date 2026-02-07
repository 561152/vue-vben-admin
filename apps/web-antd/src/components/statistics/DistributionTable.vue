<script lang="ts" setup>
import { computed } from 'vue';
import { Card, Table, Progress, Tag, Empty } from 'ant-design-vue';
import type { SelectOption } from '#/constants/crm-options';

export interface DistributionColumn {
  /** 列标题 */
  title: string;
  /** 数据字段 */
  dataIndex: string;
  /** 列类型 */
  key: string;
  /** 列宽 */
  width?: number | string;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 进度条阈值 */
  progressThreshold?: number;
  /** 是否是标签 */
  isTag?: boolean;
  /** 值映射（优先使用） */
  valueMap?: Record<string, string>;
  /** 选项列表（用于映射值和颜色） */
  options?: SelectOption[];
}

interface Props {
  /** 卡片标题 */
  title: string;
  /** 数据源 */
  dataSource: Record<string, unknown>[];
  /** 列配置 */
  columns: DistributionColumn[];
  /** 是否显示分页 */
  pagination?: boolean;
  /** 表格大小 */
  size?: 'default' | 'middle' | 'small';
  /** 表格滚动高度 */
  scrollY?: number;
  /** 空数据描述 */
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pagination: false,
  size: 'small',
  scrollY: undefined,
  emptyText: '暂无数据',
});

const displayData = computed(() => {
  return props.dataSource.map((item, index) => ({
    ...item,
    key: index,
  }));
});

const tableColumns = computed(() => {
  return props.columns.map((col) => ({
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key,
    width: col.width,
  }));
});

const scrollConfig = computed(() => {
  return props.scrollY ? { y: props.scrollY } : undefined;
});

function getMappedValue(col: DistributionColumn, value: unknown): string {
  const strValue = String(value);
  if (col.valueMap && col.valueMap[strValue]) {
    return col.valueMap[strValue];
  }
  if (col.options) {
    const option = col.options.find((o) => o.value === strValue);
    if (option) return option.label;
  }
  return strValue;
}

function getTagColor(col: DistributionColumn, value: unknown): string {
  const strValue = String(value);
  if (col.options) {
    const option = col.options.find((o) => o.value === strValue);
    if (option?.color) return option.color;
  }
  return 'blue';
}
</script>

<script lang="ts">
export default {
  name: 'DistributionTable',
};
</script>

<template>
  <Card :title="title">
    <Table
      :columns="tableColumns"
      :data-source="displayData"
      :pagination="pagination"
      :size="size"
      :scroll="scrollConfig"
    >
      <template #bodyCell="{ column, record }">
        <template v-for="col in columns" :key="col.key">
          <!-- 进度条列 -->
          <template v-if="column.key === col.key && col.showProgress">
            <Progress
              :percent="Number(record[col.dataIndex]) || 0"
              :size="60"
              :stroke-color="
                Number(record[col.dataIndex]) >= (col.progressThreshold || 50)
                  ? '#52c41a'
                  : '#faad14'
              "
            />
          </template>

          <!-- 标签列 -->
          <template v-else-if="column.key === col.key && col.isTag">
            <Tag :color="getTagColor(col, record[col.dataIndex])">
              {{ getMappedValue(col, record[col.dataIndex]) }}
            </Tag>
          </template>

          <!-- 值映射列（非标签） -->
          <template
            v-else-if="column.key === col.key && (col.valueMap || col.options)"
          >
            {{ getMappedValue(col, record[col.dataIndex]) }}
          </template>
        </template>
      </template>
    </Table>
    <Empty v-if="!displayData.length" :description="emptyText" />
  </Card>
</template>
