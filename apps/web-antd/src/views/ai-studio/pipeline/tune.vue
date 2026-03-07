<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Button,
  Space,
  message,
  Empty,
  Spin,
  Alert,
  Tag,
  Tabs,
} from 'ant-design-vue';
import {
  SaveOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  LeftOutlined,
} from '@ant-design/icons-vue';
import SchemaForm from './components/SchemaForm.vue';
import StepPromptManager from './components/StepPromptManager.vue';
import {
  getPipelineByKey,
  updateRuntimeConfig,
  executePipeline,
  type Pipeline,
  type ExecutionSubmitResponse,
} from '#/api/ai-studio/pipeline';

const route = useRoute();

// 当前活动标签页
const activeTab = ref('config');
const router = useRouter();

const pipelineKey = route.params.key as string;
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const pipeline = ref<Pipeline | null>(null);
const config = ref<Record<string, unknown>>({});
const testInputData = ref<Record<string, unknown>>({});
const testResult = ref<ExecutionSubmitResponse | null>(null);
const schemaFormRef = ref();
const testFormRef = ref();

// 步骤状态管理 (流程可视化)
const currentStep = ref(1); // 1: 配置参数, 2: 准备测试, 3: 查看结果

const pageTitle = computed(() => {
  return pipeline.value?.name || '流程参数配置';
});

const pageSubtitle = computed(() => {
  const parts: string[] = [];
  if (pipeline.value?.description) {
    parts.push(pipeline.value.description);
  }
  if (pipeline.value?.isSystem) {
    parts.push('(系统流程)');
  }
  return parts.join(' ');
});

// 提取 Schema 默认值
function extractDefaults(
  schema: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!schema) return {};
  const properties = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties) return {};

  const defaults: Record<string, unknown> = {};
  Object.entries(properties).forEach(([key, prop]) => {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    }
  });
  return defaults;
}

