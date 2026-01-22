<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import {
  Button,
  message,
  Space,
  Divider,
  Tooltip,
} from 'ant-design-vue';
import {
  SaveOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  BugOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

// Import custom components
import ComponentPalette from './ComponentPalette.vue';
import DebugPanel from './DebugPanel.vue';
import NodeConfigPanel from './NodeConfigPanel.vue';

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

interface PipelineStep {
  stepKey: string;
  name: string;
  type: string;
  componentRef?: {
    type: string;
    key: string;
  };
  config?: Record<string, any>;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  condition?: string;
  dependencies?: string[];
}

interface Props {
  pipelineKey: string;
  steps?: PipelineStep[];
}

interface Emits {
  (e: 'save', steps: PipelineStep[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Vue Flow composable
const {
  nodes,
  edges,
  addNodes,
  addEdges,
  onConnect,
  removeNodes,
  removeEdges,
  fitView,
} = useVueFlow();

// Panel visibility states
const showComponentPalette = ref(true);
const showDebugPanel = ref(false);
const showNodeConfigPanel = ref(true);

// Selected node for config panel
const selectedNode = ref<any>(null);
const selectedNodeData = ref<PipelineStep | null>(null);

// Highlighted step (from debug panel)
const highlightedStepKey = ref<string | null>(null);

// Node types with colors
const nodeTypeConfig: Record<string, { color: string; bgColor: string }> = {
  llm: { color: '#1890ff', bgColor: '#e6f7ff' },
  ocr: { color: '#52c41a', bgColor: '#f6ffed' },
  tool: { color: '#722ed1', bgColor: '#f9f0ff' },
  retrieval: { color: '#fa8c16', bgColor: '#fff7e6' },
  transform: { color: '#8c8c8c', bgColor: '#fafafa' },
  start: { color: '#13c2c2', bgColor: '#e6fffb' },
};

// History for undo/redo
const history = ref<{ nodes: any[]; edges: any[] }[]>([]);
const historyIndex = ref(-1);

// Available steps for node config panel
const availableSteps = computed(() => {
  return nodes.value
    .filter((node) => node.data.type !== 'start')
    .map((node) => ({
      stepKey: node.data.stepKey || node.id,
      name: node.data.name || node.data.label,
      outputSchema: node.data.outputSchema,
    }));
});

// Convert pipeline steps to Vue Flow nodes and edges
const initializeFlow = () => {
  if (!props.steps || props.steps.length === 0) {
    // Create a default start node
    const defaultNode = {
      id: 'start',
      type: 'default',
      position: { x: 100, y: 100 },
      data: {
        label: '开始',
        stepKey: 'start',
        name: '开始',
        type: 'start',
      },
    };
    addNodes([defaultNode]);
    saveHistory();
    return;
  }

  // Convert steps to nodes
  const newNodes = props.steps.map((step, index) => ({
    id: step.stepKey,
    type: 'default',
    position: { x: 100 + index * 200, y: 100 },
    data: {
      label: step.name,
      stepKey: step.stepKey,
      name: step.name,
      type: step.type,
      componentRef: step.componentRef,
      config: step.config || {},
    },
  }));

  // Convert dependencies to edges
  const newEdges: any[] = [];
  props.steps.forEach((step) => {
    if (step.dependencies && step.dependencies.length > 0) {
      step.dependencies.forEach((depStepKey) => {
        newEdges.push({
          id: `${depStepKey}-${step.stepKey}`,
          source: depStepKey,
          target: step.stepKey,
          type: 'smoothstep',
          animated: true,
        });
      });
    }
  });

  addNodes(newNodes);
  addEdges(newEdges);

  // Fit view after adding nodes
  setTimeout(() => {
    fitView({ padding: 0.2 });
  }, 100);

  saveHistory();
};

// Save current state to history
const saveHistory = () => {
  const currentState = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value)),
  };

  // Remove future history if we're not at the end
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  history.value.push(currentState);
  historyIndex.value = history.value.length - 1;

  // Limit history to 50 states
  if (history.value.length > 50) {
    history.value.shift();
    historyIndex.value--;
  }
};

// Undo
const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const state = history.value[historyIndex.value];
    nodes.value = JSON.parse(JSON.stringify(state.nodes));
    edges.value = JSON.parse(JSON.stringify(state.edges));
    message.info('已撤销');
  }
};

