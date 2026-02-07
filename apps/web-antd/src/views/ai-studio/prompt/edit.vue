<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ArrowLeftOutlined,
  ExportOutlined,
  EyeOutlined,
  FileTextOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Switch,
  Tag,
  Tabs,
  Typography,
} from 'ant-design-vue';

import {
  createPromptTemplate,
  getPromptCategories,
  getPromptTags,
  getPromptTemplate,
  publishPromptTemplate,
  updatePromptTemplate,
  type CreatePromptTemplateData,
} from '#/api/ai-studio/prompt-template';
import { usePromptEditCache } from '#/composables/useLruCache';

import ExportModal from './components/ExportModal.vue';
import PromptPreview from './components/PromptPreview.vue';
import VariableEditor from './components/VariableEditor.vue';

const router = useRouter();
const route = useRoute();

// ==================== 状态 ====================

const isEdit = computed(() => !!route.params.id);
const promptId = computed(() => route.params.id as string);
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);

// 表单数据
const formData = ref<CreatePromptTemplateData>({
  key: '',
  name: '',
  description: '',
  category: '',
  templateContent: '',
  variables: [],
  defaultValues: {},
  modelConfig: {
    model: 'gpt-4o',
    temperature: 0.7,
    top_p: 1,
    max_tokens: 2048,
  },
  tags: [],
  isActive: false,
});

// 分类和标签选项
const categories = ref<string[]>([]);
const allTags = ref<string[]>([]);

// 模型选项
const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'qwen-vl-max', label: 'Qwen VL Max' },
];

// 当前标签
const inputTag = ref('');

// 表单引用
const formRef = ref();

// LRU 缓存
const {
  set: setCache,
  get: getCache,
  getAll: getAllCached,
} = usePromptEditCache();
const recentPrompts = ref<
  Array<{
    key: string;
    name: string;
    templateContent: string;
    updatedAt: number;
  }>
>([]);

// 导出弹窗
const exportModalVisible = ref(false);

// ==================== 表单规则 ====================

const rules = {
  key: [
    { required: true, message: '请输入标识' },
    { pattern: /^[a-z0-9-]+$/, message: '标识只能包含小写字母、数字和连字符' },
    { min: 3, max: 50, message: '标识长度应为 3-50 个字符' },
  ],
  name: [
    { required: true, message: '请输入名称' },
    { max: 100, message: '名称最多 100 个字符' },
  ],
  templateContent: [{ required: true, message: '请输入提示词内容' }],
};

// ==================== 方法 ====================

/**
 * 返回列表
 */
const goBack = () => {
  router.push('/ai-studio/prompt');
};

/**
 * 加载提示词详情
 */
const loadPromptDetail = async () => {
  if (!isEdit.value) return;

  loading.value = true;
  try {
    const data = await getPromptTemplate(promptId.value);
    formData.value = {
      key: data.key,
      name: data.name,
      description: data.description || '',
      category: data.category || '',
      templateContent: data.templateContent,
      variables: data.variables || [],
      defaultValues: data.defaultValues || {},
      modelConfig: data.modelConfig || {
        model: 'gpt-4o',
        temperature: 0.7,
        top_p: 1,
        max_tokens: 2048,
      },
      tags: data.tags || [],
      isActive: data.isActive,
    };
  } catch (error) {
    message.error('加载提示词详情失败');
    goBack();
  } finally {
    loading.value = false;
  }
};

/**
 * 加载分类和标签
 */
const loadCategoriesAndTags = async () => {
  try {
    const [catRes, tagRes] = await Promise.all([
      getPromptCategories(),
      getPromptTags(),
    ]);
    categories.value = catRes.map((c) => c.value);
    allTags.value = tagRes;
  } catch {
    categories.value = [];
    allTags.value = [];
  }
};

/**
 * 保存草稿
 */
const handleSave = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;

    const data = {
      ...formData.value,
      isActive: false,
    };

    if (isEdit.value) {
      await updatePromptTemplate(promptId.value, data);
    } else {
      await createPromptTemplate(data);
    }

    message.success('保存成功');
    if (!isEdit.value) {
      goBack();
    }
  } catch (error) {
    if (error !== 'validation') {
      message.error('保存失败');
    }
  } finally {
    saving.value = false;
  }
};

/**
 * 发布
 */
const handlePublish = async () => {
  try {
    await formRef.value.validate();
    publishing.value = true;

    // 先保存
    if (isEdit.value) {
      await updatePromptTemplate(promptId.value, formData.value);
    } else {
      const res = await createPromptTemplate(formData.value);
      promptId.value = res.id;
    }

    // 再发布
    await publishPromptTemplate(promptId.value);

    message.success('发布成功');
    goBack();
  } catch (error) {
    if (error !== 'validation') {
      message.error('发布失败');
    }
  } finally {
    publishing.value = false;
  }
};

/**
 * 添加标签
 */