// 加载 Pipeline 详情
async function fetchPipeline() {
  loading.value = true;
  try {
    const data = await getPipelineByKey(pipelineKey);
    pipeline.value = data;

    // 初始化配置
    if (data.runtimeConfig && Object.keys(data.runtimeConfig).length > 0) {
      config.value = { ...data.runtimeConfig };
    } else {
      // 使用 Schema 默认值
      config.value = extractDefaults(data.formSchema);
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    message.error(err.message || '加载流程失败');
    setTimeout(() => {
      router.push('/ai-studio/pipeline');
    }, 2000);
  } finally {
    loading.value = false;
  }
}

// 保存配置
async function handleSave() {
  // 如果没有表单需要验证，直接保存
  if (!pipeline.value?.formSchema || !schemaFormRef.value) {
    doSave();
    return;
  }

  // 验证表单
  try {
    const valid = await schemaFormRef.value.validate();
    if (!valid) {
      return;
    }
  } catch (error: any) {
    // 显示具体的验证错误
    const errorFields = error.errorFields || [];
    if (errorFields.length > 0) {
      const firstError = errorFields[0];
      message.error(
        `${firstError.name?.join('.') || '字段'}: ${firstError.errors?.[0] || '验证失败'}`,
      );
    } else {
      message.error('请修正表单错误');
    }
    return;
  }

  doSave();
}

// 执行保存
async function doSave() {
  try {
    await updateRuntimeConfig(
      pipelineKey,
      config.value as Record<string, unknown>,
    );
    message.success('配置保存成功');
    // 保存成功后，进入步骤2
    if (currentStep.value === 1) {
      currentStep.value = 2;
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    message.error(err.message || '配置保存失败');
  } finally {
    saving.value = false;
  }
}

// 重置为默认值
function handleReset() {
  if (!pipeline.value?.formSchema) return;
  config.value = extractDefaults(pipeline.value.formSchema);
  message.info('已重置为默认值');
}

// 测试执行（同步模式）
async function handleTest() {
  // 验证配置表单（如果存在）
  if (schemaFormRef.value) {
    try {
      const configValid = await schemaFormRef.value.validate();
      if (!configValid) {
        message.error('请先修正配置参数错误');
        return;
      }
    } catch {
      message.error('请先修正配置参数错误');
      return;
    }
  }

  // 验证测试参数表单
  if (testFormRef.value) {
    try {
      const testValid = await testFormRef.value.validate();
      if (!testValid) {
        message.error('请填写完整的测试参数');
        return;
      }
    } catch {
      message.error('请填写完整的测试参数');
      return;
    }
  }

  testing.value = true;
  testResult.value = null;

  try {
    const inputData = {
      ...testInputData.value,
      ...config.value,
    };

    const result = await executePipeline(pipelineKey, {
      inputData,
      sync: true,
    });

    testResult.value = result;

    if (result.status === 'COMPLETED') {
      message.success('测试执行成功');
    } else if (result.status === 'FAILED') {
      message.error('测试执行失败');
    }

    // 测试完成后，进入步骤3
    currentStep.value = 3;
  } catch (error: unknown) {
    const err = error as { message?: string };
    message.error(err.message || '测试执行失败');
  } finally {
    testing.value = false;
  }
}

// 返回列表
function handleBack() {
  router.push('/ai-studio/pipeline');
}

onMounted(() => {
  fetchPipeline();
});
</script>

<template>
  <div class="pipeline-tune-page">
    <Spin :spinning="loading" tip="加载中...">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-top">
          <Button @click="handleBack" size="large">
            <template #icon><LeftOutlined /></template>
            返回列表
          </Button>
          <div class="header-title">
            <h1>{{ pageTitle }}</h1>
            <p class="subtitle">{{ pageSubtitle }}</p>
          </div>
          <Space size="middle">
            <Button size="large" @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置默认值
            </Button>
            <Button
              type="primary"
              size="large"
              @click="handleSave"
              :loading="saving"
            >
              <template #icon><SaveOutlined /></template>
              保存配置
            </Button>
          </Space>
        </div>

        <!-- 进度指示器 -->
        <div class="progress-bar">
          <div
            :class="[
              'progress-item',
              { active: currentStep >= 1, completed: currentStep > 1 },
            ]"
          >
            <div class="progress-number">
              {{ currentStep > 1 ? '\u2713' : '1' }}
            </div>
            <div class="progress-label">配置参数</div>
          </div>
          <div class="progress-line" :class="{ active: currentStep > 1 }"></div>
          <div
            :class="[
              'progress-item',
              { active: currentStep >= 2, completed: currentStep > 2 },
            ]"
          >
            <div class="progress-number">
              {{ currentStep > 2 ? '\u2713' : '2' }}
            </div>
            <div class="progress-label">测试运行</div>
          </div>
          <div class="progress-line" :class="{ active: currentStep > 2 }"></div>
          <div :class="['progress-item', { active: currentStep >= 3 }]">
            <div class="progress-number">3</div>
            <div class="progress-label">查看结果</div>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <Tabs v-model:active-key="activeTab" type="card">
          <!-- Tab 1: 流程配置 -->
          <Tabs.TabPane key="config" tab="流程配置">
            <!-- Step 1: 配置参数 -->
            <Card class="step-card" :class="{ active: currentStep === 1 }">
              <template #title>
                <div class="card-title">
                  <span class="step-badge">步骤 1</span>
                  <span class="title-text">配置流程参数</span>
                </div>
              </template>
              <div v-if="pipeline?.formSchema" class="form-container">
                <SchemaForm
                  ref="schemaFormRef"
                  v-model="config"
                  :schema="pipeline.formSchema"
                  @validate="() => {}"
                />
              </div>
              <Empty
                v-else-if="pipeline && !pipeline.formSchema"
                description="该流程无需配置参数"
              />
            </Card>

            <!-- Step 2: 测试运行 -->
            <Card class="step-card" :class="{ active: currentStep === 2 }">
              <template #title>
                <div class="card-title">
                  <span class="step-badge">步骤 2</span>
                  <span class="title-text">测试运行</span>
                </div>
              </template>
              <Alert
                message="测试模式"
                description="使用当前配置同步执行流程。请在下方输入测试数据。"
                type="info"
                show-icon
                class="test-tip"
              />

              <!-- 动态测试输入表单 -->
              <div class="test-form-container">
                <div v-if="pipeline?.inputSchema" class="form-section-title">
                  <span>测试输入参数</span>
                </div>
                <SchemaForm
                  v-if="pipeline?.inputSchema"
                  ref="testFormRef"
                  v-model="testInputData"
                  :schema="pipeline.inputSchema"
                />
                <Empty
                  v-else-if="pipeline"
                  description="该流程无输入 Schema 定义"
                />
              </div>

              <div class="test-action">
                <Button
                  type="primary"
                  @click="handleTest"
                  :loading="testing"
                  size="large"
                  block
                >
                  <template #icon><ThunderboltOutlined /></template>
                  {{ testing ? '执行中...' : '立即测试' }}
                </Button>
                <div
                  v-if="!pipeline?.formSchema"
                  style="
                    margin-top: 8px;
                    font-size: 12px;
                    color: #8c8c8c;
                    text-align: center;
                  "
                >
                  提示：该流程无需配置参数，可直接测试
                </div>
              </div>
            </Card>

            <!-- Step 3: 执行结果 -->
            <Card
              class="step-card result-card"
              :class="{ active: currentStep === 3 }"
              v-if="testResult"
            >
              <template #title>
                <div class="card-title">
                  <span class="step-badge">步骤 3</span>
                  <span class="title-text">执行结果</span>
                </div>
              </template>

              <!-- 执行状态 -->
              <Alert
                :type="
                  testResult.status === 'COMPLETED'
                    ? 'success'
                    : testResult.status === 'FAILED'
                      ? 'error'
                      : 'info'
                "
                show-icon
                class="status-alert"
              >
                <template #message>
                  <div class="status-header">
                    <span class="status-label">执行状态：</span>
                    <Tag
                      :color="
                        testResult.status === 'COMPLETED'
                          ? 'success'
                          : testResult.status === 'FAILED'
                            ? 'error'
                            : 'processing'
                      "
                      class="status-tag"
                    >
                      {{
                        testResult.status === 'COMPLETED'
                          ? '\u2713 成功'
                          : testResult.status === 'FAILED'
                            ? '\u2717 失败'
                            : '\u22EF 进行中'
                      }}
                    </Tag>
                  </div>
                </template>
                <template #description>
                  <div class="execution-info">
                    <div>执行ID：{{ testResult.executionId }}</div>
                    <div v-if="testResult.jobId">
                      任务ID：{{ testResult.jobId }}
                    </div>
                  </div>
                </template>
              </Alert>

              <!-- 结果展示（成功时显示通用 JSON） -->
              <div
                v-if="testResult.result && testResult.status === 'COMPLETED'"
                class="result-container"
              >
                <div class="result-section">
                  <div class="section-title">
                    <span>执行结果</span>
                  </div>
                  <pre class="result-json">{{
                    JSON.stringify(testResult.result, null, 2)
                  }}</pre>
                </div>
              </div>

              <!-- 错误详情（失败时显示） -->
              <div
                v-if="testResult.result && testResult.status === 'FAILED'"
                class="error-container"
              >
                <Alert
                  type="error"
                  :message="
                    ((testResult.result as Record<string, unknown>)
                      ?.error as string) || '执行失败'
                  "
                  show-icon
                  class="error-alert"
                />
                <details class="error-details">
                  <summary>查看错误详情</summary>
                  <pre>{{ JSON.stringify(testResult.result, null, 2) }}</pre>
                </details>
              </div>
            </Card>

            <!-- 空状态（未测试时） -->
            <Card class="step-card empty-card" v-else>
              <template #title>
                <div class="card-title">
                  <span class="step-badge">步骤 3</span>
                  <span class="title-text">执行结果</span>
                </div>
              </template>
              <Empty description="运行测试后查看结果" />
            </Card>
          </Tabs.TabPane>

          <!-- Tab 2: 提示词配置 -->
          <Tabs.TabPane key="prompt-config" tab="提示词配置">
            <StepPromptManager
              :pipeline-key="pipelineKey"
              :steps="pipeline?.steps || []"
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
/* ====================
   响应式设计
   ==================== */
