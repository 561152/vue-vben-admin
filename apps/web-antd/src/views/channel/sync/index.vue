<script setup lang="ts">
import ChannelLandingGrid from '../components/ChannelLandingGrid.vue';
import type { ChannelLandingItem } from '../components/channel-landing';

const syncItems: ChannelLandingItem[] = [
  {
    name: '企微同步',
    icon: '💬',
    desc: '同步企业微信员工、客户、部门等数据',
    path: '/channel/sync/wecom',
  },
  {
    name: '会员同步',
    icon: '👤',
    desc: '同步零售会员数据',
    path: '/channel/sync/member',
  },
];
</script>

<template>
  <ChannelLandingGrid title="数据同步" :items="syncItems" />
</template>
