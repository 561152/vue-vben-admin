<script lang="ts" setup>
import { ref, computed, h } from 'vue';
import {
  Card,
  Input,
  Button,
  Select,
  Row,
  Col,
  Spin,
  Tag,
  Alert,
  Steps,
  Step,
  Divider,
  message,
} from 'ant-design-vue';
import {
  CalculatorOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue';
import { mathCalculate, getMathEngineStatus } from '#/api/ai';
import type { MathCalculateResult } from '#/api/ai';
import MathRenderer from '../chat/components/MathRenderer.vue';

// 状态
const expression = ref('');
const calcType = ref<'equation' | 'simplify' | 'factor' | 'expand' | 'derivative' | 'integral'>('equation');
const variable = ref('x');
const isLoading = ref(false);
const result = ref<MathCalculateResult | null>(null);
const engineStatus = ref<{ algebrite: boolean; sympy: boolean } | null>(null);

// 计算类型选项
const calcTypeOptions = [
  { value: 'equation', label: '方程求解', placeholder: 'x^2-4=0', example: 'x² - 4 = 0' },
  { value: 'simplify', label: '化简', placeholder: '(x+1)*(x-1)', example: '(x+1)(x-1)' },
  { value: 'factor', label: '因式分解', placeholder: 'x^2-9', example: 'x² - 9' },
  { value: 'expand', label: '展开', placeholder: '(x+1)^2', example: '(x+1)²' },
  { value: 'derivative', label: '求导', placeholder: 'x^3+2*x', example: 'x³ + 2x' },
  { value: 'integral', label: '积分', placeholder: 'x^2', example: 'x²' },
];

// 当前选中的类型配置
const currentTypeConfig = computed(() => {
  return calcTypeOptions.find(opt => opt.value === calcType.value) ?? calcTypeOptions[0]!;
});

// 快捷输入符号
const quickSymbols = [
  { label: 'x²', value: 'x^2' },
  { label: 'x³', value: 'x^3' },
  { label: '√', value: 'sqrt(' },
  { label: 'π', value: 'pi' },
  { label: 'e', value: 'e' },
  { label: '=', value: '=' },
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '×', value: '*' },
  { label: '÷', value: '/' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
];

// 获取引擎状态
const fetchEngineStatus = async () => {
  try {
    engineStatus.value = await getMathEngineStatus();
  } catch {
    // 静默失败
  }
};

// 执行计算
const handleCalculate = async () => {
  if (!expression.value.trim()) {
    message.warning('请输入数学表达式');
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    result.value = await mathCalculate({
      expression: expression.value,
      type: calcType.value,
      variable: variable.value,
    });
  } catch (error: any) {
    message.error(error.message || '计算失败');
  } finally {
    isLoading.value = false;
  }
};

// 插入符号
const insertSymbol = (symbol: string) => {
  expression.value += symbol;
};

// 清空
const handleClear = () => {
  expression.value = '';
  result.value = null;
};

// 使用示例
const useExample = () => {
  expression.value = currentTypeConfig.value.placeholder;
};

// 初始化
fetchEngineStatus();
</script>

<template>
  <div class="math-calculator">
    <Row :gutter="24">
      <!-- 左侧：输入区 -->
      <Col :xs="24" :lg="12">
        <Card title="数学计算器" :bordered="false">
          <template #extra>
            <div class="engine-status">
              <Tag v-if="engineStatus?.algebrite" color="green">
                <CheckCircleOutlined /> Algebrite
              </Tag>
              <Tag v-if="engineStatus?.sympy" color="blue">
                <CheckCircleOutlined /> SymPy
              </Tag>
              <Tag v-if="engineStatus && !engineStatus.algebrite && !engineStatus.sympy" color="red">
                <CloseCircleOutlined /> 引擎离线
              </Tag>
            </div>
          </template>

          <!-- 计算类型选择 -->
          <div class="form-item">
            <label>计算类型</label>
            <Select
              v-model:value="calcType"
              :options="calcTypeOptions"
              style="width: 100%"
            />
          </div>

          <!-- 表达式输入 -->
          <div class="form-item">
            <label>
              数学表达式
              <Button type="link" size="small" @click="useExample">
                使用示例
              </Button>
            </label>
            <Input.TextArea
              v-model:value="expression"
              :placeholder="currentTypeConfig.placeholder"
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
            <div class="input-hint">
              示例：{{ currentTypeConfig.example }}
            </div>
          </div>

          <!-- 快捷符号 -->
          <div class="quick-symbols">
            <Button
              v-for="sym in quickSymbols"
              :key="sym.value"
              size="small"
              @click="insertSymbol(sym.value)"
            >
              {{ sym.label }}
            </Button>
          </div>

          <!-- 变量设置（仅微积分） -->
          <div v-if="['derivative', 'integral'].includes(calcType)" class="form-item">
            <label>变量</label>
            <Input v-model:value="variable" style="width: 80px" />
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <Button @click="handleClear">清空</Button>
            <Button
              type="primary"
              :icon="h(CalculatorOutlined)"
              :loading="isLoading"
              @click="handleCalculate"
            >
              计算
            </Button>
          </div>
        </Card>

        <!-- 使用说明 -->
        <Card title="输入说明" :bordered="false" class="tips-card">
          <ul class="tips-list">
            <li><code>x^2</code> 表示 x 的平方</li>
            <li><code>sqrt(x)</code> 表示 √x</li>
            <li><code>*</code> 表示乘法，<code>/</code> 表示除法</li>
            <li><code>pi</code> 表示 π，<code>e</code> 表示自然常数</li>
            <li><code>sin(x)</code>, <code>cos(x)</code>, <code>tan(x)</code> 三角函数</li>
            <li><code>log(x)</code> 自然对数，<code>log10(x)</code> 常用对数</li>
          </ul>
        </Card>
      </Col>

      <!-- 右侧：结果区 -->
      <Col :xs="24" :lg="12">
        <Card title="计算结果" :bordered="false" class="result-card">
          <!-- 加载中 -->
          <div v-if="isLoading" class="loading-state">
            <Spin size="large" />
            <p>正在计算...</p>
          </div>

          <!-- 无结果 -->
          <div v-else-if="!result" class="empty-state">
            <CalculatorOutlined class="empty-icon" />
            <p>输入表达式后点击"计算"查看结果</p>
          </div>

          <!-- 显示结果 -->
          <template v-else>
            <!-- 成功 -->
            <template v-if="result.success">
              <!-- 结果 -->
              <div class="result-section">
                <div class="section-title">
                  <ThunderboltOutlined />
                  <span>结果</span>
                  <Tag :color="result.engine === 'sympy' ? 'blue' : 'green'" size="small">
                    {{ result.engine }}
                  </Tag>
                </div>
                <div class="result-value">
                  <MathRenderer
                    v-if="result.latex"
                    :content="`$$${result.latex}$$`"
                    :display-mode="true"
                  />
                  <template v-else-if="Array.isArray(result.result)">
                    <div v-for="(r, i) in result.result" :key="i" class="result-item">
                      x<sub>{{ i + 1 }}</sub> = {{ r }}
                    </div>
                  </template>
                  <div v-else class="result-item">
                    {{ result.result }}
                  </div>
                </div>
              </div>

              <Divider />

              <!-- 解题步骤 -->
              <div v-if="result.steps && result.steps.length > 0" class="steps-section">
                <div class="section-title">
                  <span>解题步骤</span>
                </div>
                <Steps direction="vertical" size="small" :current="-1">
                  <Step
                    v-for="(step, idx) in result.steps"
                    :key="idx"
                    :title="step.description"
                  >
                    <template #description>
                      <div class="step-content">
                        <MathRenderer
                          v-if="step.latex"
                          :content="`$${step.latex}$`"
                        />
                        <span v-else>{{ step.expression }}</span>
                        <p v-if="step.explanation" class="step-explanation">
                          {{ step.explanation }}
                        </p>
                      </div>
                    </template>
                  </Step>
                </Steps>
              </div>
            </template>

            <!-- 失败 -->
            <Alert
              v-else
              type="error"
              :message="result.error || '计算失败'"
              show-icon
            />
          </template>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.math-calculator {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.quick-symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.engine-status {
  display: flex;
  gap: 8px;
}

.tips-card {
  margin-top: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
}

.tips-list code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.result-card {
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.result-value {
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  font-size: 18px;
}

.result-item {
  padding: 4px 0;
}

.steps-section {
  margin-top: 16px;
}

.step-content {
  padding: 4px 0;
}

.step-explanation {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}
</style>