@media (max-width: 768px) {
  .pipeline-tune-page {
    padding: 16px;
  }

  .page-header {
    padding: 16px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .progress-bar {
    padding: 16px 0 0;
  }

  .progress-line {
    width: 60px;
    margin: 0 8px;
  }
}

.pipeline-tune-page {
  min-height: 100vh;
  padding: 24px;
  background: #f0f2f5;
}

/* ====================
   页面头部
   ==================== */
.page-header {
  padding: 24px;
  margin-bottom: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}

.header-top {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
}

.header-title {
  flex: 1;
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #8c8c8c;
}

/* ====================
   进度指示器
   ==================== */
.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 0;
  border-top: 1px solid #f0f0f0;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.progress-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 600;
  color: #bfbfbf;
  background: #f5f5f5;
  border: 2px solid #d9d9d9;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.progress-item.active .progress-number {
  color: white;
  background: #1890ff;
  border-color: #1890ff;
  box-shadow: 0 0 0 4px rgb(24 144 255 / 12%);
}

.progress-item.completed .progress-number {
  color: white;
  background: #52c41a;
  border-color: #52c41a;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  color: #8c8c8c;
}

.progress-item.active .progress-label {
  color: #1890ff;
}

.progress-item.completed .progress-label {
  color: #52c41a;
}

.progress-line {
  position: relative;
  top: -20px;
  width: 100px;
  height: 2px;
  margin: 0 16px;
  background: #d9d9d9;
}

.progress-line.active {
  background: #52c41a;
}

/* ====================
   主内容区域
   ==================== */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
  transition: all 0.3s ease;
}

.step-card.active {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgb(24 144 255 / 15%);
}

.card-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.step-badge {
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

/* ====================
   表单容器
   ==================== */
.form-container {
  padding: 8px 0;
}

.test-tip {
  margin-bottom: 16px;
}

.test-form-container {
  margin-top: 16px;
}

.form-section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  border-bottom: 2px solid #f0f0f0;
}

.test-action {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* ====================
   结果展示
   ==================== */
.status-alert {
  margin-bottom: 24px;
}

.status-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-label {
  font-size: 15px;
  font-weight: 600;
}

.status-tag {
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
}

.execution-info {
  margin-top: 8px;
  font-size: 13px;
  color: #595959;
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-section {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.result-json {
  max-height: 600px;
  padding: 16px;
  margin: 0;
  overflow: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.error-container {
  margin-top: 16px;
}

.error-details {
  margin-top: 16px;
}

.error-details summary {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ff4d4f;
  cursor: pointer;
  user-select: none;
  background: #fff2f0;
  border-radius: 4px;
}

.error-details summary:hover {
  background: #ffccc7;
}

.error-details pre {
  padding: 16px;
  margin-top: 12px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}
</style>