const handleAddTag = () => {
  const tag = inputTag.value.trim();
  if (tag && !formData.value.tags?.includes(tag)) {
    formData.value.tags = [...(formData.value.tags || []), tag];
    inputTag.value = '';
  }
};

/**
 * 删除标签
 */
const handleRemoveTag = (tag: string) => {
  formData.value.tags = formData.value.tags?.filter((t) => t !== tag) || [];
};

/**
 * 变量更新
 */
const handleVariablesChange = (vars: CreatePromptTemplateData['variables']) => {
  formData.value.variables = vars;
};

/**
 * 预览提示词
 */
const handlePreview = () => {
  Modal.info({
    title: '提示词预览',
    width: 800,
    content: (
      <div class="preview-modal-content">
        <pre>{formData.value.templateContent}</pre>
      </div>
    ),
  });
};

/**
 * 保存到本地缓存
 */
const saveToCache = () => {
  const cacheKey = isEdit.value
    ? `edit-${promptId.value}`
    : `new-${Date.now()}`;
  setCache(cacheKey, {
    id: isEdit.value ? promptId.value : undefined,
    name: formData.value.name,
    key: formData.value.key,
    templateContent: formData.value.templateContent,
    variables: formData.value.variables || [],
    modelConfig: formData.value.modelConfig,
    category: formData.value.category,
    tags: formData.value.tags,
    description: formData.value.description,
    updatedAt: Date.now(),
  });
};

/**
 * 从缓存加载最近编辑的提示词
 */
const loadRecentPrompts = () => {
  const cached = getAllCached();
  recentPrompts.value = cached.map((entry) => ({
    key: entry.key,
    name: entry.value.name,
    templateContent: entry.value.templateContent,
    updatedAt: entry.value.updatedAt,
  }));
};

/**
 * 从缓存恢复提示词
 */
const restoreFromCache = (cacheKey: string) => {
  const cached = getCache(cacheKey);
  if (cached) {
    Modal.confirm({
      title: '恢复缓存内容',
      content: `是否从缓存恢复 "${cached.name}" 的编辑内容？`,
      onOk: () => {
        formData.value = {
          ...formData.value,
          key: cached.key,
          name: cached.name,
          description: cached.description || '',
          category: cached.category || '',
          templateContent: cached.templateContent,
          variables: cached.variables || [],
          modelConfig: cached.modelConfig || formData.value.modelConfig,
          tags: cached.tags || [],
        };
        message.success('已从缓存恢复');
      },
    });
  }
};

/**
 * 打开导出弹窗
 */
const openExportModal = () => {
  exportModalVisible.value = true;
};

/**
 * 快速导出 JSON
 */
const quickExportJson = () => {
  import('#/utils/prompt-export').then(({ exportAsJson, downloadFile }) => {
    const content = exportAsJson(formData.value);
    const filename = `${formData.value.key || 'prompt'}.json`;
    downloadFile(content, filename, 'application/json');
    message.success('导出成功');
  });
};

// ==================== 生命周期 ====================

onMounted(() => {
  loadPromptDetail();
  loadCategoriesAndTags();
  loadRecentPrompts();
});

// 自动保存到缓存（每30秒）
let cacheInterval: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  cacheInterval = setInterval(() => {
    if (formData.value.name && formData.value.templateContent) {
      saveToCache();
    }
  }, 30000);
});

// 清理定时器
onUnmounted(() => {
  if (cacheInterval) {
    clearInterval(cacheInterval);
  }
});
</script>

