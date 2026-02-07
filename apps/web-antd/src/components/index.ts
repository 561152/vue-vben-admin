/**
 * 组件导出文件
 * 将共享组件重新导出，确保依赖正确解析
 */

// 本地组件
export { default as CorrectionEditor } from './CorrectionEditor.vue';
export { default as HistoryTimeline } from './HistoryTimeline.vue';
export { default as ImageAnnotator } from './ImageAnnotator.vue';
export { default as KatexRenderer } from './KatexRenderer.vue';
export { default as MigrationNotice } from './MigrationNotice.vue';
export { default as StepScorePanel } from './StepScorePanel.vue';

// 从共享包导出 MaterialPicker 及其类型
export { MaterialPicker } from '@vben/common-ui';
export type { Material, MaterialType } from '@vben/common-ui';
