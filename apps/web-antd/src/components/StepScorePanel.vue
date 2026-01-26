<template>
  <div class="step-score-panel">
    <a-card :title="title" :bordered="bordered">
      <a-space direction="vertical" style="width: 100%">
        <div v-for="(step, index) in steps" :key="index" class="score-step">
          <div class="step-header">
            <span class="step-label">{{ step.label || `步骤 ${index + 1}` }}</span>
            <span class="step-score">
              <a-input-number
                v-model:value="step.score"
                :min="0"
                :max="step.maxScore"
                :disabled="disabled"
                @change="() => handleScoreChange(index, step.score)"
              />
              <span class="max-score">/ {{ step.maxScore }}</span>
            </span>
          </div>
          <div v-if="step.description" class="step-description">
            {{ step.description }}
          </div>
        </div>
        <a-divider />
        <div class="total-score">
          <span>总分</span>
          <span class="score-value">{{ totalScore }} / {{ maxTotalScore }}</span>
        </div>
      </a-space>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Card as ACard, Space as ASpace, InputNumber as AInputNumber, Divider as ADivider } from 'ant-design-vue';

interface Step {
  label?: string;
  score: number;
  maxScore: number;
  description?: string;
}

interface Props {
  title?: string;
  steps: Step[];
  bordered?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '分步评分',
  bordered: true,
  disabled: false,
});

const emit = defineEmits<{
  scoreChange: [index: number, score: number];
  update: [steps: Step[]];
}>();

const totalScore = computed(() => {
  return props.steps.reduce((sum, step) => sum + (step.score || 0), 0);
});

const maxTotalScore = computed(() => {
  return props.steps.reduce((sum, step) => sum + step.maxScore, 0);
});

const handleScoreChange = (index: number, score: number) => {
  emit('scoreChange', index, score);
  emit('update', props.steps);
};
</script>

<style scoped lang="less">
.step-score-panel {
  .score-step {
    padding: 8px 0;

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .step-label {
        font-weight: 500;
      }

      .step-score {
        display: flex;
        align-items: center;
        gap: 8px;

        .max-score {
          color: rgba(0, 0, 0, 0.45);
        }
      }
    }

    .step-description {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.65);
      margin-top: 4px;
    }
  }

  .total-score {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .score-value {
      color: #1890ff;
    }
  }
}
</style>
