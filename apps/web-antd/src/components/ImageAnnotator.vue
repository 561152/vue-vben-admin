<template>
  <div class="image-annotator">
    <div class="image-container" ref="containerRef">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Annotated Image"
        class="annotated-image"
        @load="handleImageLoad"
      />
      <div
        v-for="(annotation, index) in annotations"
        :key="index"
        class="annotation-box"
        :style="getAnnotationStyle(annotation)"
        @click="$emit('annotationClick', annotation)"
      >
        <span class="annotation-label">{{ annotation.label }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

interface Annotation {
  id: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface Props {
  imageUrl?: string;
  annotations?: Annotation[];
  width?: number | string;
  height?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: '',
  annotations: () => [],
  width: '100%',
  height: 'auto',
});

const emit = defineEmits<{
  annotationClick: [annotation: Annotation];
  imageLoad: [];
}>();

const containerRef = ref<HTMLElement>();

const getAnnotationStyle = (annotation: Annotation) => {
  return {
    position: 'absolute',
    left: `${annotation.x}px`,
    top: `${annotation.y}px`,
    width: `${annotation.width}px`,
    height: `${annotation.height}px`,
    border: `2px solid ${annotation.color || '#1890ff'}`,
    cursor: 'pointer',
  };
};

const handleImageLoad = () => {
  emit('imageLoad');
};
</script>

<style scoped lang="less">
.image-annotator {
  width: 100%;
  height: 100%;
  overflow: auto;

  .image-container {
    position: relative;
    width: fit-content;
    margin: 0 auto;

    .annotated-image {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .annotation-box {
      background-color: rgba(24, 144, 255, 0.1);
      transition: all 0.2s;

      &:hover {
        background-color: rgba(24, 144, 255, 0.2);
        z-index: 10;
      }

      .annotation-label {
        position: absolute;
        top: -24px;
        left: 0;
        padding: 2px 8px;
        background-color: #1890ff;
        color: white;
        font-size: 12px;
        border-radius: 2px;
        white-space: nowrap;
      }
    }
  }
}
</style>
