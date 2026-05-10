<script setup lang="ts">
import { Card } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import type { ChannelLandingItem } from './channel-landing';

defineProps<{
  title: string;
  items: ChannelLandingItem[];
}>();

const router = useRouter();
</script>

<template>
  <div class="channel-landing-page p-6">
    <h1 class="mb-6 text-2xl font-bold">{{ title }}</h1>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="item in items"
        :key="item.name"
        hoverable
        class="channel-landing-card cursor-pointer"
        @click="router.push(item.path)"
      >
        <div class="flex items-center gap-4">
          <span class="text-4xl">{{ item.icon }}</span>
          <div>
            <div class="text-lg font-semibold">{{ item.name }}</div>
            <div class="mt-1 text-sm text-gray-500">{{ item.desc }}</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.channel-landing-page {
  max-width: 1200px;
  margin: 0 auto;
}

.channel-landing-card {
  transition: all 0.3s;
}

.channel-landing-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
  transform: translateY(-4px);
}
</style>
