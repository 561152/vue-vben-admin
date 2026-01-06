<script setup lang="ts">
import { Empty } from 'ant-design-vue';

import type { StatisticsApi } from '#/api/crm/statistics';

// ===================================
// Props 定义
// ===================================

interface Props {
  data: StatisticsApi.FollowUpStats | null;
}

withDefaults(defineProps<Props>(), {
  data: null,
});

// ===================================
// 工具函数
// ===================================

/**
 * 获取排名徽章样式类
 * @param index 排名索引（从0开始）
 */
function getRankBadgeClass(index: number): string {
  if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-500';
  if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-600';
  return 'bg-gradient-to-r from-blue-400 to-blue-600';
}

/**
 * 获取排名颜色
 * @param index 排名索引（从0开始）
 */
function getRankColor(index: number): string {
  if (index === 0) return '#faad14';
  if (index === 1) return '#8c8c8c';
  if (index === 2) return '#fa8c16';
  return '#1890ff';
}
</script>

<template>
  <div>
    <div v-if="data?.byUser && data.byUser.length > 0" class="p-4">
      <div
        v-for="(user, index) in data.byUser"
        :key="user.userId"
        class="mb-3 flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0"
      >
        <!-- 排名和用户信息 -->
        <div class="flex items-center gap-3">
          <!-- 排名徽章 -->
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
            :class="getRankBadgeClass(index)"
          >
            {{ index + 1 }}
          </div>

          <!-- 用户信息 -->
          <div>
            <div class="text-base font-medium">{{ user.userName }}</div>
            <div class="text-xs text-gray-500">ID: {{ user.userId }}</div>
          </div>
        </div>

        <!-- 跟进数量 -->
        <div class="text-2xl font-bold" :style="{ color: getRankColor(index) }">
          {{ user.count }}
        </div>
      </div>
    </div>

    <!-- 空数据状态 -->
    <Empty
      v-else
      description="暂无数据"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      class="py-20"
    />
  </div>
</template>
