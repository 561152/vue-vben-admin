<template>
  <div class="user-mode-switch">
    <Space>
      <span class="mode-label">{{ modeStore.modeLabel }}</span>
      <Switch
        v-model:checked="isChildMode"
        :loading="switching"
        @change="handleModeChange"
      >
        <template #checkedChildren>
          <SmileOutlined />
        </template>
        <template #unCheckedChildren>
          <UserOutlined />
        </template>
      </Switch>
      <Tooltip :title="modeStore.modeDescription">
        <QuestionCircleOutlined class="help-icon" />
      </Tooltip>
    </Space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Space, Switch, Tooltip, message } from 'ant-design-vue';
import {
  UserOutlined,
  SmileOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import { useUserModeStore } from '#/store/modules/user-mode';

// ==================== Props & Emits ====================

interface Props {
  showLabel?: boolean;
  size?: 'small' | 'default' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  size: 'default',
});

const emit = defineEmits<{
  change: [mode: 'PARENT' | 'CHILD'];
}>();

// ==================== State ====================

const modeStore = useUserModeStore();
const switching = ref(false);

// ==================== Computed ====================

const isChildMode = computed({
  get: () => modeStore.isChildMode,
  set: (value: boolean) => {
    // Switch 组件的双向绑定
    // 实际的切换逻辑在 handleModeChange 中
  },
});

// ==================== Methods ====================

async function handleModeChange(checked: boolean) {
  switching.value = true;

  try {
    // 切换模式
    const newMode = checked ? 'CHILD' : 'PARENT';
    modeStore.switchMode(newMode);

    // 发出事件
    emit('change', newMode);

    // 提示消息
    const modeText = checked ? '孩子模式' : '家长模式';
    message.success(`已切换到${modeText}`);
  } catch (error: any) {
    message.error(`切换失败: ${error.message}`);
  } finally {
    switching.value = false;
  }
}
</script>

<style scoped lang="less">
.user-mode-switch {
  display: inline-flex;
  align-items: center;

  .mode-label {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
  }

  .help-icon {
    color: rgba(0, 0, 0, 0.45);
    cursor: help;
    font-size: 14px;

    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }
  }
}
</style>
