<template>
  <Page
    title="企业微信配置"
    description="配置企业微信集成，实现员工和客户数据自动同步"
  >
    <!-- 顶部操作栏 -->
    <div class="action-bar mb-6">
      <div class="status-info">
        <CheckCircleFilled v-if="configStatus.isConfigured && configStatus.isEnabled" class="status-icon text-green-500" />
        <ExclamationCircleFilled v-else-if="configStatus.isConfigured" class="status-icon text-orange-500" />
        <CloseCircleFilled v-else class="status-icon text-gray-400" />
        <span class="status-text">
          {{ configStatus.isConfigured && configStatus.isEnabled ? '已连接' : configStatus.isConfigured ? '未启用' : '未配置' }}
        </span>
      </div>
      <Space size="middle">
        <Switch
          v-model:checked="formState.isEnabled"
          checked-children="已启用"
          un-checked-children="已禁用"
        />
        <Button type="primary" size="large" :loading="saving" @click="handleSave">
          <template #icon><SaveOutlined /></template>
          保存配置
        </Button>
        <Button size="large" :loading="testing" @click="handleTestConnection">
          <template #icon><ApiOutlined /></template>
          测试连接
        </Button>
      </Space>
    </div>

    <Row :gutter="24">
      <!-- 左侧配置区域 -->
      <Col :span="24" :lg="16">
        <!-- 基础配置 -->
        <Card class="config-card mb-6">
          <template #title>
            <SettingOutlined class="mr-2" />
            基础配置
          </template>

          <Form layout="vertical" class="config-form">
            <!-- 企业ID -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-number">1</span>
                <div class="section-title">
                  <div class="title">企业ID (Corp ID)</div>
                  <div class="desc">企业的唯一标识，用于调用企微API</div>
                </div>
              </div>
              <div class="section-content">
                <Input
                  v-model:value="formState.corpId"
                  placeholder="请输入企业ID，如 ww1234567890abcdef"
                  size="large"
                  class="config-input"
                >
                  <template #prefix>
                    <BankOutlined class="text-gray-400" />
                  </template>
                </Input>
                <div class="input-hint">
                  <InfoCircleOutlined />
                  获取路径：企业微信管理后台 → 我的企业 → 企业信息
                </div>
              </div>
            </div>

            <!-- 自建应用 AgentId -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-number">2</span>
                <div class="section-title">
                  <div class="title">自建应用 AgentId</div>
                  <div class="desc">自建应用的唯一标识</div>
                </div>
                <Tag v-if="currentConfig.agentId" color="success" class="ml-auto">已配置</Tag>
              </div>
              <div class="section-content">
                <Input
                  v-model:value="formState.agentId"
                  placeholder="请输入自建应用 AgentId，如 1000002"
                  size="large"
                  class="config-input"
                >
                  <template #prefix>
                    <KeyOutlined class="text-gray-400" />
                  </template>
                </Input>
                <div class="input-hint">
                  <InfoCircleOutlined />
                  获取路径：应用管理 → 应用 → 自建 → 选择应用
                </div>
              </div>
            </div>

            <!-- 自建应用 Secret (推荐) -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-number">3</span>
                <div class="section-title">
                  <div class="title">自建应用 Secret</div>
                  <div class="desc">用于同步企业通讯录和员工数据</div>
                </div>
                <Tag color="blue" class="ml-auto">推荐</Tag>
                <Tag v-if="currentConfig.agentSecret" color="success" class="ml-2">已配置</Tag>
              </div>
              <div class="section-content">
                <InputPassword
                  v-model:value="formState.agentSecret"
                  :placeholder="currentConfig.agentSecret ? '已配置，留空则保持不变' : '请输入自建应用 Secret'"
                  size="large"
                  class="config-input"
                >
                  <template #prefix>
                    <KeyOutlined class="text-gray-400" />
                  </template>
                </InputPassword>
                <div class="input-hint">
                  <InfoCircleOutlined />
                  获取路径：应用管理 → 应用 → 自建 → 选择应用 → 查看 Secret
                </div>
                <Alert type="info" class="mt-3" show-icon>
                  <template #message>
                    <b>推荐使用自建应用Secret</b>：2022年8月起，企业微信限制通讯录同步助手从新IP调用接口，建议改用自建应用Secret
                  </template>
                </Alert>
              </div>
            </div>

            <!-- 通讯录 Secret (可选/已弃用) -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-number">4</span>
                <div class="section-title">
                  <div class="title">通讯录 Secret</div>
                  <div class="desc">旧方式同步通讯录（不推荐）</div>
                </div>
                <Tag color="orange" class="ml-auto">可选</Tag>
                <Tag v-if="currentConfig.contactSecret" color="success" class="ml-2">已配置</Tag>
              </div>
              <div class="section-content">
                <InputPassword
                  v-model:value="formState.contactSecret"
                  :placeholder="currentConfig.contactSecret ? '已配置，留空则保持不变' : '请输入通讯录 Secret'"
                  size="large"
                  class="config-input"
                >
                  <template #prefix>
                    <KeyOutlined class="text-gray-400" />
                  </template>
                </InputPassword>
                <div class="input-hint">
                  <InfoCircleOutlined />
                  获取路径：管理工具 → 通讯录同步 → Secret（已弃用，建议使用上方的自建应用Secret）
                </div>
              </div>
            </div>

            <!-- 客户联系 Secret -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-number">5</span>
                <div class="section-title">
                  <div class="title">客户联系 Secret</div>
                  <div class="desc">用于同步外部联系人（客户）数据</div>
                </div>
                <Tag v-if="currentConfig.externalContactSecret" color="success" class="ml-auto">已配置</Tag>
              </div>
              <div class="section-content">
                <InputPassword
                  v-model:value="formState.externalContactSecret"
                  :placeholder="currentConfig.externalContactSecret ? '已配置，留空则保持不变' : '请输入客户联系 Secret'"
                  size="large"
                  class="config-input"
                >
                  <template #prefix>
                    <KeyOutlined class="text-gray-400" />
                  </template>
                </InputPassword>
                <div class="input-hint">
                  <InfoCircleOutlined />
                  获取路径：客户联系 → 客户 → API → 获取 Secret
                </div>
              </div>
            </div>
          </Form>
        </Card>

        <!-- 事件回调配置 -->
        <Card class="config-card mb-6">
          <template #title>
            <div class="card-header">
              <div class="card-title">
                <ThunderboltOutlined class="mr-2" />
                事件回调配置
                <Tag color="blue" class="ml-2">可选</Tag>
              </div>
            </div>
          </template>

          <Alert type="info" class="mb-4" show-icon>
            <template #message>
              配置回调后，系统可实时接收企微推送的客户变更事件，无需手动同步。
              <b>配置完成后，请点击页面顶部的"保存配置"按钮保存。</b>
            </template>
          </Alert>

          <Form layout="vertical" class="config-form">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem>
                  <template #label>
                    <span>回调 Token</span>
                    <Tag v-if="currentConfig.callbackToken" color="success" class="ml-2">已配置</Tag>
                  </template>
                  <InputGroup compact class="input-with-btn">
                    <Input
                      v-model:value="formState.callbackToken"
                      :placeholder="currentConfig.callbackToken ? '已配置，留空则保持不变' : '点击生成或手动输入'"
                      size="large"
                    />
                    <Button size="large" @click="generateToken">
                      <ReloadOutlined />
                      生成
                    </Button>
                  </InputGroup>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem>
                  <template #label>
                    <span>回调 AES Key (43位)</span>
                    <Tag v-if="currentConfig.callbackAesKey" color="success" class="ml-2">已配置</Tag>
                  </template>
                  <InputGroup compact class="input-with-btn">
                    <Input
                      v-model:value="formState.callbackAesKey"
                      :placeholder="currentConfig.callbackAesKey ? '已配置，留空则保持不变' : '点击生成或手动输入'"
                      size="large"
                    />
                    <Button size="large" @click="generateAesKey">
                      <ReloadOutlined />
                      生成
                    </Button>
                  </InputGroup>
                </FormItem>
              </Col>
            </Row>

            <FormItem label="回调地址 (URL)">
              <InputGroup compact class="input-with-btn">
                <Input
                  :value="callbackInfo.url"
                  readonly
                  placeholder="保存配置后自动生成"
                  size="large"
                  class="readonly-input"
                />
                <Button size="large" @click="copyCallbackUrl">
                  <CopyOutlined />
                  复制
                </Button>
              </InputGroup>
              <div class="input-hint mt-2">
                <InfoCircleOutlined />
                配置完 Token 和 AES Key 后，点击顶部"保存配置"，然后将此 URL、Token、AES Key 一起填入企微后台「接收事件服务器」配置中
              </div>
            </FormItem>
          </Form>
        </Card>
      </Col>

      <!-- 右侧帮助区域 -->
      <Col :span="24" :lg="8">
        <!-- 配置步骤 -->
        <Card class="help-card mb-6">
          <template #title>
            <div class="help-title">
              <QuestionCircleOutlined class="mr-2" />
              配置步骤
            </div>
          </template>

          <div class="steps-container">
            <div class="step-item" :class="{ completed: formState.corpId }">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">获取企业ID</div>
                <div class="step-desc">
                  登录
                  <a href="https://work.weixin.qq.com" target="_blank">企微管理后台</a>
                  → 我的企业 → 企业信息
                </div>
              </div>
              <CheckOutlined v-if="formState.corpId" class="step-check" />
            </div>

            <div class="step-item" :class="{ completed: currentConfig.agentId && currentConfig.agentSecret }">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">配置自建应用（推荐）</div>
                <div class="step-desc">应用管理 → 自建 → 获取 AgentId 和 Secret</div>
              </div>
              <CheckOutlined v-if="currentConfig.agentId && currentConfig.agentSecret" class="step-check" />
            </div>

            <div class="step-item" :class="{ completed: currentConfig.externalContactSecret }">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">获取客户联系 Secret（可选）</div>
                <div class="step-desc">客户联系 → 客户 → API</div>
              </div>
              <CheckOutlined v-if="currentConfig.externalContactSecret" class="step-check" />
            </div>

            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <div class="step-title">保存并测试</div>
                <div class="step-desc">保存配置后点击测试连接</div>
              </div>
            </div>
          </div>
        </Card>

        <!-- 注意事项 -->
        <Card class="help-card">
          <template #title>
            <div class="help-title">
              <WarningOutlined class="mr-2 text-orange-500" />
              注意事项
            </div>
          </template>

          <div class="notice-list">
            <div class="notice-item">
              <SafetyCertificateOutlined class="notice-icon" />
              <span>Secret 是敏感信息，请妥善保管，切勿泄露</span>
            </div>
            <div class="notice-item">
              <InfoCircleOutlined class="notice-icon" />
              <span>通讯录 Secret 和客户联系 Secret 是<b>两个不同</b>的密钥</span>
            </div>
            <div class="notice-item">
              <EditOutlined class="notice-icon" />
              <span>修改配置后请重新测试连接</span>
            </div>
            <div class="notice-item">
              <ClockCircleOutlined class="notice-icon" />
              <span>首次同步可能需要较长时间，请耐心等待</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  message,
  Card,
  Row,
  Col,
  Form,
  FormItem,
  Input,
  InputPassword,
  InputGroup,
  Button,
  Switch,
  Space,
  Tag,
  Alert,
} from 'ant-design-vue';
import {
  SettingOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  ApiOutlined,
  ReloadOutlined,
  CopyOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  BankOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';

interface WecomConfig {
  corpId: string | null;
  contactSecret: string | null;
  agentId: string | null;
  agentSecret: string | null;
  externalContactSecret: string | null;
  callbackToken: string | null;
  callbackAesKey: string | null;
  isConfigured: boolean;
  isEnabled?: boolean;
}

interface CallbackInfo {
  url: string;
  token: string | null;
  aesKey: string | null;
}

const formState = reactive({
  corpId: '',
  contactSecret: '',
  agentId: '',
  agentSecret: '',
  externalContactSecret: '',
  callbackToken: '',
  callbackAesKey: '',
  isEnabled: true,
});

const currentConfig = ref<WecomConfig>({
  corpId: null,
  contactSecret: null,
  agentId: null,
  agentSecret: null,
  externalContactSecret: null,
  callbackToken: null,
  callbackAesKey: null,
  isConfigured: false,
  isEnabled: false,
});

const callbackInfo = ref<CallbackInfo>({
  url: '',
  token: null,
  aesKey: null,
});

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

const configStatus = computed(() => ({
  isConfigured: currentConfig.value.isConfigured,
  isEnabled: currentConfig.value.isEnabled ?? true,
}));

const generateRandomString = (length: number, charset: string): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const generateToken = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  formState.callbackToken = generateRandomString(32, charset);
  message.success('Token 已生成');
};

