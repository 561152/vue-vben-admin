<script setup lang="ts">
import ChannelLandingGrid from '../components/ChannelLandingGrid.vue';
import type { ChannelLandingItem } from '../components/channel-landing';

const assetItems: ChannelLandingItem[] = [
  {
    name: '员工管理',
    icon: '👥',
    desc: '管理同步过来的企微员工数据',
    path: '/channel/assets/users',
  },
  {
    name: '群聊管理',
    icon: '💬',
    desc: '管理同步过来的企微群聊（开发中）',
    path: '/channel/assets/groups',
  },
];
</script>

<template>
  <ChannelLandingGrid title="渠道资产" :items="assetItems" />
</template>
