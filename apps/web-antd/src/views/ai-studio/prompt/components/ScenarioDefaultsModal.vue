<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { CheckOutlined, SettingOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Drawer,
  Empty,
  message,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';
import type { DefaultOptionType } from 'ant-design-vue/es/select';

import {
  AI_SCENARIO_LABELS,
  AiScenario,
  getPromptTemplates,
  getScenarioDefaults,
  type PromptTemplate,
  type ScenarioDefault,
  setScenarioDefault,
} from '#/api/ai-studio/prompt-template';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const loading = ref(false);
const saving = ref<string | null>(null);
const defaults = ref<ScenarioDefault[]>([]);
const templates = ref<PromptTemplate[]>([]);

// 每个场景的编辑状态
const editingValues = ref<Record<string, number | undefined>>({});

const scenarioList = computed(() =>
  Object.entries(AI_SCENARIO_LABELS).map(([key, label]) => {
    const existing = defaults.value.find((d) => d.scenario === key);
    return {
      scenario: key as AiScenario,
      label,
      currentTemplateId: existing?.templateId ?? undefined,
      currentTemplateName: existing?.templateName ?? undefined,
      isActive: existing?.isActive ?? false,
    };
  }),
);

const templateOptions = computed(() =>
  templates.value.map((t) => ({
    value: Number(t.id),
    label: `${t.name} (${t.key})`,
  })),
);

const filterOption = (input: string, option?: DefaultOptionType) =>
  String(option?.label ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

const loadData = async () => {
  loading.value = true;
  try {
    const [defaultsRes, templatesRes] = await Promise.all([
      getScenarioDefaults(),
      getPromptTemplates({ activeOnly: true, limit: 200 }),
    ]);
    defaults.value = defaultsRes;
    templates.value = templatesRes.data;

    // Initialize editing values from current defaults
    const editVals: Record<string, number | undefined> = {};
    for (const d of defaultsRes) {
      editVals[d.scenario] = Number(d.templateId);
    }
    editingValues.value = editVals;
  } catch {
    message.error('加载场景配置失败');
  } finally {
    loading.value = false;
  }
};

const handleSave = async (scenario: AiScenario) => {
  const templateId = editingValues.value[scenario];
  if (!templateId) {
    message.warning('请选择模板');
    return;
  }

  saving.value = scenario;
  try {
    await setScenarioDefault(scenario, { templateId });
    message.success(`${AI_SCENARIO_LABELS[scenario]} 默认模板设置成功`);
    await loadData();
  } catch {
    message.error('保存失败');
  } finally {
    saving.value = null;
  }
};

const columns = [
  {
    title: '场景',
    dataIndex: 'label',
    key: 'label',
    width: 140,
  },
  {
    title: '当前绑定模板',
    key: 'template',
    width: 300,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center' as const,
  },
];

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadData();
    }
  },
);
</script>

<template>
  <Drawer
    v-model:open="drawerVisible"
    title="场景默认模板配置"
    :width="680"
    placement="right"
  >
    <template #extra>
      <Space>
        <SettingOutlined />
        <Typography.Text type="secondary">
          为每个 AI 场景设置默认使用的提示词模板
        </Typography.Text>
      </Space>
    </template>

    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="scenarioList"
        :pagination="false"
        row-key="scenario"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'label'">
            <Space>
              <Tag :color="record.currentTemplateId ? 'green' : 'default'">
                {{ record.label }}
              </Tag>
            </Space>
          </template>

          <template v-if="column.key === 'template'">
            <Select
              v-model:value="editingValues[record.scenario]"
              :options="templateOptions"
              placeholder="选择默认模板"
              style="width: 100%"
              show-search
              :filter-option="filterOption"
              allow-clear
            />
          </template>

          <template v-if="column.key === 'action'">
            <Button
              type="primary"
              size="small"
              :loading="saving === record.scenario"
              :disabled="!editingValues[record.scenario]"
              @click="handleSave(record.scenario)"
            >
              <CheckOutlined />
              保存
            </Button>
          </template>
        </template>

        <template #emptyText>
          <Empty description="暂无场景配置" />
        </template>
      </Table>
    </Spin>
  </Drawer>
</template>
