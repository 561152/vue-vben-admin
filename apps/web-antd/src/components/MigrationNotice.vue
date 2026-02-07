<template>
  <a-alert
    v-if="showNotice"
    :message="`此功能已迁移至「${newLocationLabel}」`"
    type="info"
    closable
    show-icon
    class="mb-4"
    @close="handleClose"
  >
    <template #icon>
      <SwapOutlined />
    </template>
    <template #description>
      <div class="migration-notice-content">
        <p>您访问的是旧路径，系统已自动跳转到新位置。</p>
        <div class="migration-notice-actions">
          <a-button type="link" size="small" @click="handleDismiss">
            我知道了
          </a-button>
        </div>
      </div>
    </template>
  </a-alert>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Alert as AAlert, Button as AButton } from 'ant-design-vue';
import { SwapOutlined } from '@ant-design/icons-vue';
import { getNewLocationLabel, getReverseRedirects } from '#/router/redirects';

/**
 * Migration Notice Component
 *
 * Phase 1: 核心菜单重组 - 迁移提示组件
 *
 * Purpose: Show notice when user is redirected from old URL to new URL
 * Usage: Add to top of migrated pages
 */

const route = useRoute();
const router = useRouter();
const showNotice = ref(false);
const newLocationLabel = ref('');

// Storage key for dismissed notices (per user)
const DISMISSED_KEY = 'route-migration-dismissed';

/**
 * Get list of dismissed migration notices from localStorage
 */
function getDismissedNotices(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save dismissed notice to localStorage
 */
function saveDismissedNotice(path: string) {
  try {
    const dismissed = getDismissedNotices();
    if (!dismissed.includes(path)) {
      dismissed.push(path);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch (error) {
    console.warn('Failed to save dismissed notice:', error);
  }
}

/**
 * Check if current page was reached via migration
 */
function checkMigrationStatus() {
  // Check if _migrated query param is present
  if (route.query._migrated === 'true') {
    const currentPath = route.path;
    const dismissedNotices = getDismissedNotices();

    // Don't show notice if user has already dismissed it for this path
    if (!dismissedNotices.includes(currentPath)) {
      showNotice.value = true;
      newLocationLabel.value = getNewLocationLabel(route.fullPath);
    }

    // Clean up the _migrated query param from URL
    const { _migrated, ...cleanQuery } = route.query;
    router.replace({
      path: route.path,
      query: cleanQuery,
    });
  } else {
    // Check if current path has any reverse redirects
    const reverseRedirects = getReverseRedirects();
    if (reverseRedirects[route.path]) {
      // This is a destination page for migrations
      // Check if we should show a persistent notice
      const dismissedNotices = getDismissedNotices();
      const currentPath = route.path;

      if (!dismissedNotices.includes(currentPath)) {
        // Show notice only on first visit after migration
        // (This handles direct navigation to the new URL)
        const hasSeenMigration = sessionStorage.getItem(`seen-migration-${currentPath}`);
        if (!hasSeenMigration) {
          showNotice.value = true;
          newLocationLabel.value = getNewLocationLabel(route.fullPath);
          sessionStorage.setItem(`seen-migration-${currentPath}`, 'true');
        }
      }
    }
  }
}

/**
 * Handle notice close (temporary dismiss for this session)
 */
function handleClose() {
  showNotice.value = false;
}

/**
 * Handle "I know" button click (permanent dismiss)
 */
function handleDismiss() {
  saveDismissedNotice(route.path);
  showNotice.value = false;
}

onMounted(() => {
  checkMigrationStatus();
});
</script>

<style scoped>
.migration-notice-content {
  font-size: 14px;
}

.migration-notice-content p {
  margin-bottom: 8px;
}

.migration-notice-actions {
  margin-top: 8px;
}
</style>