<template>
  <Spin :spinning="loading" tip="加载中...">
    <div class="prompt-edit">
      <!-- 头部 -->
      <div class="edit-header">
        <Breadcrumb class="mb-2">
          <Breadcrumb.Item @click="goBack">
            <a><ArrowLeftOutlined /> 返回列表</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {{ isEdit ? '编辑提示词' : '新建提示词' }}
          </Breadcrumb.Item>
        </Breadcrumb>

        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title :level="4" class="!mb-0">
              <Space>
                <FileTextOutlined />
                {{ isEdit ? '编辑提示词' : '新建提示词' }}
              </Space>
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <Dropdown>
                <Button>
                  <ExportOutlined />
                  导出
                </Button>
                <template #overlay>
                  <Menu>
                    <Menu.Item key="export-modal" @click="openExportModal">
                      <ExportOutlined />
                      导出选项...
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="quick-json" @click="quickExportJson">
                      导出为 JSON
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <Button @click="handlePreview">
                <EyeOutlined />
                预览
              </Button>
              <Button :loading="saving" @click="handleSave">
                <SaveOutlined />
                保存草稿
              </Button>
              <Button
                type="primary"
                :loading="publishing"
                @click="handlePublish"
              >
                <SendOutlined />
                发布
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <!-- 最近编辑缓存 -->
      <Card
        v-if="recentPrompts.length > 0 && !isEdit"
        size="small"
        title="最近编辑的提示词"
        class="mb-4"
      >
        <Space wrap>
          <Tag
            v-for="prompt in recentPrompts"
            :key="prompt.key"
            color="blue"
            style="cursor: pointer"
            @click="restoreFromCache(prompt.key)"
          >
            {{ prompt.name }}
            <span style="font-size: 11px; opacity: 0.7; margin-left: 4px">
              {{ new Date(prompt.updatedAt).toLocaleDateString() }}
            </span>
          </Tag>
        </Space>
      </Card>

      <!-- 表单内容 -->
      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="edit-form"
      >
        <Tabs type="card">
          <!-- 基础信息 -->
          <Tabs.TabPane key="basic" tab="基础信息">
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item label="名称" name="name">
                  <Input
                    v-model:value="formData.name"
                    placeholder="请输入提示词名称"
                    show-count
                    :maxlength="100"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="标识" name="key">
                  <Input
                    v-model:value="formData.key"
                    placeholder="prompt-key-example"
                    :disabled="isEdit"
                  />
                  <template #help>
                    唯一标识，创建后不可修改，用于 API 调用
                  </template>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="描述" name="description">
              <Input.TextArea
                v-model:value="formData.description"
                :rows="2"
                placeholder="请输入提示词描述"
              />
            </Form.Item>

            <Row :gutter="24">
              <Col :span="12">
                <Form.Item label="分类" name="category">
                  <Select
                    v-model:value="formData.category"
                    placeholder="选择或输入分类"
                    allow-clear
                    show-search
                  >
                    <Select.Option
                      v-for="cat in categories"
                      :key="cat"
                      :value="cat"
                    >
                      {{ cat }}
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="标签" name="tags">
                  <Space wrap>
                    <Tag
                      v-for="tag in formData.tags"
                      :key="tag"
                      closable
                      @close="handleRemoveTag(tag)"
                    >
                      {{ tag }}
                    </Tag>
                    <Input
                      v-if="inputTag || formData.tags?.length === 0"
                      v-model:value="inputTag"
                      size="small"
                      style="width: 120px"
                      placeholder="输入标签"
                      @blur="handleAddTag"
                      @press-enter="handleAddTag"
                    />
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Tabs.TabPane>

          <!-- 提示词内容 -->
          <Tabs.TabPane key="content" tab="提示词内容">
            <Alert
              type="info"
              message="提示"
              description="使用 {{variableName}} 语法定义变量，系统将自动提取变量并生成输入表单"
              show-icon
              class="mb-4"
            />

            <Form.Item name="templateContent">
              <Input.TextArea
                v-model:value="formData.templateContent"
                :rows="20"
                placeholder="请输入提示词内容..."
                class="prompt-editor"
              />
            </Form.Item>
          </Tabs.TabPane>

          <!-- 变量定义 -->
          <Tabs.TabPane key="variables" tab="变量定义">
            <VariableEditor
              v-model="formData.variables"
              :template="formData.templateContent"
              auto-extract
              @change="handleVariablesChange"
            />
          </Tabs.TabPane>

          <!-- 模型参数 -->
          <Tabs.TabPane key="model" tab="模型参数">
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item label="默认模型">
                  <Select v-model:value="formData.modelConfig!.model">
                    <Select.Option
                      v-for="model in modelOptions"
                      :key="model.value"
                      :value="model.value"
                    >
                      {{ model.label }}
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="最大 Token">
                  <InputNumber
                    v-model:value="formData.modelConfig!.max_tokens"
                    :min="100"
                    :max="4096"
                    :step="100"
                    style="width: 100%"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Temperature (创造性)">
              <Slider
                v-model:value="formData.modelConfig!.temperature"
                :min="0"
                :max="2"
                :step="0.1"
              />
              <template #help>
                值越低越保守，值越高越有创造性 (当前:
                {{ formData.modelConfig!.temperature }})
              </template>
            </Form.Item>

            <Form.Item label="Top P (多样性)">
              <Slider
                v-model:value="formData.modelConfig!.top_p"
                :min="0"
                :max="1"
                :step="0.1"
              />
              <template #help>
                控制输出的多样性，1.0 表示最大多样性 (当前:
                {{ formData.modelConfig!.top_p }})
              </template>
            </Form.Item>
          </Tabs.TabPane>

          <!-- 实时预览 -->
          <Tabs.TabPane key="preview" tab="实时预览">
            <PromptPreview
              :template="formData.templateContent"
              :variables="formData.variables || []"
              :model-config="formData.modelConfig"
            />
          </Tabs.TabPane>
        </Tabs>
      </Form>

      <!-- 导出弹窗 -->
      <ExportModal v-model:visible="exportModalVisible" :template="formData" />
    </div>
  </Spin>
</template>

<style lang="less" scoped>
.prompt-edit {
  padding: 24px;

  .edit-header {
    margin-bottom: 24px;
  }

  .edit-form {
    .prompt-editor {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
    }
  }
}

.preview-modal-content {
  max-height: 500px;
  overflow: auto;

  pre {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