const generateAesKey = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  formState.callbackAesKey = generateRandomString(43, charset);
  message.success('AES Key 已生成');
};

const fetchConfig = async () => {
  loading.value = true;
  try {
    const res = await requestClient.get<WecomConfig>('/wecom/config');
    currentConfig.value = res;
    formState.corpId = res.corpId || '';
    formState.agentId = res.agentId || '';
    // Secret字段留空，已配置时placeholder会提示
    formState.contactSecret = '';
    formState.agentSecret = '';
    formState.externalContactSecret = '';
    // 回调配置也留空，但在界面上显示为占位符
    formState.callbackToken = '';
    formState.callbackAesKey = '';
    formState.isEnabled = res.isEnabled ?? true;
  } catch (error: any) {
    message.error(error.message || '获取配置失败');
  } finally {
    loading.value = false;
  }
};

const fetchCallbackUrl = async () => {
  try {
    const res = await requestClient.get<CallbackInfo>('/wecom/callback-url');
    callbackInfo.value = res;
  } catch (error: any) {
    console.error('获取回调地址失败', error);
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const data: Record<string, string | boolean> = {};
    if (formState.corpId) data.corpId = formState.corpId;
    if (formState.contactSecret) data.contactSecret = formState.contactSecret;
    if (formState.agentId) data.agentId = formState.agentId;
    if (formState.agentSecret) data.agentSecret = formState.agentSecret;
    if (formState.externalContactSecret) data.externalContactSecret = formState.externalContactSecret;
    if (formState.callbackToken) data.callbackToken = formState.callbackToken;
    if (formState.callbackAesKey) data.callbackAesKey = formState.callbackAesKey;
    data.isEnabled = formState.isEnabled;

    await requestClient.put('/wecom/config', data);
    message.success('配置保存成功');
    await fetchConfig();
    await fetchCallbackUrl();
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const handleTestConnection = async () => {
  testing.value = true;
  try {
    const res = await requestClient.post<{ success: boolean; message: string }>(
      '/wecom/test-connection'
    );
    if (res.success) {
      message.success(res.message || '连接成功');
    } else {
      message.warning(res.message || '连接失败');
    }
  } catch (error: any) {
    message.error(error.message || '测试失败');
  } finally {
    testing.value = false;
  }
};

const copyCallbackUrl = async () => {
  if (!callbackInfo.value.url) {
    message.warning('暂无回调地址');
    return;
  }
  try {
    await navigator.clipboard.writeText(callbackInfo.value.url);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动复制');
  }
};

onMounted(() => {
  fetchConfig();
  fetchCallbackUrl();
});
</script>

<style scoped>
/* 顶部操作栏 */
.action-bar {
  background: var(--component-background, #fff);
  border: 1px solid var(--border-color, #f0f0f0);
  border-radius: 8px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.action-bar .status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-bar .status-icon {
  font-size: 24px;
}

.action-bar .status-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color, #333);
}

/* 配置卡片 */
.config-card {
  border-radius: 12px;
}

.config-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  padding: 16px 24px;
}

.config-card :deep(.ant-card-body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

/* 表单区块 */
.form-section {
  margin-bottom: 28px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.section-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.section-title .title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color, #333);
  margin-bottom: 2px;
}

.section-title .desc {
  font-size: 13px;
  color: var(--text-color-secondary, #999);
}

.section-content {
  margin-left: 40px;
}

.config-input {
  font-size: 15px;
}

.config-input :deep(.ant-input) {
  padding: 10px 12px;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-secondary, #999);
}

/* 输入框带按钮 */
.input-with-btn {
  display: flex;
}

.input-with-btn .ant-input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-with-btn .ant-btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.readonly-input :deep(.ant-input) {
  background: var(--component-background-light, #fafafa);
  color: var(--text-color-secondary, #666);
}

/* 帮助卡片 */
.help-card {
  border-radius: 12px;
}

.help-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  padding: 12px 20px;
  min-height: auto;
}

.help-card :deep(.ant-card-body) {
  padding: 20px;
}

.help-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

/* 步骤 */
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--component-background-light, #fafafa);
  transition: all 0.3s;
}

.step-item.completed {
  background: #f6ffed;
}

.step-number {
  width: 24px;
  height: 24px;
  background: var(--border-color, #e8e8e8);
  color: var(--text-color-secondary, #999);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-item.completed .step-number {
  background: #52c41a;
  color: #fff;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #333);
  margin-bottom: 2px;
}

.step-desc {
  font-size: 12px;
  color: var(--text-color-secondary, #999);
}

.step-desc a {
  color: #1890ff;
}

.step-check {
  color: #52c41a;
  font-size: 16px;
}

/* 注意事项 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--text-color, #333);
  line-height: 1.5;
}

.notice-icon {
  color: var(--text-color-secondary, #999);
  margin-top: 3px;
  flex-shrink: 0;
}

/* 暗色模式适配 */
:deep(.dark) {
  .action-bar {
    background: #1f1f1f;
    border-color: #303030;
  }

  .step-item {
    background: #262626;
  }

  .step-item.completed {
    background: #162312;
  }
}
</style>
