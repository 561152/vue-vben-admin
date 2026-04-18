<script setup lang="ts">
import { Card } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const syncItems = [
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

function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="channel-sync-page p-6">
    <h1 class="mb-6 text-2xl font-bold">数据同步</h1>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="item in syncItems"
        :key="item.name"
        hoverable
        class="sync-card cursor-pointer"
        @click="goTo(item.path)"
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
.channel-sync-page {
  max-width: 1200px;
  margin: 0 auto;
}

.sync-card {
  transition: all 0.3s;
}

.sync-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
  transform: translateY(-4px);
}
</style>
