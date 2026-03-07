<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  ExperimentOutlined,
} from '@ant-design/icons-vue';
import {
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Slider,
  Space,
  Typography,
} from 'ant-design-vue';

import {
  createAbTest,
  type CreateShadowTestParams,
} from '#/api/ai-studio/prompt-ab-testing';
import {
  AI_SCENARIO_LABELS,
  AiScenario,
  getPromptTemplateVersions,
  type PromptTemplateVersion,
} from '#/api/ai-studio/prompt-template';

interface Props {
  visible: boolean;
  templateId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const modalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const loading = ref(false);
const submitting = ref(false);
const versions = ref<PromptTemplateVersion[]>([]);
const formRef = ref();

const formData = ref<CreateShadowTestParams>({
  name: '',
  description: '',
  controlVersionId: 0,
  treatmentVersionId: 0,
  trafficPercentage: 50,
  targetExecutions: undefined,
});

const scenarioValue = ref<AiScenario | undefined>(undefined);

const versionOptions = computed(() =>
  versions.value.map((v) => ({
    value: Number(v.id),
    label: `v${v.version} - ${v.changeLog || '无描述'} (${new Date(v.createdAt).toLocaleDateString('zh-CN')})`,
  })),
);

const scenarioOptions = computed(() =>
  Object.entries(AI_SCENARIO_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
);

const rules = {
  name: [{ required: true, message: '请输入测试名称' }],
  controlVersionId: [{ required: true, message: '请选择对照版本', type: 'number' as const, min: 1 }],
  treatmentVersionId: [{ required: true, message: '请选择实验版本', type: 'number' as const, min: 1 }],
};

const loadVersions = async () => {
  if (!props.templateId) return;
  loading.value = true;
  try {
    const res = await getPromptTemplateVersions(props.templateId, { limit: 100 });
    versions.value = res.data;
  } catch {
    message.error('加载版本列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  if (formData.value.controlVersionId === formData.value.treatmentVersionId) {
    message.warning('对照版本和实验版本不能相同');
    return;
  }

  submitting.value = true;
  try {
    const params: CreateShadowTestParams = {
      ...formData.value,
    };
    if (scenarioValue.value) {
      (params as Record<string, unknown>).scenario = scenarioValue.value;
    }
    await createAbTest(props.templateId, params);
    message.success('A/B 测试创建成功');
    emit('success');
    modalVisible.value = false;
    resetForm();
  } catch {
    message.error('创建失败');
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    controlVersionId: 0,
    treatmentVersionId: 0,
    trafficPercentage: 50,
    targetExecutions: undefined,
  };
  scenarioValue.value = undefined;
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadVersions();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="modalVisible"
    title="创建 A/B 测试"
    :width="600"
    :confirm-loading="submitting"
    ok-text="创建"
    cancel-text="取消"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <Form.Item label="测试名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="如：新 Prompt 格式对比测试"
          :maxlength="100"
          show-count
        />
      </Form.Item>

      <Form.Item label="描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          :rows="2"
          placeholder="测试目标和背景说明"
          :maxlength="500"
        />
      </Form.Item>

      <Form.Item label="对照版本 (Control)" name="controlVersionId">
        <Select
          v-model:value="formData.controlVersionId"
          :options="versionOptions"
          :loading="loading"
          placeholder="选择对照版本"
          show-search
          :filter-option="(input: string, option: { label: string }) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          "
        />
      </Form.Item>

      <Form.Item label="实验版本 (Treatment)" name="treatmentVersionId">
        <Select
          v-model:value="formData.treatmentVersionId"
          :options="versionOptions"
          :loading="loading"
          placeholder="选择实验版本"
          show-search
          :filter-option="(input: string, option: { label: string }) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          "
        />
      </Form.Item>

      <Form.Item label="流量分配">
        <Space direction="vertical" class="w-full">
          <Slider
            v-model:value="formData.trafficPercentage"
            :min="0"
            :max="100"
            :step="5"
          />
          <Typography.Text type="secondary">
            {{ formData.trafficPercentage }}% 流量进入实验组，{{ 100 - (formData.trafficPercentage ?? 50) }}% 进入对照组
          </Typography.Text>
        </Space>
      </Form.Item>

      <Form.Item label="目标执行次数（可选）">
        <InputNumber
          v-model:value="formData.targetExecutions"
          :min="1"
          :max="100000"
          placeholder="达到次数后自动完成"
          style="width: 100%"
        />
        <template #help>
          设置后，达到目标次数时测试将自动完成
        </template>
      </Form.Item>

      <Form.Item label="关联场景（可选）">
        <Select
          v-model:value="scenarioValue"
          :options="scenarioOptions"
          placeholder="选择关联的 AI 场景"
          allow-clear
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
