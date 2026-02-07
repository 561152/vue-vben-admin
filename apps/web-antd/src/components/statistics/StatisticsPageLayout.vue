<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { Button, Spin } from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';

interface Props {
  /** 页面标题 */
  title: string;
  /** 返回路径 */
  backPath?: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 加载状态 */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  backPath: '',
  showBack: true,
  loading: false,
});

const router = useRouter();

function goBack() {
  if (props.backPath) {
    router.push(props.backPath);
  } else {
    router.back();
  }
}
</script>

<script lang="ts">
export default {
  name: 'StatisticsPageLayout',
};
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button v-if="showBack" @click="goBack">
          <template #icon><ArrowLeftOutlined /></template>
        </Button>
        <h2 class="m-0 text-xl font-bold">{{ title }}</h2>
      </div>
      <div>
        <slot name="actions" />
      </div>
    </div>

    <Spin :spinning="loading">
      <slot />
    </Spin>
  </div>
</template>
