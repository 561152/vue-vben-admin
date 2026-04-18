<script setup lang="ts">
import { Card } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const channels = [
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

function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="channel-config-page p-6">
    <h1 class="mb-6 text-2xl font-bold">渠道配置</h1>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="ch in channels"
        :key="ch.name"
        hoverable
        class="channel-card cursor-pointer"
        @click="goTo(ch.path)"
      >
        <div class="flex items-center gap-4">
          <span class="text-4xl">{{ ch.icon }}</span>
          <div>
            <div class="text-lg font-semibold">{{ ch.name }}</div>
            <div class="mt-1 text-sm text-gray-500">{{ ch.desc }}</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.channel-config-page {
  max-width: 1200px;
  margin: 0 auto;
}

.channel-card {
  transition: all 0.3s;
}

.channel-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
  transform: translateY(-4px);
}
</style>
