<template>
  <div class="mode-content">
    <slot v-if="shouldDisplay" :name="currentSlot" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserModeStore } from '#/store/modules/user-mode';

// ==================== Props ====================

interface Props {
  mode?: 'PARENT' | 'CHILD' | 'BOTH'; // 指定此内容适用的模式
  feature?: string; // 基于功能开关的显示控制
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'BOTH',
});

// ==================== State ====================

const modeStore = useUserModeStore();

// ==================== Computed ====================

const shouldDisplay = computed(() => {
  // 基于功能开关
  if (props.feature) {
    return modeStore.shouldShow(props.feature as any);
  }

  // 基于模式
  if (props.mode === 'BOTH') {
    return true;
  }

  return modeStore.currentMode === props.mode;
});

const currentSlot = computed(() => {
  return modeStore.isParentMode ? 'parent' : 'child';
});
</script>

<style scoped lang="less">
.mode-content {
  width: 100%;
}
</style>