// Redo
const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const state = history.value[historyIndex.value];
    nodes.value = JSON.parse(JSON.stringify(state.nodes));
    edges.value = JSON.parse(JSON.stringify(state.edges));
    message.info('已重做');
  }
};

// Can undo/redo
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

// Handle node click
const onNodeClick = (event: any) => {
  selectedNode.value = event.node;

  // Populate node data for config panel
  selectedNodeData.value = {
    stepKey: event.node.data.stepKey || event.node.id,
    name: event.node.data.name || event.node.data.label,
    type: event.node.data.type || 'tool',
    componentRef: event.node.data.componentRef,
    config: event.node.data.config || {},
    inputMapping: event.node.data.inputMapping || {},
    outputMapping: event.node.data.outputMapping || {},
    condition: event.node.data.condition,
    dependencies: getDependencies(event.node.id),
  };

  showNodeConfigPanel.value = true;
};

// Get dependencies for a node
const getDependencies = (nodeId: string): string[] => {
  return edges.value
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);
};

// Handle drag over for component palette
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

// Handle drop from component palette
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer) return;

  try {
    const componentData = JSON.parse(event.dataTransfer.getData('application/json'));

    // Calculate drop position relative to the flow container
    const flowContainer = (event.target as HTMLElement).closest('.vue-flow');
    if (!flowContainer) return;

    const rect = flowContainer.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    // Create new node from dropped component
    const newId = `${componentData.key}_${Date.now()}`;
    const newNode = {
      id: newId,
      type: 'default',
      position,
      data: {
        label: componentData.name,
        stepKey: newId,
        name: componentData.name,
        type: componentData.type.toLowerCase(),
        componentRef: {
          type: componentData.type,
          key: componentData.key,
        },
        config: {},
        inputMapping: {},
        outputMapping: {},
      },
      style: {
        background: nodeTypeConfig[componentData.type.toLowerCase()]?.bgColor || '#fafafa',
        borderColor: nodeTypeConfig[componentData.type.toLowerCase()]?.color || '#d9d9d9',
        borderWidth: '2px',
      },
    };

    addNodes([newNode]);
    saveHistory();
    message.success(`已添加组件: ${componentData.name}`);
  } catch (e) {
    console.error('Failed to parse dropped component:', e);
  }
};

// Handle component click from palette
const handleComponentClick = (component: any) => {
  // Add node at center of canvas
  const newId = `${component.key}_${Date.now()}`;
  const newNode = {
    id: newId,
    type: 'default',
    position: { x: 300, y: 200 },
    data: {
      label: component.name,
      stepKey: newId,
      name: component.name,
      type: component.type.toLowerCase(),
      componentRef: {
        type: component.type,
        key: component.key,
      },
      config: {},
      inputMapping: {},
      outputMapping: {},
    },
    style: {
      background: nodeTypeConfig[component.type.toLowerCase()]?.bgColor || '#fafafa',
      borderColor: nodeTypeConfig[component.type.toLowerCase()]?.color || '#d9d9d9',
      borderWidth: '2px',
    },
  };

  addNodes([newNode]);
  saveHistory();
  message.success(`已添加组件: ${component.name}`);
};

// Handle node config update
const handleNodeConfigUpdate = (nodeData: PipelineStep) => {
  if (!selectedNode.value) return;

  const nodeIndex = nodes.value.findIndex((n) => n.id === selectedNode.value.id);
  if (nodeIndex !== -1) {
    nodes.value[nodeIndex].data = {
      ...nodes.value[nodeIndex].data,
      ...nodeData,
      label: nodeData.name,
    };

    // Update edges based on dependencies
    const currentDeps = getDependencies(selectedNode.value.id);
    const newDeps = nodeData.dependencies || [];

    // Remove edges that are no longer dependencies
    currentDeps.forEach((dep) => {
      if (!newDeps.includes(dep)) {
        const edgeIndex = edges.value.findIndex(
          (e) => e.source === dep && e.target === selectedNode.value.id
        );
        if (edgeIndex !== -1) {
          edges.value.splice(edgeIndex, 1);
        }
      }
    });

    // Add new dependency edges
    newDeps.forEach((dep) => {
      if (!currentDeps.includes(dep)) {
        addEdges([{
          id: `${dep}-${selectedNode.value.id}`,
          source: dep,
          target: selectedNode.value.id,
          type: 'smoothstep',
          animated: true,
        }]);
      }
    });
  }

  saveHistory();
  message.success('节点配置已保存');
};

