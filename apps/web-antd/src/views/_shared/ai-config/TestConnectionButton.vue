<script lang="ts" setup>
import { ref } from 'vue';

import { message } from 'ant-design-vue';

import type { CredentialScope, CredentialTestStatus } from './credentials.api';

import { testCredential } from './credentials.api';

defineOptions({ name: 'TestConnectionButton' });

const props = defineProps<{
  credentialId: number;
  scope: CredentialScope;
}>();

const emit = defineEmits<{
  'update:status': [status: CredentialTestStatus];
}>();

const loading = ref(false);

async function runTest() {
  loading.value = true;
  try {
    const result = await testCredential(props.scope, props.credentialId);
    emit('update:status', result.status);
    if (result.status === 'OK') {
      message.success('连接测试成功');
    } else {
      const detail = result.message ? `：${result.message}` : '';
      message.error(`连接测试失败 [${result.status}]${detail}`);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    message.error(`网络错误：${reason}`);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="test-conn-btn"
    data-testid="test-connection-btn"
    :disabled="loading || undefined"
    @click="runTest"
  >
    <span v-if="loading" class="spinner" />
    {{ loading ? '测试中…' : '测试连接' }}
  </button>
</template>

<style scoped>
.test-conn-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 4px;
  background: var(--ant-color-bg-container, #fff);
  cursor: pointer;
  font-size: 12px;
}
.test-conn-btn[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
.spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--ant-color-border, #d9d9d9);
  border-top-color: var(--ant-color-primary, #1677ff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
