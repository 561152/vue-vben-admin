<script setup lang="ts">
import { computed } from 'vue';
import type { SpanRow } from '#/api/ai-studio/trace';

const props = defineProps<{ spans: SpanRow[]; selectedId?: string }>();
const emit = defineEmits<{ select: [span: SpanRow] }>();

interface TreeNode {
  title: string;
  key: string;
  span: SpanRow;
  children: TreeNode[];
}

const treeData = computed(() => {
  const nodes = new Map<string, TreeNode>();
  for (const span of props.spans) {
    nodes.set(span.span_id, {
      title: `${span.name} · ${span.duration_ms ?? '-'}ms`,
      key: span.span_id,
      span,
      children: [],
    });
  }
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.span.parent_span_id;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
});

function handleSelect(keys: unknown[], info: { node?: { span?: SpanRow } }) {
  const span =
    info.node?.span ?? props.spans.find((item) => item.span_id === keys[0]);
  if (span) emit('select', span);
}
</script>

<template>
  <a-card size="small" title="Span Tree">
    <a-empty v-if="treeData.length === 0" description="没有 span 数据" />
    <a-tree
      v-else
      :tree-data="treeData"
      :selected-keys="selectedId ? [selectedId] : []"
      default-expand-all
      @select="handleSelect"
    />
  </a-card>
</template>
