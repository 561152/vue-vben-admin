<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';

interface StepExecution {
  stepKey: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

interface Props {
  pipelineSteps: any[];
  stepExecutions: StepExecution[];
}

const props = defineProps<Props>();

const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);

// Status colors
const STATUS_COLORS = {
  PENDING: '#d9d9d9', // Gray
  RUNNING: '#faad14', // Orange/Yellow
  COMPLETED: '#52c41a', // Green
  FAILED: '#f5222d', // Red
};

// Initialize flow visualization
const initializeFlow = () => {
  if (!props.pipelineSteps || props.pipelineSteps.length === 0) {
    return;
  }

  // Create nodes from pipeline steps
  const newNodes = props.pipelineSteps.map((step, index) => {
    // Find execution status for this step
    const execution = props.stepExecutions.find(
      (se) => se.stepKey === step.stepKey,
    );

    const status = execution?.status || 'PENDING';
    const borderColor = STATUS_COLORS[status];

    return {
      id: step.stepKey,
      type: 'default',
      position: { x: 100 + index * 200, y: 100 },
      data: {
        label: step.name,
      },
      style: {
        border: `3px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '10px',
        backgroundColor: 'white',
        boxShadow:
          status === 'RUNNING'
            ? `0 0 10px ${borderColor}`
            : '0 2px 4px rgba(0,0,0,0.1)',
      },
    };
  });

  // Create edges from dependencies
  const newEdges: any[] = [];
  props.pipelineSteps.forEach((step) => {
    if (step.dependencies && step.dependencies.length > 0) {
      step.dependencies.forEach((depStepKey: string) => {
        const depExecution = props.stepExecutions.find(
          (se) => se.stepKey === depStepKey,
        );
        const edgeColor =
          depExecution?.status === 'COMPLETED' ? '#52c41a' : '#d9d9d9';

        newEdges.push({
          id: `${depStepKey}-${step.stepKey}`,
          source: depStepKey,
          target: step.stepKey,
          type: 'smoothstep',
          animated: depExecution?.status === 'RUNNING',
          style: {
            stroke: edgeColor,
            strokeWidth: 2,
          },
        });
      });
    }
  });

  nodes.value = newNodes;
  edges.value = newEdges;
};

// Watch for prop changes
watch(
  () => [props.pipelineSteps, props.stepExecutions],
  () => {
    initializeFlow();
  },
  { deep: true },
);

onMounted(() => {
  initializeFlow();
});
</script>

<template>
  <div class="execution-flow-view">
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot" style="background: #d9d9d9"></div>
        <span>等待中</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: #faad14"></div>
        <span>运行中</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: #52c41a"></div>
        <span>已完成</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: #f5222d"></div>
        <span>失败</span>
      </div>
    </div>

    <VueFlow
      :nodes="nodes"
      :edges="edges"
      fit-view-on-init
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
    >
      <Background />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<style scoped>
.execution-flow-view {
  width: 100%;
  height: 400px;
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #f5f5f5;
}

.legend {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