// Handle node delete from config panel
const handleNodeConfigDelete = () => {
  if (!selectedNode.value) return;
  deleteSelectedNode();
};

// Handle step highlight from debug panel
const handleStepHighlight = (stepKey: string | null) => {
  highlightedStepKey.value = stepKey;

  // Update node styles based on highlight
  nodes.value.forEach((node) => {
    if (stepKey && node.data.stepKey === stepKey) {
      node.style = {
        ...node.style,
        boxShadow: '0 0 10px 3px #1890ff',
      };
    } else {
      node.style = {
        ...node.style,
        boxShadow: 'none',
      };
    }
  });
};

// Delete selected node
const deleteSelectedNode = () => {
  if (!selectedNode.value) return;

  // Remove connected edges
  const connectedEdges = edges.value.filter(
    (e) =>
      e.source === selectedNode.value.id || e.target === selectedNode.value.id,
  );
  removeEdges(connectedEdges);

  // Remove node
  removeNodes([selectedNode.value]);

  selectedNode.value = null;
  selectedNodeData.value = null;

  saveHistory();
  message.success('节点已删除');
};

// Handle connection
const handleConnect = (params: any) => {
  // Validate connection
  const sourceNode = nodes.value.find((n) => n.id === params.source);
  const targetNode = nodes.value.find((n) => n.id === params.target);

  if (!sourceNode || !targetNode) return;

  // Prevent self-connection
  if (params.source === params.target) {
    message.warning('不能连接到自身');
    return;
  }

  // Check for cycles (simple check)
  const existingPath = findPath(params.target, params.source);
  if (existingPath) {
    message.warning('不能创建循环依赖');
    return;
  }

  addEdges([
    {
      ...params,
      type: 'smoothstep',
      animated: true,
    },
  ]);

  saveHistory();
};

// Find path between two nodes (for cycle detection)
const findPath = (
  from: string,
  to: string,
  visited = new Set<string>(),
): boolean => {
  if (from === to) return true;
  if (visited.has(from)) return false;

  visited.add(from);

  const outgoingEdges = edges.value.filter((e) => e.source === from);
  for (const edge of outgoingEdges) {
    if (findPath(edge.target, to, visited)) {
      return true;
    }
  }

  return false;
};

// Auto layout (simple grid layout for now)
const autoLayout = () => {
  const columns = Math.ceil(Math.sqrt(nodes.value.length));
  const cellWidth = 250;
  const cellHeight = 150;

  nodes.value.forEach((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    node.position = {
      x: 100 + col * cellWidth,
      y: 100 + row * cellHeight,
    };
  });

  saveHistory();
  message.success('已自动整理布局');
};

// Add new node (generic)
const addNewNode = () => {
  const newId = `node_${Date.now()}`;
  const newNode = {
    id: newId,
    type: 'default',
    position: { x: 250, y: 250 },
    data: {
      label: '新节点',
      stepKey: newId,
      name: '新节点',
      type: 'tool',
      config: {},
      inputMapping: {},
      outputMapping: {},
    },
    style: {
      background: nodeTypeConfig.tool.bgColor,
      borderColor: nodeTypeConfig.tool.color,
      borderWidth: '2px',
    },
  };

  addNodes([newNode]);
  saveHistory();
  message.success('已添加新节点');
};

