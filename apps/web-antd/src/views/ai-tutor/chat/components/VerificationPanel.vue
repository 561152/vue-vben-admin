<script lang="ts" setup>
import { computed } from 'vue';
import {
  Card,
  Tag,
  Collapse,
  CollapsePanel,
  Progress,
  Alert,
  Divider,
  List,
  ListItem,
} from 'ant-design-vue';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
  ExperimentOutlined,
  AimOutlined,
} from '@ant-design/icons-vue';
import MathRenderer from './MathRenderer.vue';

export interface VerificationMethodResult {
  name: 'substitution' | 'alternative_method' | 'reasonableness';
  passed: boolean;
  details: string;
  steps?: string[];
  confidence: number;
}

export interface SubstitutionResult extends VerificationMethodResult {
  name: 'substitution';
  originalEquation: string;
  substitutedExpression: string;
  leftSide: string;
  rightSide: string;
  isEqual: boolean;
  error?: number;
}

export interface AlternativeMethodResult extends VerificationMethodResult {
  name: 'alternative_method';
  methodName: string;
  solutionSteps: string[];
  alternativeResult: string;
  originalResult: string;
  resultsMatch: boolean;
}

export interface ReasonablenessResult extends VerificationMethodResult {
  name: 'reasonableness';
  valueRange: {
    min?: number;
    max?: number;
  };
  unit?: string;
  realWorldContext: string;
  isReasonable: boolean;
  reason: string;
  warnings?: string[];
}

export interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  methods: Array<VerificationMethodResult | SubstitutionResult | AlternativeMethodResult | ReasonablenessResult>;
  summary: string;
  warnings?: string[];
  suggestions?: string[];
}

const props = defineProps<{
  verification: VerificationResult;
  collapsed?: boolean;
}>();

// 验证方法名称映射
const methodNames: Record<string, string> = {
  substitution: '代入验算',
  alternative_method: '多解法验证',
  reasonableness: '合理性检查',
};

// 验证方法图标
const methodIcons: Record<string, any> = {
  substitution: SwapOutlined,
  alternative_method: ExperimentOutlined,
  reasonableness: AimOutlined,
};

// 总体状态颜色
const statusColor = computed(() => {
  if (props.verification.isVerified) return '#52c41a';
  if (props.verification.confidence > 0.5) return '#faad14';
  return '#ff4d4f';
});

// 进度条颜色
const progressColor = computed(() => {
  const conf = props.verification.confidence;
  if (conf >= 0.8) return '#52c41a';
  if (conf >= 0.5) return '#faad14';
  return '#ff4d4f';
});

// 获取方法结果类型
const isSubstitution = (m: any): m is SubstitutionResult => m.name === 'substitution';
const isAlternative = (m: any): m is AlternativeMethodResult => m.name === 'alternative_method';
const isReasonableness = (m: any): m is ReasonablenessResult => m.name === 'reasonableness';
</script>

