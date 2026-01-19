<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import {
  Drawer,
  Button,
  Form,
  Input,
  Select,
  message,
  Space,
  Divider,
} from 'ant-design-vue';
import {
  SaveOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';

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

// Drawer state
const drawerVisible = ref(false);
const selectedNode = ref<any>(null);

// Form state
const nodeForm = ref({
  name: '',
  type: 'llm',
  componentKey: '',
  prompt: '',
});

// Node types
const nodeTypes = [
  { value: 'llm', label: 'LLM 节点', description: '大语言模型调用' },
  { value: 'ocr', label: 'OCR 节点', description: '图像文字识别' },
  { value: 'transform', label: '转换节点', description: '数据转换映射' },
  { value: 'condition', label: '条件节点', description: '条件分支判断' },
];

// Component options (models)
const componentOptions = [
  { value: 'qwen-vl-plus', label: 'Qwen-VL-Plus' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-opus', label: 'Claude Opus' },
];

// History for undo/redo
const history = ref<{ nodes: any[]; edges: any[] }[]>([]);
const historyIndex = ref(-1);

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

  // Populate form with node data
  nodeForm.value = {
    name: event.node.data.name || '',
    type: event.node.data.type || 'llm',
    componentKey: event.node.data.componentRef?.key || '',
    prompt: event.node.data.config?.prompt || '',
  };

  drawerVisible.value = true;
};

// Save node configuration
const saveNodeConfig = () => {
  if (!selectedNode.value) return;

  // Update node data
  const nodeIndex = nodes.value.findIndex(
    (n) => n.id === selectedNode.value.id,
  );
  if (nodeIndex !== -1) {
    nodes.value[nodeIndex].data = {
      ...nodes.value[nodeIndex].data,
      name: nodeForm.value.name,
      label: nodeForm.value.name,
      type: nodeForm.value.type,
      componentRef: nodeForm.value.componentKey
        ? {
            type: 'MODEL',
            key: nodeForm.value.componentKey,
          }
        : undefined,
      config: {
        prompt: nodeForm.value.prompt,
      },
    };
  }

  saveHistory();
  drawerVisible.value = false;
  message.success('节点配置已保存');
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

  saveHistory();
  drawerVisible.value = false;
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

// Add new node
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
      type: 'llm',
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
        type: node.data.type || 'llm',
        componentRef: node.data.componentRef,
        config: node.data.config || {},
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
  <div class="pipeline-editor">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      @node-click="onNodeClick"
      @connect="handleConnect"
      fit-view-on-init
    >
      <Background />
      <Controls />
      <MiniMap />

      <Panel position="top-center" class="controls-panel">
        <Space>
          <Button @click="addNewNode" type="primary"> 添加节点 </Button>
          <Button @click="autoLayout">
            <template #icon><BorderOutlined /></template>
            自动整理
          </Button>
          <Button @click="undo" :disabled="!canUndo">
            <template #icon><UndoOutlined /></template>
            撤销
          </Button>
          <Button @click="redo" :disabled="!canRedo">
            <template #icon><RedoOutlined /></template>
            重做
          </Button>
          <Divider type="vertical" />
          <Button type="primary" @click="savePipeline">
            <template #icon><SaveOutlined /></template>
            保存流程
          </Button>
        </Space>
      </Panel>
    </VueFlow>

    <!-- Node Configuration Drawer -->
    <Drawer
      v-model:open="drawerVisible"
      title="节点配置"
      width="450"
      placement="right"
      :footer-style="{ textAlign: 'right' }"
    >
      <Form v-if="selectedNode" :model="nodeForm" layout="vertical">
        <Form.Item label="节点名称" required>
          <Input v-model:value="nodeForm.name" placeholder="输入节点名称" />
        </Form.Item>

        <Form.Item label="节点类型" required>
          <Select v-model:value="nodeForm.type" placeholder="选择节点类型">
            <Select.Option
              v-for="type in nodeTypes"
              :key="type.value"
              :value="type.value"
            >
              <div>
                <div>{{ type.label }}</div>
                <div style="font-size: 12px; color: #999">
                  {{ type.description }}
                </div>
              </div>
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item v-if="nodeForm.type === 'llm'" label="模型选择" required>
          <Select v-model:value="nodeForm.componentKey" placeholder="选择模型">
            <Select.Option
              v-for="comp in componentOptions"
              :key="comp.value"
              :value="comp.value"
            >
              {{ comp.label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item v-if="nodeForm.type === 'llm'" label="Prompt 模板">
          <Input.TextArea
            v-model:value="nodeForm.prompt"
            placeholder="输入 Prompt，可使用 {{ 变量名 }} 引用上游节点输出"
            :rows="10"
          />
          <div class="form-hint">
            使用 <code v-pre>{{ stepKey.output }}</code> 引用上游节点输出
          </div>
        </Form.Item>
      </Form>

      <template #footer>
        <Space>
          <Button danger @click="deleteSelectedNode">
            <template #icon><DeleteOutlined /></template>
            删除节点
          </Button>
          <Button @click="drawerVisible = false">取消</Button>
          <Button type="primary" @click="saveNodeConfig">确定</Button>
        </Space>
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
.pipeline-editor {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 600px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.controls-panel {
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.form-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.form-hint code {
  padding: 2px 6px;
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  border-radius: 3px;
}
</style>
