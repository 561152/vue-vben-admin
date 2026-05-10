<script setup lang="ts">
import ChannelLandingGrid from '../components/ChannelLandingGrid.vue';
import type { ChannelLandingItem } from '../components/channel-landing';

const recordItems: ChannelLandingItem[] = [
  {
    name: '统计分析',
    icon: '📊',
    desc: '查看各渠道同步数据统计',
    path: '/channel/records/statistics',
  },
  {
    name: '任务记录',
    icon: '📋',
    desc: '查看同步任务执行记录',
    path: '/channel/records/tasks',
  },
];
</script>

<template>
  <ChannelLandingGrid title="同步记录" :items="recordItems" />
</template>