<template>
  <Card class="verification-panel" size="small">
    <template #title>
      <div class="card-title">
        <SafetyCertificateOutlined />
        <span>三重验证</span>
      </div>
    </template>

    <template #extra>
      <Tag :color="verification.isVerified ? 'success' : 'error'">
        <CheckCircleOutlined v-if="verification.isVerified" />
        <CloseCircleOutlined v-else />
        {{ verification.isVerified ? '验证通过' : '验证未通过' }}
      </Tag>
    </template>

    <!-- 总体置信度 -->
    <div class="confidence-section">
      <div class="confidence-header">
        <span class="label">总体置信度</span>
        <span class="value" :style="{ color: statusColor }">
          {{ Math.round(verification.confidence * 100) }}%
        </span>
      </div>
      <Progress
        :percent="Math.round(verification.confidence * 100)"
        :stroke-color="progressColor"
        :show-info="false"
        size="small"
      />
      <div class="summary">{{ verification.summary }}</div>
    </div>

    <!-- 警告信息 -->
    <Alert
      v-if="verification.warnings && verification.warnings.length > 0"
      type="warning"
      class="warnings-alert"
      show-icon
    >
      <template #message>
        <div class="warning-list">
          <div v-for="(w, i) in verification.warnings" :key="i" class="warning-item">
            {{ w }}
          </div>
        </div>
      </template>
    </Alert>

    <Divider style="margin: 16px 0" />

    <!-- 验证方法详情 -->
    <Collapse :default-active-key="collapsed ? [] : verification.methods.map(m => m.name)" ghost>
      <CollapsePanel
        v-for="method in verification.methods"
        :key="method.name"
        :show-arrow="true"
      >
        <template #header>
          <div class="method-header">
            <component :is="methodIcons[method.name]" class="method-icon" />
            <span class="method-name">{{ methodNames[method.name] }}</span>
            <Tag
              :color="method.passed ? 'success' : 'error'"
              size="small"
              class="method-status"
            >
              {{ method.passed ? '通过' : '未通过' }}
            </Tag>
            <span class="method-confidence">
              置信度 {{ Math.round(method.confidence * 100) }}%
            </span>
          </div>
        </template>

        <div class="method-content">
          <!-- 代入验算详情 -->
          <template v-if="isSubstitution(method)">
            <div class="verification-detail substitution">
              <div class="detail-row">
                <span class="label">原方程：</span>
                <MathRenderer :content="`$${method.originalEquation}$`" />
              </div>
              <div class="detail-row">
                <span class="label">代入后：</span>
                <MathRenderer :content="`$${method.substitutedExpression}$`" />
              </div>
              <div class="comparison">
                <div class="side left">
                  <span class="side-label">左边</span>
                  <MathRenderer :content="`$${method.leftSide}$`" />
                </div>
                <div class="equals" :class="{ match: method.isEqual }">
                  {{ method.isEqual ? '=' : '≠' }}
                </div>
                <div class="side right">
                  <span class="side-label">右边</span>
                  <MathRenderer :content="`$${method.rightSide}$`" />
                </div>
              </div>
              <div v-if="method.error !== undefined" class="error-info">
                误差: {{ method.error.toExponential(2) }}
              </div>
            </div>
          </template>

          <!-- 多解法验证详情 -->
          <template v-else-if="isAlternative(method)">
            <div class="verification-detail alternative">
              <div class="detail-row">
                <span class="label">替代方法：</span>
                <Tag color="blue">{{ method.methodName }}</Tag>
              </div>
              <div class="solution-steps">
                <List size="small" :data-source="method.solutionSteps">
                  <template #renderItem="{ item, index }">
                    <ListItem>
                      <Tag color="default" size="small">{{ index + 1 }}</Tag>
                      {{ item }}
                    </ListItem>
                  </template>
                </List>
              </div>
              <div class="result-comparison">
                <div class="result-item">
                  <span class="result-label">原方法结果：</span>
                  <span class="result-value">{{ method.originalResult }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">替代方法结果：</span>
                  <span class="result-value">{{ method.alternativeResult }}</span>
                </div>
                <Tag :color="method.resultsMatch ? 'success' : 'error'" class="match-tag">
                  {{ method.resultsMatch ? '结果一致' : '结果不一致' }}
                </Tag>
              </div>
            </div>
          </template>

          <!-- 合理性检查详情 -->
          <template v-else-if="isReasonableness(method)">
            <div class="verification-detail reasonableness">
              <div class="detail-row">
                <span class="label">实际场景：</span>
                <span>{{ method.realWorldContext }}</span>
              </div>
              <div v-if="method.valueRange.min !== undefined || method.valueRange.max !== undefined" class="range-info">
                <span class="label">合理范围：</span>
                <span class="range">
                  {{ method.valueRange.min ?? '-∞' }} ~ {{ method.valueRange.max ?? '+∞' }}
                  <span v-if="method.unit" class="unit">{{ method.unit }}</span>
                </span>
              </div>
              <div class="reason">
                <ExclamationCircleOutlined v-if="!method.isReasonable" class="warn-icon" />
                <CheckCircleOutlined v-else class="ok-icon" />
                <span>{{ method.reason }}</span>
              </div>
              <div v-if="method.warnings && method.warnings.length > 0" class="method-warnings">
                <div v-for="(w, i) in method.warnings" :key="i" class="warning-text">
                  {{ w }}
                </div>
              </div>
            </div>
          </template>

          <!-- 通用详情 -->
          <div class="method-details">{{ method.details }}</div>

          <!-- 验证步骤 -->
          <div v-if="method.steps && method.steps.length > 0" class="verification-steps">
            <div class="steps-title">验证步骤：</div>
            <ol>
              <li v-for="(step, i) in method.steps" :key="i">{{ step }}</li>
            </ol>
          </div>
        </div>
      </CollapsePanel>
    </Collapse>

    <!-- 建议 -->
    <div v-if="verification.suggestions && verification.suggestions.length > 0" class="suggestions-section">
      <Divider style="margin: 16px 0" />
      <div class="suggestions-title">
        <BulbOutlined />
        <span>改进建议</span>
      </div>
      <List size="small" :data-source="verification.suggestions">
        <template #renderItem="{ item }">
          <ListItem>
            <CheckCircleOutlined style="color: #1890ff; margin-right: 8px" />
            {{ item }}
          </ListItem>
        </template>
      </List>
    </div>
  </Card>
</template>

<script lang="ts">
import { BulbOutlined } from '@ant-design/icons-vue';
export default {
  components: { BulbOutlined },
};
</script>

<style scoped>
.verification-panel {
  margin-bottom: 16px;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.confidence-section {
  margin-bottom: 16px;
}

.confidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.confidence-header .label {
  font-size: 13px;
  color: #666;
}

.confidence-header .value {
  font-size: 18px;
  font-weight: 600;
}

.summary {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.warnings-alert {
  margin-top: 12px;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-item {
  font-size: 13px;
}

.method-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-icon {
  color: #1890ff;
}

.method-name {
  font-weight: 500;
}

.method-status {
  margin-left: auto;
}

.method-confidence {
  font-size: 12px;
  color: #999;
}

.method-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.verification-detail {
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-row .label {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  margin-top: 12px;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.side-label {
  font-size: 11px;
  color: #999;
}

.equals {
  font-size: 20px;
  font-weight: 600;
  color: #ff4d4f;
}

.equals.match {
  color: #52c41a;
}

.error-info {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

.solution-steps {
  margin: 12px 0;
}

.result-comparison {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  margin-top: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  color: #666;
}

.result-value {
  font-weight: 600;
  color: #1890ff;
}

.match-tag {
  margin-left: auto;
}

.range-info {
  margin: 8px 0;
}

.range {
  font-weight: 500;
  color: #1890ff;
}

.unit {
  color: #666;
  margin-left: 4px;
}

.reason {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  margin-top: 12px;
}

.warn-icon {
  color: #faad14;
}

.ok-icon {
  color: #52c41a;
}

.method-warnings {
  margin-top: 8px;
}

.warning-text {
  font-size: 12px;
  color: #faad14;
  padding: 4px 0;
}

.method-details {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.verification-steps {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
}

.steps-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.verification-steps ol {
  margin: 0;
  padding-left: 20px;
}

.verification-steps li {
  font-size: 13px;
  margin-bottom: 4px;
}

.suggestions-section {
  margin-top: 16px;
}

.suggestions-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 8px;
}
</style>
