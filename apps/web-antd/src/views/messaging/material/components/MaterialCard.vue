<script setup lang="ts">
import { computed } from 'vue';
import { Card, Tag, Checkbox, Tooltip, Dropdown } from 'ant-design-vue';
import {
  EyeOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FileOutlined,
  FolderOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';
import type { MaterialItem, MaterialType, MaterialStatus } from '../types';

const props = defineProps<{
  material: MaterialItem;
  selected?: boolean;
  selectionMode?: boolean;
  viewMode?: 'grid' | 'list';
}>();

const emit = defineEmits<{
  click: [material: MaterialItem];
  select: [material: MaterialItem, selected: boolean];
  edit: [material: MaterialItem];
  delete: [material: MaterialItem];
  use: [material: MaterialItem];
}>();

// 类型配置
const typeIcons: Record<MaterialType, any> = {
  TEXT: FileTextOutlined,
  IMAGE: PictureOutlined,
  VIDEO: VideoCameraOutlined,
  LINK: LinkOutlined,
  FILE: FileOutlined,
  MIXED: FolderOutlined,
};

const typeLabels: Record<MaterialType, string> = {
  TEXT: '文本',
  IMAGE: '图片',
  VIDEO: '视频',
  LINK: '链接',
  FILE: '文件',
  MIXED: '图文',
};

const typeColors: Record<MaterialType, string> = {
  TEXT: '#595959',
  IMAGE: '#52c41a',
  VIDEO: '#722ed1',
  LINK: '#1890ff',
  FILE: '#fa8c16',
  MIXED: '#13c2c2',
};

const statusConfig: Record<MaterialStatus, { label: string; color: string; icon: any }> = {
  DRAFT: { label: '草稿', color: '#bfbfbf', icon: ClockCircleOutlined },
  ACTIVE: { label: '启用', color: '#52c41a', icon: CheckCircleOutlined },
  ARCHIVED: { label: '归档', color: '#8c8c8c', icon: ExclamationCircleOutlined },
};

// 计算属性
const TypeIcon = computed(() => typeIcons[props.material.type]);
const StatusIcon = computed(() => statusConfig[props.material.status].icon);

const typeColor = computed(() => typeColors[props.material.type]);
const statusColor = computed(() => statusConfig[props.material.status].color);

// 内容预览
const contentPreview = computed(() => {
  const { type, content, linkUrl, linkTitle } = props.material;
  switch (type) {
    case 'TEXT':
      return content?.slice(0, 100) || '无内容';
    case 'LINK':
      return linkTitle || linkUrl || '链接';
    case 'IMAGE':
      return linkTitle || '图片素材';
    case 'VIDEO':
      return linkTitle || '视频素材';
    default:
      return content?.slice(0, 100) || typeLabels[type];
  }
});

// 日期格式化
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 事件处理
function handleClick() {
  if (props.selectionMode) {
    emit('select', props.material, !props.selected);
  } else {
    emit('click', props.material);
  }
}

function handleSelect(e: Event) {
  e.stopPropagation();
  emit('select', props.material, !props.selected);
}

function handleEdit(e: Event) {
  e.stopPropagation();
  emit('edit', props.material);
}

function handleDelete(e: Event) {
  e.stopPropagation();
  emit('delete', props.material);
}

function handleUse(e: Event) {
  e.stopPropagation();
  emit('use', props.material);
}

function handleMenuClick({ key }: { key: string }) {
  switch (key) {
    case 'edit':
      emit('edit', props.material);
      break;
    case 'delete':
      emit('delete', props.material);
      break;
    case 'use':
      emit('use', props.material);
      break;
  }
}
</script>

<template>
  <!-- 网格视图卡片 -->
  <Card
    v-if="viewMode === 'grid'"
    class="material-card"
    :class="{
      'material-card--selected': selected,
      'material-card--selection': selectionMode,
    }"
    hoverable
    @click="handleClick"
  >
    <!-- 选择框 -->
    <div
      v-if="selectionMode"
      class="material-card__checkbox"
      @click.stop
    >
      <Checkbox :checked="selected" @change="handleSelect" />
    </div>

    <!-- 状态标记 -->
    <div
      class="material-card__status"
      :style="{ backgroundColor: statusColor }"
    >
      <Tooltip :title="statusConfig[material.status].label">
        <component :is="StatusIcon" />
      </Tooltip>
    </div>

    <!-- 预览区 -->
    <div class="material-card__preview">
      <!-- 图片预览 -->
      <div
        v-if="material.type === 'IMAGE' && material.mediaUrls?.[0]"
        class="preview-image"
      >
        <img :src="material.mediaUrls[0]" :alt="material.name" />
      </div>
      <!-- 类型图标 -->
      <div v-else class="preview-icon" :style="{ color: typeColor }">
        <component :is="TypeIcon" />
      </div>
    </div>

    <!-- 内容区 -->
    <div class="material-card__content">
      <!-- 名称 -->
      <h4 class="material-name" :title="material.name">
        {{ material.name }}
      </h4>

      <!-- 内容预览 -->
      <p class="material-preview" :title="contentPreview">
        {{ contentPreview }}
      </p>

      <!-- 标签 -->
      <div v-if="material.tags?.length" class="material-tags">
        <Tag
          v-for="tag in material.tags.slice(0, 3)"
          :key="tag"
          size="small"
        >
          {{ tag }}
        </Tag>
        <span v-if="material.tags.length > 3" class="tag-more">
          +{{ material.tags.length - 3 }}
        </span>
      </div>

      <!-- 统计信息 -->
      <div class="material-stats">
        <span class="stat-item">
          <EyeOutlined />
          {{ material.viewCount || 0 }}
        </span>
        <span class="stat-item">
          <SendOutlined />
          {{ material.usageCount || 0 }}
        </span>
        <span class="stat-time">
          {{ formatDate(material.updatedAt) }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="material-card__actions" @click.stop>
      <Tooltip title="使用">
        <span class="action-btn" @click="handleUse">
          <SendOutlined />
        </span>
      </Tooltip>
      <Tooltip title="编辑">
        <span class="action-btn" @click="handleEdit">
          <EditOutlined />
        </span>
      </Tooltip>
      <Dropdown
        :trigger="['click']"
        :menu="{
          items: [
            { key: 'edit', label: '编辑', icon: EditOutlined },
            { key: 'use', label: '使用', icon: SendOutlined },
            { type: 'divider' },
            { key: 'delete', label: '删除', icon: DeleteOutlined, danger: true },
          ],
          onClick: handleMenuClick,
        }"
      >
        <span class="action-btn">
          <MoreOutlined />
        </span>
      </Dropdown>
    </div>
  </Card>

  <!-- 列表视图行 -->
  <div
    v-else
    class="material-list-item"
    :class="{
      'material-list-item--selected': selected,
    }"
    @click="handleClick"
  >
    <!-- 选择框 -->
    <div v-if="selectionMode" class="list-col list-col--checkbox" @click.stop>
      <Checkbox :checked="selected" @change="handleSelect" />
    </div>

    <!-- 类型图标 -->
    <div class="list-col list-col--type" :style="{ color: typeColor }">
      <component :is="TypeIcon" />
    </div>

    <!-- 名称和内容 -->
    <div class="list-col list-col--name">
      <div class="name-row">
        <span class="name-text" :title="material.name">{{ material.name }}</span>
        <Tag
          size="small"
          :color="statusColor"
          class="status-tag"
        >
          {{ statusConfig[material.status].label }}
        </Tag>
      </div>
      <div class="preview-text" :title="contentPreview">
        {{ contentPreview }}
      </div>
      <div v-if="material.tags?.length" class="tags-row">
        <Tag v-for="tag in material.tags.slice(0, 2)" :key="tag" size="small">
          {{ tag }}
        </Tag>
        <span v-if="material.tags.length > 2" class="tag-more">
          +{{ material.tags.length - 2 }}
        </span>
      </div>
    </div>

    <!-- 分类 -->
    <div class="list-col list-col--category">
      {{ material.categoryName || '未分类' }}
    </div>

    <!-- 统计 -->
    <div class="list-col list-col--stats">
      <span class="stat-item">
        <EyeOutlined />
        {{ material.viewCount || 0 }}
      </span>
      <span class="stat-item">
        <SendOutlined />
        {{ material.usageCount || 0 }}
      </span>
    </div>

    <!-- 更新时间 -->
    <div class="list-col list-col--time">
      {{ formatDate(material.updatedAt) }}
    </div>

    <!-- 操作 -->
    <div class="list-col list-col--actions" @click.stop>
      <Tooltip title="使用">
        <span class="action-btn" @click="handleUse">
          <SendOutlined />
        </span>
      </Tooltip>
      <Tooltip title="编辑">
        <span class="action-btn" @click="handleEdit">
          <EditOutlined />
        </span>
      </Tooltip>
      <Tooltip title="删除">
        <span class="action-btn action-btn--danger" @click="handleDelete">
          <DeleteOutlined />
        </span>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
