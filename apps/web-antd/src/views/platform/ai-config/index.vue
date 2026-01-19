<template>
  <Page title="AI 配置管理" description="管理平台默认 AI 配置和租户配置">
    <Tabs v-model:activeKey="activeTab" class="config-tabs">
      <!-- 平台默认配置 -->
      <TabPane key="defaults" tab="平台默认配置">
        <Card class="defaults-card">
          <template #extra>
            <Space>
              <Button @click="handleTestAllConnections" :loading="testingAll">
                <ApiOutlined />
                测试所有连接
              </Button>
              <Button type="primary" @click="addDefaultConfig">
                <PlusOutlined />
                添加场景
              </Button>
            </Space>
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
                <template v-else-if="column.key === 'apiBaseUrl'">
                  <Typography.Text
                    :ellipsis="{ tooltip: record.apiBaseUrl }"
                    style="max-width: 200px"
                  >
                    {{ record.apiBaseUrl || '-' }}
                  </Typography.Text>
                </template>
                <template v-else-if="column.key === 'apiKey'">
                  <Tag v-if="record.apiKey" color="green">已配置</Tag>
                  <Tag v-else color="warning">未配置</Tag>
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
                      @click="handleTestConnection(record)"
                      :loading="testingScenario === record.scenario"
                    >
                      <ApiOutlined />
                      测试
                    </Button>
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
              show-search
              :filter-option="filterTenantOption"
            >
              <SelectOption
                v-for="tenant in tenantSummaries"
                :key="tenant.tenantId"
                :value="tenant.tenantId"
              >
                <div class="tenant-option">
                  <span>{{ tenant.tenantName }}</span>
                  <Progress
                    :percent="tenant.quotaUsagePercent"
                    :size="[80, 6]"
                    :stroke-color="getQuotaColor(tenant.quotaUsagePercent)"
                  />
                </div>
              </SelectOption>
            </Select>
          </template>

          <Spin :spinning="loadingTenantConfig">
            <Empty v-if="!selectedTenantId" description="请选择租户查看配置" />
            <div v-else>
              <!-- 配额信息卡片 -->
              <Card size="small" class="quota-card mb-4">
                <Row :gutter="24">
                  <Col :span="8">
                    <Statistic
                      title="月配额"
                      :value="selectedTenantQuota.monthlyTokenQuota"
                      suffix="tokens"
                    />
                  </Col>
                  <Col :span="8">
                    <Statistic
                      title="已使用"
                      :value="selectedTenantQuota.usedTokens"
                      suffix="tokens"
                      :value-style="{
                        color: getQuotaColor(
                          selectedTenantQuota.quotaUsagePercent,
                        ),
                      }"
                    />
                  </Col>
                  <Col :span="8">
                    <div class="quota-actions">
                      <Progress
                        type="circle"
                        :percent="selectedTenantQuota.quotaUsagePercent"
                        :size="60"
                        :stroke-color="
                          getQuotaColor(selectedTenantQuota.quotaUsagePercent)
                        "
                      />
                      <Button
                        size="small"
                        @click="handleResetQuota"
                        :loading="resettingQuota"
                      >
                        <ReloadOutlined />
                        重置配额
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>

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
                  <template v-else-if="column.key === 'isEnabled'">
                    <Tag :color="record.isEnabled ? 'success' : 'error'">
                      {{ record.isEnabled ? '启用' : '禁用' }}
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
                :value="tenantSummaries.length"
                suffix="个"
              >
                <template #prefix>
                  <TeamOutlined style="color: #722ed1" />
                </template>
              </Statistic>
            </Col>
          </Row>
        </Card>

        <!-- 租户配额使用排行 -->
        <Card title="租户配额使用排行" class="mt-4">
          <Table
            :columns="quotaRankColumns"
            :data-source="sortedTenantSummaries"
            :pagination="{ pageSize: 10 }"
            row-key="tenantId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'usage'">
                <Progress
                  :percent="record.quotaUsagePercent"
                  :stroke-color="getQuotaColor(record.quotaUsagePercent)"
                  :format="(p: number) => `${p}%`"
                />
              </template>
              <template v-else-if="column.key === 'tokens'">
                {{ formatNumber(record.usedTokens) }} /
                {{ formatNumber(record.monthlyTokenQuota) }}
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>
    </Tabs>

    <!-- 编辑默认配置对话框 -->
    <Modal
      v-model:open="defaultModalVisible"
      :title="editingDefault ? '编辑默认配置' : '添加默认配置'"
      :confirm-loading="saving"
      width="600px"
      @ok="handleSaveDefault"
      @cancel="defaultModalVisible = false"
    >
      <Form layout="vertical" :model="defaultForm">
        <Row :gutter="16">
          <Col :span="12">
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
          </Col>
          <Col :span="12">
            <FormItem label="模型" required>
              <Input
                v-model:value="defaultForm.modelName"
                placeholder="输入模型名称，如 qwen:7b"
              />
            </FormItem>
          </Col>
        </Row>

        <Divider>API 连接配置</Divider>

        <FormItem label="API Base URL">
          <Input
            v-model:value="defaultForm.apiBaseUrl"
            placeholder="http://localhost:3001/v1"
          >
            <template #addonAfter>
              <Button
                type="link"
                size="small"
                @click="handleTestFormConnection"
                :loading="testingForm"
                :disabled="!defaultForm.apiBaseUrl"
              >
                <ApiOutlined />
                测试连接
              </Button>
            </template>
          </Input>
        </FormItem>

        <FormItem label="API Key">
          <InputPassword
            v-model:value="defaultForm.apiKey"
            placeholder="输入 API Key（留空保持原有配置）"
          />
          <div class="form-hint">
            <InfoCircleOutlined />
            <span v-if="editingDefault?.apiKey"
              >当前已配置 API Key，留空将保持不变</span
            >
            <span v-else>首次配置需要输入有效的 API Key</span>
          </div>
        </FormItem>

        <Divider>模型参数</Divider>

        <Row :gutter="16">
          <Col :span="12">
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
          </Col>
          <Col :span="12">
            <FormItem label="Top P">
              <InputNumber
                v-model:value="defaultForm.topP"
                :min="0"
                :max="1"
                :step="0.1"
                style="width: 100%"
                placeholder="可选，留空使用模型默认"
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="最大 Token">
              <InputNumber
                v-model:value="defaultForm.maxTokens"
                :min="100"
                :max="128000"
                :step="100"
                style="width: 100%"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="超时时间 (毫秒)">
              <InputNumber
                v-model:value="defaultForm.timeout"
                :min="5000"
                :max="600000"
                :step="1000"
                style="width: 100%"
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem label="描述">
          <Input.TextArea v-model:value="defaultForm.description" rows="2" />
        </FormItem>

        <FormItem label="状态">
          <Switch
            v-model:checked="defaultForm.isActive"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </FormItem>
      </Form>

      <!-- 连接测试结果 -->
      <Alert
        v-if="connectionTestResult"
        :type="connectionTestResult.success ? 'success' : 'error'"
        show-icon
        class="mt-4"
      >
        <template #message>
          <div class="connection-result">
            <span>{{ connectionTestResult.message }}</span>
            <span v-if="connectionTestResult.latency" class="latency">
              延迟: {{ connectionTestResult.latency }}ms
            </span>
          </div>
        </template>
      </Alert>
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
        <FormItem label="启用状态">
          <Switch
            v-model:checked="tenantForm.isEnabled"
            checked-children="启用"
            un-checked-children="禁用"
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
  Progress,
  Divider,
  Typography,
} from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  UndoOutlined,
  RobotOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';

