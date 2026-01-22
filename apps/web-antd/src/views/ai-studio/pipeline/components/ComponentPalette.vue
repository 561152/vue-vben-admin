<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  Input,
  Collapse,
  Tag,
  Empty,
  Spin,
  Tooltip,
  Badge,
} from 'ant-design-vue';
import {
  SearchOutlined,
  RobotOutlined,
  ScanOutlined,
  ToolOutlined,
  DatabaseOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  DragOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';

interface ComponentItem {
  id: number;
  key: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  configSchema?: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

interface Props {
  selectedType?: string;
}

interface Emits {
  (e: 'drag-start', component: ComponentItem): void;
  (e: 'component-click', component: ComponentItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchKeyword = ref('');
const loading = ref(false);
const components = ref<ComponentItem[]>([]);
const recentlyUsed = ref<ComponentItem[]>([]);
const activeKeys = ref([
  'llm',
  'ocr',
  'tool',
  'retrieval',
  'transform',
  'recent',
]);

// 组件类型配置
const typeConfig: Record<string, { label: string; color: string; icon: any }> =
  {
    MODEL: { label: 'LLM 模型', color: '#1890ff', icon: RobotOutlined },
    LLM: { label: 'LLM 模型', color: '#1890ff', icon: RobotOutlined },
    OCR: { label: 'OCR 识别', color: '#52c41a', icon: ScanOutlined },
    TOOL: { label: '业务工具', color: '#722ed1', icon: ToolOutlined },
    RETRIEVAL: { label: '向量检索', color: '#fa8c16', icon: DatabaseOutlined },
    TRANSFORM: { label: '数据转换', color: '#8c8c8c', icon: SwapOutlined },
  };

// 按类型分组的组件
const groupedComponents = computed(() => {
  const filtered = components.value.filter(
    (c) =>
      !searchKeyword.value ||
      c.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      c.key.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (c.description &&
        c.description
          .toLowerCase()
          .includes(searchKeyword.value.toLowerCase())),
  );

  const groups: Record<string, ComponentItem[]> = {
    llm: [],
    ocr: [],
    tool: [],
    retrieval: [],
    transform: [],
  };

  filtered.forEach((comp) => {
    const type = comp.type.toLowerCase();
    if (type === 'model' || type === 'llm') {
      groups.llm.push(comp);
    } else if (groups[type]) {
      groups[type].push(comp);
    } else {
      groups.tool.push(comp);
    }
  });

  return groups;
});

// 获取组件列表
const fetchComponents = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/ai-studio/components');
    if (Array.isArray(response)) {
      components.value = response;
    } else if (response.data) {
      components.value = response.data;
    }

    // 加载最近使用的组件
    loadRecentlyUsed();
  } catch (error) {
    console.error('Failed to fetch components:', error);
  } finally {
    loading.value = false;
  }
};

// 从 localStorage 加载最近使用
const loadRecentlyUsed = () => {
  try {
    const stored = localStorage.getItem('ai-studio-recent-components');
    if (stored) {
      const recentKeys = JSON.parse(stored) as string[];
      recentlyUsed.value = recentKeys
        .map((key) => components.value.find((c) => c.key === key))
        .filter(Boolean) as ComponentItem[];
    }
  } catch {
    recentlyUsed.value = [];
  }
};

// 保存最近使用
const saveRecentlyUsed = (component: ComponentItem) => {
  try {
    const stored = localStorage.getItem('ai-studio-recent-components');
    let recentKeys: string[] = stored ? JSON.parse(stored) : [];

    // 移除已存在的，放到最前面
    recentKeys = recentKeys.filter((k) => k !== component.key);
    recentKeys.unshift(component.key);

    // 最多保留 10 个
    recentKeys = recentKeys.slice(0, 10);

    localStorage.setItem(
      'ai-studio-recent-components',
      JSON.stringify(recentKeys),
    );
    loadRecentlyUsed();
  } catch {
    // ignore
  }
};

// 拖拽开始
const handleDragStart = (event: DragEvent, component: ComponentItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  }
  emit('drag-start', component);
  saveRecentlyUsed(component);
};

// 点击组件
const handleComponentClick = (component: ComponentItem) => {
  emit('component-click', component);
  saveRecentlyUsed(component);
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  return typeConfig[type.toUpperCase()]?.icon || ToolOutlined;
};

// 获取类型颜色
const getTypeColor = (type: string) => {
  return typeConfig[type.toUpperCase()]?.color || '#8c8c8c';
};

// 获取类型标签
const getTypeLabel = (type: string) => {
  return typeConfig[type.toUpperCase()]?.label || type;
};

onMounted(() => {
  fetchComponents();
});

// 监听外部选择的类型
watch(
  () => props.selectedType,
  (newType) => {
    if (newType) {
      searchKeyword.value = '';
      activeKeys.value = [newType.toLowerCase()];
    }
  },
);
</script>

<template>
  <div class="component-palette">
    <div class="palette-header">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索组件..."
        allow-clear
        class="search-input"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </Input>
    </div>

    <Spin :spinning="loading">
      <div class="palette-content">
        <!-- 最近使用 -->
        <Collapse v-model:activeKey="activeKeys" ghost>
          <Collapse.Panel key="recent" v-if="recentlyUsed.length > 0">
            <template #header>
              <div class="panel-header">
                <ClockCircleOutlined />
                <span>最近使用</span>
                <Badge :count="recentlyUsed.length" :overflow-count="10" />
              </div>
            </template>
            <div class="component-list">
              <div
                v-for="comp in recentlyUsed"
                :key="comp.key"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, comp)"
                @click="handleComponentClick(comp)"
              >
                <div
                  class="component-icon"
                  :style="{ backgroundColor: getTypeColor(comp.type) }"
                >
                  <component :is="getTypeIcon(comp.type)" />
                </div>
                <div class="component-info">
                  <div class="component-name">{{ comp.name }}</div>
                  <div class="component-key">{{ comp.key }}</div>
                </div>
                <DragOutlined class="drag-handle" />
              </div>
            </div>
          </Collapse.Panel>

          <!-- LLM 模型 -->
          <Collapse.Panel key="llm">
            <template #header>
              <div class="panel-header">
                <RobotOutlined :style="{ color: '#1890ff' }" />
                <span>LLM 模型</span>
                <Badge
                  :count="groupedComponents.llm.length"
                  :overflow-count="99"
                />
              </div>
            </template>
            <div class="component-list">
              <template v-if="groupedComponents.llm.length > 0">
                <Tooltip
                  v-for="comp in groupedComponents.llm"
                  :key="comp.key"
                  :title="comp.description"
                  placement="right"
                >
                  <div
                    class="component-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, comp)"
                    @click="handleComponentClick(comp)"
                  >
                    <div
                      class="component-icon"
                      :style="{ backgroundColor: '#1890ff' }"
                    >
                      <RobotOutlined />
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ comp.name }}</div>
                      <div class="component-key">{{ comp.key }}</div>
                    </div>
                    <DragOutlined class="drag-handle" />
                  </div>
                </Tooltip>
              </template>
              <Empty
                v-else
                description="暂无 LLM 组件"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Collapse.Panel>

          <!-- OCR 识别 -->
          <Collapse.Panel key="ocr">
            <template #header>
              <div class="panel-header">
                <ScanOutlined :style="{ color: '#52c41a' }" />
                <span>OCR 识别</span>
                <Badge
                  :count="groupedComponents.ocr.length"
                  :overflow-count="99"
                />
              </div>
            </template>
            <div class="component-list">
              <template v-if="groupedComponents.ocr.length > 0">
                <Tooltip
                  v-for="comp in groupedComponents.ocr"
                  :key="comp.key"
                  :title="comp.description"
                  placement="right"
                >
                  <div
                    class="component-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, comp)"
                    @click="handleComponentClick(comp)"
                  >
                    <div
                      class="component-icon"
                      :style="{ backgroundColor: '#52c41a' }"
                    >
                      <ScanOutlined />
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ comp.name }}</div>
                      <div class="component-key">{{ comp.key }}</div>
                    </div>
                    <DragOutlined class="drag-handle" />
                  </div>
                </Tooltip>
              </template>
              <Empty
                v-else
                description="暂无 OCR 组件"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Collapse.Panel>

          <!-- 业务工具 -->
          <Collapse.Panel key="tool">
            <template #header>
              <div class="panel-header">
                <ToolOutlined :style="{ color: '#722ed1' }" />
                <span>业务工具</span>
                <Badge
                  :count="groupedComponents.tool.length"
                  :overflow-count="99"
                />
              </div>
            </template>
            <div class="component-list">
              <template v-if="groupedComponents.tool.length > 0">
                <Tooltip
                  v-for="comp in groupedComponents.tool"
                  :key="comp.key"
                  :title="comp.description"
                  placement="right"
                >
                  <div
                    class="component-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, comp)"
                    @click="handleComponentClick(comp)"
                  >
                    <div
                      class="component-icon"
                      :style="{ backgroundColor: '#722ed1' }"
                    >
                      <ToolOutlined />
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ comp.name }}</div>
                      <div class="component-key">{{ comp.key }}</div>
                    </div>
                    <DragOutlined class="drag-handle" />
                  </div>
                </Tooltip>
              </template>
              <Empty
                v-else
                description="暂无工具组件"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Collapse.Panel>

          <!-- 向量检索 -->
          <Collapse.Panel key="retrieval">
            <template #header>
              <div class="panel-header">
                <DatabaseOutlined :style="{ color: '#fa8c16' }" />
                <span>向量检索</span>
                <Badge
                  :count="groupedComponents.retrieval.length"
                  :overflow-count="99"
                />
              </div>
            </template>
            <div class="component-list">
              <template v-if="groupedComponents.retrieval.length > 0">
                <Tooltip
                  v-for="comp in groupedComponents.retrieval"
                  :key="comp.key"
                  :title="comp.description"
                  placement="right"
                >
                  <div
                    class="component-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, comp)"
                    @click="handleComponentClick(comp)"
                  >
                    <div
                      class="component-icon"
                      :style="{ backgroundColor: '#fa8c16' }"
                    >
                      <DatabaseOutlined />
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ comp.name }}</div>
                      <div class="component-key">{{ comp.key }}</div>
                    </div>
                    <DragOutlined class="drag-handle" />
                  </div>
                </Tooltip>
              </template>
              <Empty
                v-else
                description="暂无检索组件"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Collapse.Panel>

          <!-- 数据转换 -->
          <Collapse.Panel key="transform">
            <template #header>
              <div class="panel-header">
                <SwapOutlined :style="{ color: '#8c8c8c' }" />
                <span>数据转换</span>
                <Badge
                  :count="groupedComponents.transform.length"
                  :overflow-count="99"
                />
              </div>
            </template>
            <div class="component-list">
              <template v-if="groupedComponents.transform.length > 0">
                <Tooltip
                  v-for="comp in groupedComponents.transform"
                  :key="comp.key"
                  :title="comp.description"
                  placement="right"
                >
                  <div
                    class="component-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, comp)"
                    @click="handleComponentClick(comp)"
                  >
                    <div
                      class="component-icon"
                      :style="{ backgroundColor: '#8c8c8c' }"
                    >
                      <SwapOutlined />
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ comp.name }}</div>
                      <div class="component-key">{{ comp.key }}</div>
                    </div>
                    <DragOutlined class="drag-handle" />
                  </div>
                </Tooltip>
              </template>
              <Empty
                v-else
                description="暂无转换组件"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
.component-palette {
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-right: 1px solid #e8e8e8;
}

.palette-header {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
}

.palette-content {
  flex: 1;
  overflow-y: auto;
}

:deep(.ant-collapse-ghost) {
  background: transparent;
}

:deep(.ant-collapse-header) {
  padding: 8px 12px !important;
}

:deep(.ant-collapse-content-box) {
  padding: 0 8px 8px !important;
}

.panel-header {
  display: flex;
  gap: 8px;
  align-items: center;

  span {
    flex: 1;
  }
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.component-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  cursor: grab;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #d9d9d9;
    box-shadow: 0 2px 4px rgb(0 0 0 / 6%);

    .drag-handle {
      opacity: 1;
    }
  }

  &:active {
    cursor: grabbing;
  }
}

.component-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: #fff;
  border-radius: 6px;
}

.component-info {
  flex: 1;
  min-width: 0;
}

.component-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  color: rgb(0 0 0 / 85%);
  white-space: nowrap;
}

.component-key {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgb(0 0 0 / 45%);
  white-space: nowrap;
}

.drag-handle {
  flex-shrink: 0;
  font-size: 14px;
  color: rgb(0 0 0 / 25%);
  opacity: 0;
  transition: opacity 0.2s;
}
</style>