/* 卡片视图样式 */
.material-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.material-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.material-card--selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.material-card--selection {
  cursor: default;
}

.material-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.material-card__status {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  z-index: 10;
}

.material-card__preview {
  height: 120px;
  background: #f5f5f5;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: -24px -24px 16px;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon {
  font-size: 48px;
}

.material-card__content {
  flex: 1;
}

.material-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-preview {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 18px;
}

.material-tags {
  margin-bottom: 12px;
}

.tag-more {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.material-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-time {
  margin-left: auto;
}

.material-card__actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-card:hover .material-card__actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.action-btn--danger:hover {
  color: #ff4d4f;
}

/* 列表视图样式 */
.material-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.material-list-item:hover {
  background: #fafafa;
}

.material-list-item--selected {
  background: #e6f7ff;
}

.list-col {
  padding: 0 8px;
}

.list-col--checkbox {
  width: 40px;
  flex-shrink: 0;
}

.list-col--type {
  width: 40px;
  flex-shrink: 0;
  font-size: 20px;
  text-align: center;
}

.list-col--name {
  flex: 1;
  min-width: 200px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.name-text {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  font-size: 12px;
  padding: 0 4px;
  margin: 0;
}

.preview-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.list-col--category {
  width: 120px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.list-col--stats {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.list-col--time {
  width: 100px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.list-col--actions {
  width: 100px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-list-item:hover .list-col--actions {
  opacity: 1;
}
</style>
