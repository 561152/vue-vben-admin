<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  CheckCircleOutlined,
  DisconnectOutlined,
  LinkOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'ant-design-vue';

interface VariableMapping {
  sourceVar: string; // 上游步骤输出变量
  targetVar: string; // Prompt 模板变量
  transform?: string; // 可选的转换函数
}

interface SourceVariable {
  name: string;
  type: string;
  description?: string;
  sourceStep?: string;
}

interface TargetVariable {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

interface Props {
  // 上游步骤可用变量
  sourceVariables: SourceVariable[];
  // Prompt 模板需要变量
  targetVariables: TargetVariable[];
  // 初始映射值
  modelValue: Record<string, string>;
  // 是否显示类型检查
  showTypeCheck?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
  (e: 'change', value: Record<string, string>): void;
}>();

// ==================== 状态 ====================

const mappings = ref<Record<string, string>>({});
const autoMapEnabled = ref(true);

// ==================== 计算属性 ====================

// 当前映射关系
const currentMappings = computed({
  get: () => props.modelValue || mappings.value,
  set: (val) => {
    mappings.value = val;
    emit('update:modelValue', val);
    emit('change', val);
  },
});

// 自动映射建议
const suggestions = computed(() => {
  const result: Record<string, string> = {};

  for (const target of props.targetVariables) {
    // 1. 精确匹配
    const exact = props.sourceVariables.find(
      (s) => s.name.toLowerCase() === target.name.toLowerCase(),
    );
    if (exact) {
      result[target.name] = exact.name;
      continue;
    }

    // 2. 模糊匹配（如 studentName → name）
    const fuzzy = props.sourceVariables.find(
      (s) =>
        s.name.toLowerCase().includes(target.name.toLowerCase()) ||
        target.name.toLowerCase().includes(s.name.toLowerCase()),
    );
    if (fuzzy) {
      result[target.name] = fuzzy.name;
    }
  }

  return result;
});

// 类型兼容性检查
const compatibilityWarnings = computed(() => {
  const warnings: Array<{
    target: string;
    source: string;
    message: string;
    severity: 'error' | 'warning';
  }> = [];

  for (const [targetName, sourceName] of Object.entries(currentMappings.value)) {
    const target = props.targetVariables.find((v) => v.name === targetName);
    const source = props.sourceVariables.find((v) => v.name === sourceName);

    if (!target || !source || props.showTypeCheck === false) continue;
    if (target.type === source.type) continue;

    // 检查类型兼容性
    const checkResult = checkTypeCompatibility(source.type, target.type);

    if (!checkResult.compatible) {
      warnings.push({
        target: targetName,
        source: sourceName,
        message: `类型不兼容: ${source.type} → ${target.type}。${checkResult.reason}`,
        severity: 'error',
      });
    } else if (checkResult.warning) {
      warnings.push({
        target: targetName,
        source: sourceName,
        message: `类型警告: ${source.type} → ${target.type}。${checkResult.reason}`,
        severity: 'warning',
      });
    }
  }

  return warnings;
});

/**
 * 检查类型兼容性
 */
const checkTypeCompatibility = (
  sourceType: string,
  targetType: string,
): { compatible: boolean; warning?: boolean; reason: string } => {
  // 完全匹配
  if (sourceType === targetType) {
    return { compatible: true, reason: '类型匹配' };
  }

  // 安全转换
  const safeConversions: Record<string, string[]> = {
    number: ['string', 'text'],
    string: ['text', 'json'],
    boolean: ['string', 'text'],
    json: ['string', 'text'],
  };

  // 不安全转换
  const unsafeConversions: Record<string, string[]> = {
    string: ['number', 'boolean'],
    text: ['number', 'boolean', 'json'],
    number: ['boolean', 'json'],
    boolean: ['number', 'json'],
    json: ['number', 'boolean'],
    'image_url': ['string', 'text', 'number', 'boolean', 'json'],
  };

  if (safeConversions[sourceType]?.includes(targetType)) {
    return {
      compatible: true,
      warning: true,
      reason: '可以自动转换，但可能丢失格式信息',
    };
  }

  if (unsafeConversions[sourceType]?.includes(targetType)) {
    return {
      compatible: false,
      reason: '无法安全转换，运行时可能出错',
    };
  }

  return {
    compatible: true,
    warning: true,
    reason: '未知类型组合，请谨慎使用',
  };
};

// 未映射的必需变量
const unmappedRequired = computed(() => {
  return props.targetVariables.filter(
    (v) => v.required && !currentMappings.value[v.name],
  );
});

// 映射统计
const mappingStats = computed(() => {
  const total = props.targetVariables.length;
  const mapped = Object.keys(currentMappings.value).length;
  const required = props.targetVariables.filter((v) => v.required).length;
  const requiredMapped = props.targetVariables.filter(
    (v) => v.required && currentMappings.value[v.name],
  ).length;

  return { total, mapped, required, requiredMapped };
});

// 映射状态
const mappingStatus = computed(() => {
  if (unmappedRequired.value.length > 0) return 'error';
  if (compatibilityWarnings.value.length > 0) return 'warning';
  if (mappingStats.value.mapped > 0) return 'success';
  return 'default';
});

// ==================== 方法 ====================

/**
 * 应用自动映射
 */
const applyAutoMap = () => {
  currentMappings.value = { ...currentMappings.value, ...suggestions.value };
};

/**
 * 清除映射
 */
const clearMapping = (targetVar: string) => {
  const newMappings = { ...currentMappings.value };
  delete newMappings[targetVar];
  currentMappings.value = newMappings;
};

/**
 * 清除全部映射
 */
const clearAllMappings = () => {
  currentMappings.value = {};
};

/**
 * 获取源变量选项
 */
const getSourceVarOptions = (targetVar: TargetVariable) => {
  return props.sourceVariables.map((sv) => {
    const isTypeMatch = sv.type === targetVar.type;
    return {
      value: sv.name,
      label: sv.name,
      source: sv,
      isTypeMatch,
    };
  });
};

// ==================== 监听 ====================

// 自动应用映射建议
watch(
  () => [props.targetVariables, props.sourceVariables],
  () => {
    if (autoMapEnabled.value && Object.keys(currentMappings.value).length === 0) {
      applyAutoMap();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="variable-mapper">
    <!-- 头部信息 -->
    <div class="mapper-header">
      <Space>
        <Badge
          :status="
            mappingStatus === 'error'
              ? 'error'
              : mappingStatus === 'warning'
                ? 'warning'
                : mappingStatus === 'success'
                  ? 'success'
                  : 'default'
          "
        />
        <Typography.Text
          :type="
            mappingStatus === 'error'
              ? 'danger'
              : mappingStatus === 'warning'
                ? 'warning'
                : undefined
          "
        >
          变量映射
          <Typography.Text type="secondary">
            ({{ mappingStats.mapped }}/{{ mappingStats.total }}，必需
            {{ mappingStats.requiredMapped }}/{{ mappingStats.required }})
          </Typography.Text>
        </Typography.Text>
      </Space>

      <Space>
        <Switch
          v-model:checked="autoMapEnabled"
          size="small"
          checked-children="自动"
          un-checked-children="手动"
        />
        <Button type="primary" size="small" @click="applyAutoMap">
          <LinkOutlined />
          自动映射
          <Tag
            v-if="Object.keys(suggestions).length > 0"
            color="blue"
            size="small"
          >
            {{ Object.keys(suggestions).length }}
          </Tag>
        </Button>
        <Button size="small" @click="clearAllMappings">
          <DisconnectOutlined />
          清除全部
        </Button>
      </Space>
    </div>

    <!-- 警告提示 -->
    <Alert
      v-if="unmappedRequired.length > 0"
      type="error"
      :message="`有 ${unmappedRequired.length} 个必需变量未映射`"
      class="mb-3"
      show-icon
    >
      <template #description>
        <Space wrap>
          <Tag
            v-for="v in unmappedRequired"
            :key="v.name"
            color="error"
            size="small"
          >
            {{ v.name }}
          </Tag>
        </Space>
      </template>
    </Alert>

    <Alert
      v-for="warning in compatibilityWarnings"
      :key="warning.target"
      :type="warning.severity"
      :message="warning.message"
      class="mb-2"
      show-icon
    />

    <Alert
      v-if="
        mappingStats.mapped === mappingStats.total &&
        compatibilityWarnings.length === 0
      "
      type="success"
      message="所有变量已映射"
      class="mb-3"
      show-icon
    />

    <!-- 映射列表 -->
    <div v-if="targetVariables.length > 0" class="mapping-list">
      <Card
        v-for="target in targetVariables"
        :key="target.name"
        size="small"
        :class="{
          'mapping-row': true,
          'is-required': target.required,
          'is-mapped': currentMappings[target.name],
          'has-warning': compatibilityWarnings.some(
            (w) => w.target === target.name && w.severity === 'warning',
          ),
          'has-error': compatibilityWarnings.some(
            (w) => w.target === target.name && w.severity === 'error',
          ),
        }"
      >
        <div class="mapping-content">
          <!-- 目标变量 (Prompt) -->
          <div class="target-var">
            <Space>
              <Typography.Text strong>
                {{ target.name }}
                <span v-if="target.required" class="required-mark">*</span>
              </Typography.Text>
              <Tag
                size="small"
                :color="target.type === 'string' ? 'blue' : 'green'"
              >
                {{ target.type }}
              </Tag>
            </Space>
            <Typography.Text
              v-if="target.description"
              type="secondary"
              class="block text-xs"
            >
              {{ target.description }}
            </Typography.Text>
          </div>

          <!-- 箭头 -->
          <div class="arrow">
            <Tooltip
              v-if="currentMappings[target.name]"
              :title="`映射到: ${currentMappings[target.name]}`"
            >
              <LinkOutlined class="text-green-500" />
            </Tooltip>
            <DisconnectOutlined v-else class="text-gray-300" />
          </div>

          <!-- 源变量选择 (上游步骤) -->
          <div class="source-var">
            <Select
              :value="currentMappings[target.name]"
              placeholder="选择变量"
              style="width: 200px"
              allow-clear
              @change="
                (val) => {
                  if (val) currentMappings[target.name] = val;
                  else clearMapping(target.name);
                }
              "
            >
              <Select.Option
                v-for="option in getSourceVarOptions(target)"
                :key="option.value"
                :value="option.value"
              >
                <Space>
                  <span>{{ option.label }}</span>
                  <Tag
                    size="small"
                    :color="option.isTypeMatch ? 'green' : 'orange'"
                  >
                    {{ option.source.type }}
                  </Tag>
                  <Typography.Text
                    v-if="option.source.sourceStep"
                    type="secondary"
                    class="text-xs"
                  >
                    来自 {{ option.source.sourceStep }}
                  </Typography.Text>
                </Space>
              </Select.Option>
            </Select>
          </div>

          <!-- 映射状态 -->
          <div class="mapping-status">
            <CheckCircleOutlined
              v-if="currentMappings[target.name]"
              class="text-green-500"
            />
            <Tooltip v-else-if="target.required" title="必需变量">
              <WarningOutlined class="text-red-500" />
            </Tooltip>
            <span v-else class="text-gray-300">-</span>
          </div>
        </div>
      </Card>
    </div>

    <Empty v-else description="暂无需要映射的变量" />
  </div>
</template>

<style lang="less" scoped>
.variable-mapper {
  .mapper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .mapping-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mapping-row {
    transition: all 0.3s;

    &.is-mapped {
      border-color: #b7eb8f;
      background: #f6ffed;
    }

    &.has-warning {
      border-color: #ffe58f;
      background: #fffbe6;
    }

    &.has-error {
      border-color: #ff4d4f;
      background: #fff2f0;
    }

    &.is-required .required-mark {
      color: #ff4d4f;
      margin-left: 4px;
    }

    :deep(.ant-card-body) {
      padding: 12px;
    }
  }

  .mapping-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .target-var {
    width: 180px;
    flex-shrink: 0;
  }

  .arrow {
    width: 32px;
    text-align: center;
    font-size: 16px;
  }

  .source-var {
    flex: 1;
  }

  .mapping-status {
    width: 32px;
    text-align: center;
    font-size: 16px;
  }

  .text-xs {
    font-size: 12px;
  }

  .block {
    display: block;
  }
}
</style>
