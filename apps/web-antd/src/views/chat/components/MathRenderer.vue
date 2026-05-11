<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps<{
  content: string;
  displayMode?: boolean;
}>();

const containerRef = ref<HTMLElement | null>(null);

// 渲染 LaTeX 公式
const renderMath = () => {
  if (!containerRef.value) return;

  let html = props.content;

  // 替换 display mode 公式 $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 替换 inline mode 公式 $...$
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 替换 LaTeX 分数 \frac{a}{b}
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, a, b) => {
    try {
      return katex.renderToString(`\\frac{${a}}{${b}}`, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `${a}/${b}`;
    }
  });

  // 替换平方根 \sqrt{x}
  html = html.replace(/\\sqrt\{([^}]+)\}/g, (_, x) => {
    try {
      return katex.renderToString(`\\sqrt{${x}}`, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `√${x}`;
    }
  });

  // 替换上标 x^2 或 x^{abc}
  html = html.replace(/(\w)\^(\d+|\{[^}]+\})/g, (match, base, exp) => {
    const expContent = exp.startsWith('{') ? exp.slice(1, -1) : exp;
    try {
      return katex.renderToString(`${base}^{${expContent}}`, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  containerRef.value.innerHTML = html;
};

onMounted(renderMath);
watch(() => props.content, renderMath);
</script>

<template>
  <span
    ref="containerRef"
    class="math-renderer"
    :class="{ 'display-mode': displayMode }"
  ></span>
</template>

<style scoped>
.math-renderer {
  line-height: 1.6;
}

.math-renderer.display-mode {
  display: block;
  margin: 16px 0;
  text-align: center;
}

.math-renderer :deep(.katex) {
  font-size: 1.1em;
}

.math-renderer :deep(.katex-display) {
  margin: 0.5em 0;
}

.math-renderer :deep(.math-error) {
  padding: 2px 4px;
  color: #ff4d4f;
  background: #fff1f0;
  border-radius: 2px;
}
</style>
