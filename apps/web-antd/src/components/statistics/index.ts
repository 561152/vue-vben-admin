/**
 * 统计组件库
 *
 * 提供 CRM 统计页面通用组件，减少重复代码
 *
 * @example
 * ```vue
 * <script setup>
 * import {
 *   StatisticCardRow,
 *   RankingTable,
 *   TrendBarChart,
 *   StatisticsPageLayout,
 * } from '@/components/statistics';
 * import { useStatistics } from '@/hooks/useStatistics';
 * </script>
 * ```
 */

export { default as StatisticCard } from './StatisticCard.vue';
export { default as StatisticCardRow } from './StatisticCardRow.vue';
export { default as RankingTable } from './RankingTable.vue';
export { default as TrendBarChart } from './TrendBarChart.vue';
export { default as DistributionTable } from './DistributionTable.vue';
export { default as StatisticsPageLayout } from './StatisticsPageLayout.vue';

// 类型导出
export type { StatisticItem } from './StatisticCardRow.vue';
export type { RankingColumn, RankingItem } from './RankingTable.vue';
export type { TrendItem } from './TrendBarChart.vue';
export type { DistributionColumn } from './DistributionTable.vue';
