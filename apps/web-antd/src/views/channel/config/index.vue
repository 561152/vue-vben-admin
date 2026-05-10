<script setup lang="ts">
import ChannelLandingGrid from '../components/ChannelLandingGrid.vue';
import type { ChannelLandingItem } from '../components/channel-landing';

const channels: ChannelLandingItem[] = [
  {
    name: '企业微信',
    icon: '💬',
    desc: '配置企业微信 CorpID、应用 Secret、回调地址等',
    path: '/channel/config/wecom',
  },
  // {
  //   name: '小红书',
  //   icon: '📕',
  //   desc: '配置小红书开放平台接入',
  //   path: '/channel/config/xiaohongshu',
  // },
  // {
  //   name: '抖音',
  //   icon: '🎵',
  //   desc: '配置抖音开放平台接入',
  //   path: '/channel/config/douyin',
  // },
];
</script>

<template>
  <ChannelLandingGrid title="渠道配置" :items="channels" />
</template>
