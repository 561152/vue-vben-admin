<template>
  <div class="history-timeline">
    <a-timeline>
      <a-timeline-item
        v-for="(item, index) in items"
        :key="index"
        :color="getItemColor(item)"
      >
        <template #dot>
          <component :is="getIcon(item.type)" />
        </template>
        <div class="timeline-content">
          <div class="timeline-title">{{ item.title }}</div>
          <div v-if="item.description" class="timeline-description">
            {{ item.description }}
          </div>
          <div class="timeline-meta">
            <span v-if="item.operator" class="operator">{{
              item.operator
            }}</span>
            <span class="time">{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<script lang="ts" setup>
import {
  Timeline as ATimeline,
  TimelineItem as ATimelineItem,
} from 'ant-design-vue';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';

interface TimelineItem {
  title: string;
  description?: string;
  operator?: string;
  timestamp: string | Date;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface Props {
  items: TimelineItem[];
}

defineProps<Props>();

const getItemColor = (item: TimelineItem) => {
  const colorMap = {
    success: 'green',
    info: 'blue',
    warning: 'orange',
    error: 'red',
  };
  return item.type ? colorMap[item.type] : 'blue';
};

const getIcon = (type?: string) => {
  const iconMap = {
    success: CheckCircleOutlined,
    info: FileTextOutlined,
    warning: ClockCircleOutlined,
    error: EditOutlined,
  };
  return type ? iconMap[type as keyof typeof iconMap] : FileTextOutlined;
};

const formatTime = (timestamp: string | Date) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped lang="less">
.history-timeline {
  .timeline-content {
    .timeline-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .timeline-description {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.65);
      margin-bottom: 8px;
    }

    .timeline-meta {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      display: flex;
      gap: 12px;

      .operator {
        &::before {
          content: '操作人：';
        }
      }
    }
  }
}
</style>