const InputPassword = Input.Password;

interface DefaultConfig {
  scenario: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  topP: number | null;
  description: string | null;
  apiBaseUrl: string;
  apiKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TenantConfig {
  scenario: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  topP: number | null;
  isEnabled: boolean;
  isCustomized?: boolean;
}

interface TenantSummary {
  tenantId: string;
  tenantName: string;
  monthlyTokenQuota: number;
  usedTokens: number;
  quotaUsagePercent: number;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

const activeTab = ref('defaults');
const loadingDefaults = ref(false);
const loadingTenants = ref(false);
const loadingTenantConfig = ref(false);
const saving = ref(false);
const testingScenario = ref<string | null>(null);
const testingAll = ref(false);
const testingForm = ref(false);
const resettingQuota = ref(false);

const defaultConfigs = ref<DefaultConfig[]>([]);
const tenantSummaries = ref<TenantSummary[]>([]);
const tenantConfigs = ref<TenantConfig[]>([]);
const selectedTenantId = ref<string | null>(null);

const defaultModalVisible = ref(false);
const tenantModalVisible = ref(false);
const editingDefault = ref<DefaultConfig | null>(null);
const editingTenantConfig = ref<TenantConfig | null>(null);
const connectionTestResult = ref<ConnectionTestResult | null>(null);

const stats = ref({
  totalCalls: 0,
  totalTokens: 0,
  activeTenants: 0,
});

const selectedTenantQuota = computed(() => {
  const tenant = tenantSummaries.value.find(
    (t) => t.tenantId === selectedTenantId.value,
  );
  return (
    tenant || { monthlyTokenQuota: 0, usedTokens: 0, quotaUsagePercent: 0 }
  );
});

const sortedTenantSummaries = computed(() => {
  return [...tenantSummaries.value].sort(
    (a, b) => b.quotaUsagePercent - a.quotaUsagePercent,
  );
});

const defaultForm = reactive({
  scenario: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 120000,
  topP: null as number | null,
  description: '',
  apiBaseUrl: 'http://localhost:3001/v1',
  apiKey: '',
  isActive: true,
});

const tenantForm = reactive({
  modelName: null as string | null,
  temperature: null as number | null,
  maxTokens: null as number | null,
  timeout: null as number | null,
  isEnabled: true,
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

const getQuotaColor = (percent: number): string => {
  if (percent >= 90) return '#ff4d4f';
  if (percent >= 70) return '#faad14';
  return '#52c41a';
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const filterTenantOption = (input: string, option: any) => {
  return option.children?.[0]?.children
    ?.toLowerCase()
    ?.includes(input.toLowerCase());
};

const defaultColumns = [
  { title: '场景', dataIndex: 'scenario', key: 'scenario', width: 140 },
  { title: '模型', dataIndex: 'modelName', key: 'modelName', width: 150 },
  { title: 'API 地址', key: 'apiBaseUrl', width: 200 },
  { title: 'API Key', key: 'apiKey', width: 100 },
  { title: '温度', dataIndex: 'temperature', key: 'temperature', width: 80 },
  { title: '最大 Token', dataIndex: 'maxTokens', key: 'maxTokens', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

const tenantColumns = [
  { title: '场景', dataIndex: 'scenario', key: 'scenario' },
  { title: '模型', dataIndex: 'modelName', key: 'modelName' },
  { title: '温度', dataIndex: 'temperature', key: 'temperature' },
  { title: '最大 Token', dataIndex: 'maxTokens', key: 'maxTokens' },
  { title: '配置状态', key: 'customized' },
  { title: '启用', key: 'isEnabled', width: 80 },
  { title: '操作', key: 'action', width: 150 },
];

const quotaRankColumns = [
  { title: '租户', dataIndex: 'tenantName', key: 'tenantName' },
  { title: 'Token 使用', key: 'tokens', width: 200 },
  { title: '使用率', key: 'usage', width: 200 },
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

const fetchTenantSummaries = async () => {
  loadingTenants.value = true;
  try {
    const res = await requestClient.get<TenantSummary[]>(
      '/platform/ai-config/tenants',
    );
    tenantSummaries.value = res || [];
    stats.value.activeTenants = tenantSummaries.value.length;
    stats.value.totalTokens = tenantSummaries.value.reduce(
      (sum, t) => sum + t.usedTokens,
      0,
    );
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
    // 合并默认配置，标记是否自定义
    const scenarioConfigs = res.scenarios || [];
    const scenarioMap = new Map(scenarioConfigs.map((s) => [s.scenario, s]));

    tenantConfigs.value = Object.keys(scenarioNames).map((scenario) => {
      const custom = scenarioMap.get(scenario);
      const defaultConfig = defaultConfigs.value.find(
        (d) => d.scenario === scenario,
      );
      return {
        scenario,
        modelName: custom?.modelName || defaultConfig?.modelName || '',
        temperature: custom?.temperature ?? defaultConfig?.temperature ?? 0.7,
        maxTokens: custom?.maxTokens || defaultConfig?.maxTokens || 4096,
        timeout: custom?.timeout || defaultConfig?.timeout || 120000,
        topP: custom?.topP || null,
        isEnabled: custom?.isEnabled ?? true,
        isCustomized: !!custom,
      };
    });
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

const handleTestConnection = async (record: DefaultConfig) => {
  testingScenario.value = record.scenario;
  try {
    const res = await requestClient.post<ConnectionTestResult>(
      '/platform/ai-config/test-connection',
      {
        baseUrl: record.apiBaseUrl,
        model: record.modelName,
        // apiKey 不传，后端会使用数据库中存储的 key
      },
    );
    if (res.success) {
      message.success(
        `${getScenarioName(record.scenario)}: 连接成功 (${res.latency}ms)`,
      );
    } else {
      message.error(`${getScenarioName(record.scenario)}: ${res.message}`);
    }
  } catch (error: any) {
    message.error(`测试失败: ${error.message}`);
  } finally {
    testingScenario.value = null;
  }
};

const handleTestAllConnections = async () => {
  testingAll.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const config of defaultConfigs.value) {
    if (!config.isActive) continue;
    try {
      const res = await requestClient.post<ConnectionTestResult>(
        '/platform/ai-config/test-connection',
        {
          baseUrl: config.apiBaseUrl,
          model: config.modelName,
          // apiKey 不传，后端会使用数据库中存储的 key
        },
      );
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch {
      failCount++;
    }
  }

  testingAll.value = false;
  message.info(`测试完成: ${successCount} 成功, ${failCount} 失败`);
};

const handleTestFormConnection = async () => {
  if (!defaultForm.apiBaseUrl || !defaultForm.modelName) {
    message.warning('请先填写 API 地址和模型名称');
    return;
  }

  testingForm.value = true;
  connectionTestResult.value = null;

  try {
    // 如果 apiKey 是掩码格式 (如 sk-***xxxx) 或为空，不传，让后端使用存储的 key
    const shouldSendApiKey =
      defaultForm.apiKey && !defaultForm.apiKey.includes('***');
    const res = await requestClient.post<ConnectionTestResult>(
      '/platform/ai-config/test-connection',
      {
        baseUrl: defaultForm.apiBaseUrl,
        model: defaultForm.modelName,
        ...(shouldSendApiKey ? { apiKey: defaultForm.apiKey } : {}),
      },
    );
    connectionTestResult.value = res;
  } catch (error: any) {
    connectionTestResult.value = {
      success: false,
      message: error.message || '测试失败',
    };
  } finally {
    testingForm.value = false;
  }
};

const handleResetQuota = () => {
  if (!selectedTenantId.value) return;

  Modal.confirm({
    title: '确认重置配额',
    content: '确定要重置该租户的月配额使用量吗？此操作不可撤销。',
    onOk: async () => {
      resettingQuota.value = true;
      try {
        await requestClient.post(
          `/platform/ai-config/tenants/${selectedTenantId.value}/reset-quota`,
        );
        message.success('配额已重置');
        await fetchTenantSummaries();
      } catch (error: any) {
        message.error(error.message || '重置失败');
      } finally {
        resettingQuota.value = false;
      }
    },
  });
};

const addDefaultConfig = () => {
  editingDefault.value = null;
  connectionTestResult.value = null;
  defaultForm.scenario = '';
  defaultForm.modelName = '';
  defaultForm.temperature = 0.7;
  defaultForm.maxTokens = 4096;
  defaultForm.timeout = 120000;
  defaultForm.topP = null;
  defaultForm.description = '';
  defaultForm.apiBaseUrl = 'http://localhost:3001/v1';
  defaultForm.apiKey = '';
  defaultForm.isActive = true;
  defaultModalVisible.value = true;
};

const editDefault = (record: DefaultConfig) => {
  editingDefault.value = record;
  connectionTestResult.value = null;
  defaultForm.scenario = record.scenario;
  defaultForm.modelName = record.modelName;
  defaultForm.temperature = record.temperature;
  defaultForm.maxTokens = record.maxTokens;
  defaultForm.timeout = record.timeout;
  defaultForm.topP = record.topP;
  defaultForm.description = record.description || '';
  defaultForm.apiBaseUrl = record.apiBaseUrl || 'http://localhost:3001/v1';
  defaultForm.apiKey = ''; // 不回显 API Key
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
    const payload: Record<string, any> = {
      modelName: defaultForm.modelName,
      temperature: defaultForm.temperature,
      maxTokens: defaultForm.maxTokens,
      timeout: defaultForm.timeout,
      description: defaultForm.description || null,
      isActive: defaultForm.isActive,
      apiBaseUrl: defaultForm.apiBaseUrl,
    };

    // 只有填写了 API Key 才提交
    if (defaultForm.apiKey) {
      payload.apiKey = defaultForm.apiKey;
    }

    if (defaultForm.topP !== null) {
      payload.topP = defaultForm.topP;
    }

    await requestClient.put(
      `/platform/ai-config/defaults/${defaultForm.scenario}`,
      payload,
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
  tenantForm.timeout = record.isCustomized ? record.timeout : null;
  tenantForm.isEnabled = record.isEnabled;
  tenantModalVisible.value = true;
};

const handleSaveTenantConfig = async () => {
  if (!selectedTenantId.value || !editingTenantConfig.value) return;

  saving.value = true;
  try {
    const data: Record<string, any> = {
      scenarios: [
        {
          scenario: editingTenantConfig.value.scenario,
          modelName: tenantForm.modelName,
          temperature: tenantForm.temperature,
          maxTokens: tenantForm.maxTokens,
          timeout: tenantForm.timeout,
          isEnabled: tenantForm.isEnabled,
        },
      ],
    };

    await requestClient.put(
      `/platform/ai-config/tenants/${selectedTenantId.value}`,
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
        // 通过更新为空值来重置
        await requestClient.put(
          `/platform/ai-config/tenants/${selectedTenantId.value}`,
          {
            scenarios: [
              {
                scenario,
                modelName: null,
                temperature: null,
                maxTokens: null,
                timeout: null,
                isEnabled: true,
              },
            ],
          },
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
  fetchTenantSummaries();
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

.tenant-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quota-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.quota-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.form-hint {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.connection-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connection-result .latency {
  font-weight: 500;
  color: #52c41a;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
