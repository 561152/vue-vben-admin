<script lang="ts" setup>
import { computed, type Component } from 'vue';
import { Card, Table, Progress, Tag, Empty } from 'ant-design-vue';

export interface RankingColumn {
  /** 列标题 */
  title: string;
  /** 数据字段 */
  dataIndex?: string;
  /** 列类型 */
  key: string;
  /** 列宽 */
  width?: number | string;
  /** 是否是排名列 */
  isRank?: boolean;
  /** 是否显示进度条（百分比列） */
  showProgress?: boolean;
  /** 进度条阈值（高于阈值使用绿色） */
  progressThreshold?: number;
  /** 是否是标签列 */
  isTag?: boolean;
  /** 标签颜色字段 */
  tagColorField?: string;
  /** 标签图标 */
  tagIcon?: Component;
  /** 值映射（key到显示文本） */
  valueMap?: Record<string, string>;
}

export interface RankingItem {
  [key: string]: unknown;
}

interface Props {
  /** 卡片标题 */
  title: string;
  /** 数据源 */
  dataSource: RankingItem[];
  /** 列配置 */
  columns: RankingColumn[];
  /** 显示数量限制 */
  limit?: number;
  /** 是否显示分页 */
  pagination?: boolean;
  /** 表格大小 */
  size?: 'default' | 'middle' | 'small';
  /** 空数据描述 */
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
  pagination: false,
  size: 'small',
  emptyText: '暂无数据',
});

const displayData = computed(() => {
  const data = props.dataSource.slice(0, props.limit);
  return data.map((item, index) => ({
    ...item,
    key: index,
    _rank: index + 1,
  }));
});

const tableColumns = computed(() => {
  return props.columns.map((col) => ({
    title: col.title,
    dataIndex: col.isRank ? '_rank' : col.dataIndex,
    key: col.key,
    width: col.width,
  }));
});

function getRankClass(rank: number) {
  if (rank === 1) return 'font-bold text-yellow-500';
  if (rank === 2) return 'font-bold text-gray-400';
  if (rank === 3) return 'font-bold text-amber-600';
  return '';
}
</script>

<script lang="ts">
export default {
  name: 'RankingTable',
};
</script>

<template>
  <Card :title="title">
    <Table
      :columns="tableColumns"
      :data-source="displayData"
      :pagination="pagination"
      :size="size"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-for="col in columns" :key="col.key">
          <!-- 排名列 -->
          <template v-if="column.key === col.key && col.isRank">
            <span :class="getRankClass(index + 1)">
              {{ index + 1 }}
            </span>
          </template>

          <!-- 进度条列 -->
          <template v-else-if="column.key === col.key && col.showProgress">
            <Progress
              :percent="Number(record[col.dataIndex || col.key]) || 0"
              :size="60"
              :stroke-color="
                Number(record[col.dataIndex || col.key]) >=
                (col.progressThreshold || 50)
                  ? '#52c41a'
                  : '#1890ff'
              "
            />
          </template>

          <!-- 标签列 -->
          <template v-else-if="column.key === col.key && col.isTag">
            <Tag
              :color="col.tagColorField ? String(record[col.tagColorField]) : 'blue'"
            >
              <component
                :is="col.tagIcon"
                v-if="col.tagIcon"
                class="mr-1"
              />
              {{
                col.valueMap
                  ? col.valueMap[String(record[col.dataIndex || col.key])] ||
                    record[col.dataIndex || col.key]
                  : record[col.dataIndex || col.key]
              }}
            </Tag>
          </template>

          <!-- 值映射列 -->
          <template
            v-else-if="column.key === col.key && col.valueMap && !col.isTag"
          >
            {{
              col.valueMap[String(record[col.dataIndex || col.key])] ||
              record[col.dataIndex || col.key]
            }}
          </template>
        </template>
      </template>
    </Table>
    <Empty
      v-if="!displayData.length"
      :description="emptyText"
    />
  </Card>
</template>
