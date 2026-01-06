<template>
  <Page title="AI 配置管理" description="管理平台默认 AI 配置和租户配置">
    <Tabs v-model:activeKey="activeTab" class="config-tabs">
      <!-- 平台默认配置 -->
      <TabPane key="defaults" tab="平台默认配置">
        <Card class="defaults-card">
          <template #extra>
            <Button type="primary" @click="addDefaultConfig">
              <PlusOutlined />
              添加场景
            </Button>
          </template>

          <Spin :spinning="loadingDefaults">
            <Table
              :columns="defaultColumns"
              :data-source="defaultConfigs"
              :pagination="false"
              row-key="scenario"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'scenario'">
                  <div class="scenario-cell">
                    <RobotOutlined class="scenario-icon" />
                    <span>{{ getScenarioName(record.scenario) }}</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'status'">
                  <Tag :color="record.isActive ? 'success' : 'default'">
                    {{ record.isActive ? '启用' : '禁用' }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="editDefault(record)"
                    >
                      <EditOutlined />
                      编辑
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </Spin>
        </Card>
      </TabPane>

      <!-- 租户配置 -->
      <TabPane key="tenants" tab="租户配置">
        <Card class="tenants-card">
          <template #extra>
            <Select
              v-model:value="selectedTenantId"
              placeholder="选择租户"
              style="width: 200px"
              :loading="loadingTenants"
              @change="handleTenantChange"
            >
              <SelectOption
                v-for="tenant in tenants"
                :key="tenant.id"
                :value="tenant.id"
              >
                {{ tenant.name }}
              </SelectOption>
            </Select>
          </template>

          <Spin :spinning="loadingTenantConfig">
            <Empty v-if="!selectedTenantId" description="请选择租户查看配置" />
            <div v-else>
              <Alert type="info" show-icon class="mb-4">
                <template #message>
                  租户自定义配置会覆盖平台默认配置。未自定义的场景将使用平台默认值。
                </template>
              </Alert>

              <Table
                :columns="tenantColumns"
                :data-source="tenantConfigs"
                :pagination="false"
                row-key="scenario"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'scenario'">
                    <div class="scenario-cell">
                      <RobotOutlined class="scenario-icon" />
                      <span>{{ getScenarioName(record.scenario) }}</span>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'customized'">
                    <Tag :color="record.isCustomized ? 'blue' : 'default'">
                      {{ record.isCustomized ? '已自定义' : '使用默认' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        @click="editTenantConfig(record)"
                      >
                        <EditOutlined />
                        编辑
                      </Button>
                      <Button
                        v-if="record.isCustomized"
                        type="link"
                        size="small"
                        danger
                        @click="resetTenantConfig(record.scenario)"
                      >
                        <UndoOutlined />
                        重置
                      </Button>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>
          </Spin>
        </Card>
      </TabPane>

      <!-- 使用统计 -->
      <TabPane key="stats" tab="使用统计">
        <Card>
          <Row :gutter="24">
            <Col :span="8">
              <Statistic
                title="总 API 调用次数"
                :value="stats.totalCalls"
                suffix="次"
              >
                <template #prefix>
                  <ApiOutlined style="color: #1890ff" />
                </template>
              </Statistic>
            </Col>
            <Col :span="8">
              <Statistic
                title="总 Token 使用量"
                :value="stats.totalTokens"
                suffix="tokens"
              >
                <template #prefix>
                  <ThunderboltOutlined style="color: #52c41a" />
                </template>
              </Statistic>
            </Col>
            <Col :span="8">
              <Statistic
                title="活跃租户数"
                :value="stats.activeTenants"
                suffix="个"
              >
                <template #prefix>
                  <TeamOutlined style="color: #722ed1" />
                </template>
              </Statistic>
            </Col>
          </Row>
        </Card>
      </TabPane>
    </Tabs>

    <!-- 编辑默认配置对话框 -->
    <Modal
      v-model:open="defaultModalVisible"
      :title="editingDefault ? '编辑默认配置' : '添加默认配置'"
      :confirm-loading="saving"
      @ok="handleSaveDefault"
      @cancel="defaultModalVisible = false"
    >
      <Form layout="vertical" :model="defaultForm">
        <FormItem label="场景" required>
          <Select
            v-model:value="defaultForm.scenario"
            placeholder="选择场景"
            :disabled="!!editingDefault"
          >
            <SelectOption
              v-for="s in availableScenarios"
              :key="s.value"
              :value="s.value"
            >
              {{ s.label }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="模型" required>
          <Input
            v-model:value="defaultForm.modelName"
            placeholder="输入模型名称"
          />
        </FormItem>
        <FormItem label="温度 (Temperature)">
          <Slider
            v-model:value="defaultForm.temperature"
            :min="0"
            :max="2"
            :step="0.1"
          />
          <InputNumber
            v-model:value="defaultForm.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="最大 Token">
          <InputNumber
            v-model:value="defaultForm.maxTokens"
            :min="100"
            :max="128000"
            :step="100"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="超时时间 (毫秒)">
          <InputNumber
            v-model:value="defaultForm.timeout"
            :min="5000"
            :max="600000"
            :step="1000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="描述">
          <Input.TextArea v-model:value="defaultForm.description" rows="3" />
        </FormItem>
        <FormItem label="状态">
          <Switch
            v-model:checked="defaultForm.isActive"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 编辑租户配置对话框 -->
    <Modal
      v-model:open="tenantModalVisible"
      title="编辑租户配置"
      :confirm-loading="saving"
      @ok="handleSaveTenantConfig"
      @cancel="tenantModalVisible = false"
    >
      <Form layout="vertical" :model="tenantForm">
        <FormItem label="模型">
          <Input
            v-model:value="tenantForm.modelName"
            placeholder="留空使用默认"
            allow-clear
          />
        </FormItem>
        <FormItem label="温度 (Temperature)">
          <InputNumber
            v-model:value="tenantForm.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            style="width: 100%"
            placeholder="留空使用默认"
          />
        </FormItem>
        <FormItem label="最大 Token">
          <InputNumber
            v-model:value="tenantForm.maxTokens"
            :min="100"
            :max="128000"
            :step="100"
            style="width: 100%"
            placeholder="留空使用默认"
          />
        </FormItem>
        <FormItem label="超时时间 (毫秒)">
          <InputNumber
            v-model:value="tenantForm.timeout"
            :min="5000"
            :max="600000"
            :step="1000"
            style="width: 100%"
            placeholder="留空使用默认"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  message,
  Card,
  Tabs,
  TabPane,
  Table,
  Button,
  Tag,
  Space,
  Select,
  SelectOption,
  Alert,
  Empty,
  Spin,
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Slider,
  Switch,
  Row,
  Col,
  Statistic,
} from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  UndoOutlined,
  RobotOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';

interface DefaultConfig {
  id: number;
  scenario: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  topP: number | null;
  description: string | null;
  isActive: boolean;
}

interface TenantConfig {
  scenario: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  isCustomized: boolean;
}

interface Tenant {
  id: string;
  name: string;
}

const activeTab = ref('defaults');
const loadingDefaults = ref(false);
const loadingTenants = ref(false);
const loadingTenantConfig = ref(false);
const saving = ref(false);

const defaultConfigs = ref<DefaultConfig[]>([]);
const tenants = ref<Tenant[]>([]);
const tenantConfigs = ref<TenantConfig[]>([]);
const selectedTenantId = ref<string | null>(null);

const defaultModalVisible = ref(false);
const tenantModalVisible = ref(false);
const editingDefault = ref<DefaultConfig | null>(null);
const editingTenantConfig = ref<TenantConfig | null>(null);

const stats = ref({
  totalCalls: 0,
  totalTokens: 0,
  activeTenants: 0,
});

const defaultForm = reactive({
  scenario: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 120000,
  description: '',
  isActive: true,
});

const tenantForm = reactive({
  modelName: null as string | null,
  temperature: null as number | null,
  maxTokens: null as number | null,
  timeout: null as number | null,
});

const scenarioNames: Record<string, string> = {
  LLM_CHAT: '普通对话',
  LLM_REASONING: '结构化推理',
  VISION_OCR: 'OCR 识别',
  VISION_ANALYSIS: '图像分析',
  EMBEDDING: '向量嵌入',
};

const availableScenarios = computed(() => {
  const existingScenarios = new Set(
    defaultConfigs.value.map((c) => c.scenario),
  );
  return Object.entries(scenarioNames)
    .filter(
      ([value]) =>
        !existingScenarios.has(value) ||
        editingDefault.value?.scenario === value,
    )
    .map(([value, label]) => ({ value, label }));
});

const getScenarioName = (scenario: string): string => {
  return scenarioNames[scenario] || scenario;
};

const defaultColumns = [
  { title: '场景', dataIndex: 'scenario', key: 'scenario' },
  { title: '模型', dataIndex: 'modelName', key: 'modelName' },
  { title: '温度', dataIndex: 'temperature', key: 'temperature' },
  { title: '最大 Token', dataIndex: 'maxTokens', key: 'maxTokens' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action', width: 120 },
];

const tenantColumns = [
  { title: '场景', dataIndex: 'scenario', key: 'scenario' },
  { title: '模型', dataIndex: 'modelName', key: 'modelName' },
  { title: '温度', dataIndex: 'temperature', key: 'temperature' },
  { title: '最大 Token', dataIndex: 'maxTokens', key: 'maxTokens' },
  { title: '配置状态', key: 'customized' },
  { title: '操作', key: 'action', width: 150 },
];

const fetchDefaults = async () => {
  loadingDefaults.value = true;
  try {
    const res = await requestClient.get<{ defaults: DefaultConfig[] }>(
      '/platform/ai-config/defaults',
    );
    defaultConfigs.value = res.defaults || [];
  } catch (error: any) {
    message.error(error.message || '获取默认配置失败');
  } finally {
    loadingDefaults.value = false;
  }
};

const fetchTenants = async () => {
  loadingTenants.value = true;
  try {
    const res = await requestClient.get<{ items: Tenant[] }>(
      '/platform/tenants',
      {
        params: { limit: 100 },
      },
    );
    tenants.value = res.items || [];
  } catch (error: any) {
    console.error('获取租户列表失败', error);
  } finally {
    loadingTenants.value = false;
  }
};

const fetchTenantConfig = async (tenantId: string) => {
  loadingTenantConfig.value = true;
  try {
    const res = await requestClient.get<{ scenarios: TenantConfig[] }>(
      `/platform/ai-config/tenants/${tenantId}`,
    );
    tenantConfigs.value = res.scenarios || [];
  } catch (error: any) {
    message.error(error.message || '获取租户配置失败');
  } finally {
    loadingTenantConfig.value = false;
  }
};

const handleTenantChange = (tenantId: string) => {
  if (tenantId) {
    fetchTenantConfig(tenantId);
  } else {
    tenantConfigs.value = [];
  }
};

const addDefaultConfig = () => {
  editingDefault.value = null;
  defaultForm.scenario = '';
  defaultForm.modelName = '';
  defaultForm.temperature = 0.7;
  defaultForm.maxTokens = 4096;
  defaultForm.timeout = 120000;
  defaultForm.description = '';
  defaultForm.isActive = true;
  defaultModalVisible.value = true;
};

const editDefault = (record: DefaultConfig) => {
  editingDefault.value = record;
  defaultForm.scenario = record.scenario;
  defaultForm.modelName = record.modelName;
  defaultForm.temperature = record.temperature;
  defaultForm.maxTokens = record.maxTokens;
  defaultForm.timeout = record.timeout;
  defaultForm.description = record.description || '';
  defaultForm.isActive = record.isActive;
  defaultModalVisible.value = true;
};

const handleSaveDefault = async () => {
  if (!defaultForm.scenario || !defaultForm.modelName) {
    message.warning('请填写必填字段');
    return;
  }

  saving.value = true;
  try {
    await requestClient.put(
      `/platform/ai-config/defaults/${defaultForm.scenario}`,
      {
        modelName: defaultForm.modelName,
        temperature: defaultForm.temperature,
        maxTokens: defaultForm.maxTokens,
        timeout: defaultForm.timeout,
        description: defaultForm.description || null,
        isActive: defaultForm.isActive,
      },
    );
    message.success('保存成功');
    defaultModalVisible.value = false;
    await fetchDefaults();
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const editTenantConfig = (record: TenantConfig) => {
  editingTenantConfig.value = record;
  tenantForm.modelName = record.isCustomized ? record.modelName : null;
  tenantForm.temperature = record.isCustomized ? record.temperature : null;
  tenantForm.maxTokens = record.isCustomized ? record.maxTokens : null;
  tenantForm.timeout = null;
  tenantModalVisible.value = true;
};

const handleSaveTenantConfig = async () => {
  if (!selectedTenantId.value || !editingTenantConfig.value) return;

  saving.value = true;
  try {
    const data: Record<string, any> = {};
    if (tenantForm.modelName) data.modelName = tenantForm.modelName;
    if (tenantForm.temperature !== null)
      data.temperature = tenantForm.temperature;
    if (tenantForm.maxTokens !== null) data.maxTokens = tenantForm.maxTokens;
    if (tenantForm.timeout !== null) data.timeout = tenantForm.timeout;

    await requestClient.put(
      `/platform/ai-config/tenants/${selectedTenantId.value}/scenarios/${editingTenantConfig.value.scenario}`,
      data,
    );
    message.success('保存成功');
    tenantModalVisible.value = false;
    await fetchTenantConfig(selectedTenantId.value);
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const resetTenantConfig = async (scenario: string) => {
  if (!selectedTenantId.value) return;

  Modal.confirm({
    title: '确认重置',
    content: `确定要将 ${getScenarioName(scenario)} 重置为默认配置吗？`,
    onOk: async () => {
      try {
        await requestClient.delete(
          `/platform/ai-config/tenants/${selectedTenantId.value}/scenarios/${scenario}`,
        );
        message.success('已重置为默认配置');
        await fetchTenantConfig(selectedTenantId.value as string);
      } catch (error: any) {
        message.error(error.message || '重置失败');
      }
    },
  });
};

onMounted(() => {
  fetchDefaults();
  fetchTenants();
});
</script>

<style scoped>
.config-tabs {
  padding: 16px;
  background: var(--component-background, #fff);
  border-radius: 12px;
}

.config-tabs :deep(.ant-tabs-content) {
  padding-top: 16px;
}

.defaults-card,
.tenants-card {
  border-radius: 8px;
}

.scenario-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scenario-icon {
  font-size: 16px;
  color: #1890ff;
}
</style>
