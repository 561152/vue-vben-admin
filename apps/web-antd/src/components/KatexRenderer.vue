<template>
  <div class="katex-renderer">
    <div v-if="error" class="error-message">
      <span>公式渲染错误：{{ error }}</span>
    </div>
    <div v-else class="katex-content" v-html="renderedHtml"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

interface Props {
  latex?: string;
  displayMode?: boolean;
  throwOnError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  latex: '',
  displayMode: false,
  throwOnError: false,
});

const error = ref<string | null>(null);

// 简单的 LaTeX 渲染（实际项目中应该使用 KaTeX 库）
const renderedHtml = computed(() => {
  if (!props.latex) {
    return '';
  }

  try {
    error.value = null;

    // 简单的 LaTeX 转换（实际应该使用 KaTeX）
    // 这里只是一个占位实现，确保构建通过
    let html = props.latex
      .replace(/\\\[/g, '<div class="katex-display">')
      .replace(/\\\]/g, '</div>')
      .replace(/\\\(/g, '<span class="katex-inline">')
      .replace(/\\\)/g, '</span>')
      .replace(/\$/g, '');

    if (props.displayMode) {
      html = `<div class="katex-display">${html}</div>`;
    } else {
      html = `<span class="katex-inline">${html}</span>`;
    }

    return html;
  } catch (e: any) {
    error.value = e.message;
    return props.throwOnError ? '' : props.latex;
  }
});

watch(
  () => props.latex,
  () => {
    error.value = null;
  },
);
</script>

<style scoped lang="less">
.katex-renderer {
  .error-message {
    color: #ff4d4f;
    padding: 8px;
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 2px;
    font-size: 14px;
  }

  .katex-content {
    :deep(.katex-display) {
      display: block;
      margin: 16px 0;
      text-align: center;
      font-size: 18px;
    }

    :deep(.katex-inline) {
      display: inline;
      font-size: inherit;
    }
  }
}
</style>