// Convert nodes and edges back to pipeline steps
const exportSteps = (): PipelineStep[] => {
  return nodes.value
    .filter((node) => node.data.type !== 'start')
    .map((node) => {
      // Find all incoming edges to get dependencies
      const dependencies = edges.value
        .filter((e) => e.target === node.id)
        .map((e) => e.source);

      return {
        stepKey: node.data.stepKey || node.id,
        name: node.data.name || node.data.label,
        type: node.data.type || 'tool',
        componentRef: node.data.componentRef,
        config: node.data.config || {},
        inputMapping: node.data.inputMapping || {},
        outputMapping: node.data.outputMapping || {},
        condition: node.data.condition,
        dependencies: dependencies.length > 0 ? dependencies : undefined,
      };
    });
};

// Save pipeline
const savePipeline = () => {
  const steps = exportSteps();
  emit('save', steps);
};

// Watch for prop changes
watch(
  () => props.steps,
  () => {
    if (props.steps && props.steps.length > 0) {
      nodes.value = [];
      edges.value = [];
      history.value = [];
      historyIndex.value = -1;
      initializeFlow();
    }
  },
);

onMounted(() => {
  initializeFlow();
});

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
      event.preventDefault();
      redo();
    } else if (event.key === 's') {
      event.preventDefault();
      savePipeline();
    }
  } else if (event.key === 'Delete' && selectedNode.value) {
    deleteSelectedNode();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="pipeline-editor-container">
    <!-- Left: Component Palette -->
    <ComponentPalette
      v-if="showComponentPalette"
      @component-click="handleComponentClick"
    />

    <!-- Center: Flow Editor -->
    <div class="pipeline-editor">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        @node-click="onNodeClick"
        @connect="handleConnect"
        @dragover="handleDragOver"
        @drop="handleDrop"
        fit-view-on-init
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-center" class="controls-panel">
          <Space>
            <Tooltip title="组件面板">
              <Button
                :type="showComponentPalette ? 'primary' : 'default'"
                @click="showComponentPalette = !showComponentPalette"
              >
                <template #icon><AppstoreOutlined /></template>
              </Button>
            </Tooltip>
            <Button @click="autoLayout">
              <template #icon><BorderOutlined /></template>
              自动整理
            </Button>
            <Button @click="undo" :disabled="!canUndo">
              <template #icon><UndoOutlined /></template>
            </Button>
            <Button @click="redo" :disabled="!canRedo">
              <template #icon><RedoOutlined /></template>
            </Button>
            <Divider type="vertical" />
            <Tooltip title="调试面板">
              <Button
                :type="showDebugPanel ? 'primary' : 'default'"
                @click="showDebugPanel = !showDebugPanel"
              >
                <template #icon><BugOutlined /></template>
              </Button>
            </Tooltip>
            <Tooltip title="配置面板">
              <Button
                :type="showNodeConfigPanel ? 'primary' : 'default'"
                @click="showNodeConfigPanel = !showNodeConfigPanel"
              >
                <template #icon><SettingOutlined /></template>
              </Button>
            </Tooltip>
            <Divider type="vertical" />
            <Button type="primary" @click="savePipeline">
              <template #icon><SaveOutlined /></template>
              保存流程
            </Button>
          </Space>
        </Panel>
      </VueFlow>
    </div>

    <!-- Right: Debug Panel or Node Config Panel -->
    <DebugPanel
      v-if="showDebugPanel"
      :pipeline-key="pipelineKey"
      :steps="availableSteps"
      @step-highlight="handleStepHighlight"
    />
    <NodeConfigPanel
      v-else-if="showNodeConfigPanel"
      :node="selectedNodeData"
      :available-steps="availableSteps"
      @update="handleNodeConfigUpdate"
      @delete="handleNodeConfigDelete"
      @close="selectedNodeData = null"
    />
  </div>
</template>

<style scoped>
.pipeline-editor-container {
  display: flex;
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 600px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.pipeline-editor {
  position: relative;
  flex: 1;
  min-width: 0;
  background: #f5f5f5;
}

.controls-panel {
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

/* Node highlighting animation */
:deep(.vue-flow__node) {
  transition: box-shadow 0.3s ease;
}

:deep(.vue-flow__node.selected) {
  box-shadow: 0 0 0 2px #1890ff;
}

/* Custom node styles */
:deep(.vue-flow__node-default) {
  border-radius: 8px;
  border-style: solid;
}
</style>
