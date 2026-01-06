<script lang="ts" setup>
import { ref, computed } from 'vue';
import {
  Card,
  Upload,
  Button,
  Radio,
  Switch,
  Spin,
  Alert,
  Descriptions,
  DescriptionsItem,
  Tag,
  Divider,
  Progress,
  message,
} from 'ant-design-vue';
import {
  CameraOutlined,
  ScanOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons-vue';
import type { UploadFile } from 'ant-design-vue';
import {
  recognizeQuestion,
  recognizeFormula,
  getOcrCacheStats,
} from '#/api/ai';
import type {
  RecognizeQuestionResponse,
  FormulaOcrResponse,
  OcrCacheStats,
} from '#/api/ai';
import MathRenderer from '../chat/components/MathRenderer.vue';

// 状态
const recognizeType = ref<'question' | 'formula'>('question');
const searchLibrary = ref(true);
const generateSolution = ref(true);
const isLoading = ref(false);
const fileList = ref<UploadFile[]>([]);
const previewUrl = ref<string>('');
const result = ref<RecognizeQuestionResponse | FormulaOcrResponse | null>(null);
const cacheStats = ref<OcrCacheStats | null>(null);

// 是否为题目识别结果
const isQuestionResult = computed(() => {
  return (
    recognizeType.value === 'question' &&
    result.value &&
    'solution' in result.value
  );
});

// 处理文件选择
const handleFileChange = (info: {
  file: UploadFile;
  fileList: UploadFile[];
}) => {
  fileList.value = info.fileList.slice(-1); // 只保留最后一个文件

  if (info.file.originFileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(info.file.originFileObj);
  }

  result.value = null;
};

// 执行识别
const handleRecognize = async () => {
  if (fileList.value.length === 0 || !fileList.value[0]?.originFileObj) {
    message.warning('请先上传图片');
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    const formData = new FormData();
    formData.append('image', fileList.value[0].originFileObj);

    if (recognizeType.value === 'question') {
      formData.append('searchLibrary', String(searchLibrary.value));
      formData.append('generateSolution', String(generateSolution.value));
      result.value = await recognizeQuestion(formData);
    } else {
      result.value = await recognizeFormula(formData);
    }

    message.success('识别成功');
  } catch (error: any) {
    message.error(error.message || '识别失败');
  } finally {
    isLoading.value = false;
  }
};

// 加载缓存统计
const loadCacheStats = async () => {
  try {
    cacheStats.value = await getOcrCacheStats();
  } catch {
    // 忽略错误
  }
};

// 清空
const handleClear = () => {
  fileList.value = [];
  previewUrl.value = '';
  result.value = null;
};

// 初始化
loadCacheStats();
</script>

<template>
  <div class="ocr-page">
    <div class="page-header">
      <h2><ScanOutlined /> 智能题目识别</h2>
      <p>上传题目或公式图片，AI自动识别并解答</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：上传区 -->
      <div class="upload-section">
        <Card title="图片上传" :bordered="false">
          <!-- 识别类型选择 -->
          <div class="form-item">
            <label>识别类型</label>
            <Radio.Group v-model:value="recognizeType">
              <Radio.Button value="question">
                <CameraOutlined /> 题目识别
              </Radio.Button>
              <Radio.Button value="formula">
                <ScanOutlined /> 公式识别
              </Radio.Button>
            </Radio.Group>
          </div>

          <!-- 题目识别选项 -->
          <div v-if="recognizeType === 'question'" class="options-section">
            <div class="option-item">
              <span>题库匹配</span>
              <Switch v-model:checked="searchLibrary" />
            </div>
            <div class="option-item">
              <span>生成解答</span>
              <Switch v-model:checked="generateSolution" />
            </div>
          </div>

          <!-- 上传组件 -->
          <div class="upload-area">
            <Upload.Dragger
              v-model:file-list="fileList"
              :before-upload="() => false"
              accept="image/*"
              :max-count="1"
              @change="handleFileChange"
            >
              <div v-if="previewUrl" class="preview-image">
                <img :src="previewUrl" alt="预览" />
              </div>
              <div v-else class="upload-placeholder">
                <p class="ant-upload-drag-icon">
                  <UploadOutlined style="font-size: 48px; color: #1890ff" />
                </p>
                <p class="ant-upload-text">点击或拖拽图片到此处</p>
                <p class="ant-upload-hint">支持 JPG、PNG 格式</p>
              </div>
            </Upload.Dragger>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <Button @click="handleClear">清空</Button>
            <Button
              type="primary"
              :icon="ScanOutlined"
              :loading="isLoading"
              @click="handleRecognize"
            >
              开始识别
            </Button>
          </div>
        </Card>

        <!-- 缓存统计 -->
        <Card
          v-if="cacheStats"
          title="缓存统计"
          :bordered="false"
          class="stats-card"
        >
          <Descriptions :column="2" size="small">
            <DescriptionsItem label="缓存总数">
              <Tag color="blue">{{ cacheStats.totalCount }}</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="访问次数">
              <Tag color="green">{{ cacheStats.totalAccessCount }}</Tag>
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-section">
        <Card title="识别结果" :bordered="false" class="result-card">
          <!-- 加载中 -->
          <div v-if="isLoading" class="loading-state">
            <Spin size="large" />
            <p>正在识别...</p>
          </div>

          <!-- 无结果 -->
          <div v-else-if="!result" class="empty-state">
            <ScanOutlined class="empty-icon" />
            <p>上传图片后点击"开始识别"</p>
          </div>

          <!-- 显示结果 -->
          <template v-else>
            <!-- 基础信息 -->
            <div class="result-meta">
              <Tag :color="result.cached ? 'green' : 'blue'">
                <DatabaseOutlined />
                {{ result.cached ? '命中缓存' : '新识别' }}
              </Tag>
              <Tag>置信度: {{ (result.confidence * 100).toFixed(1) }}%</Tag>
            </div>

            <Divider />

            <!-- 公式识别结果 -->
            <template v-if="recognizeType === 'formula'">
              <div class="result-block">
                <h4>LaTeX 公式</h4>
                <div class="latex-display">
                  <MathRenderer
                    :content="`$$${(result as FormulaOcrResponse).latex}$$`"
                    :display-mode="true"
                  />
                </div>
                <div class="latex-code">
                  <code>{{ (result as FormulaOcrResponse).latex }}</code>
                </div>
              </div>
            </template>

            <!-- 题目识别结果 -->
            <template v-else>
              <div class="result-block">
                <h4>识别文本</h4>
                <div class="text-content">
                  {{ (result as RecognizeQuestionResponse).text }}
                </div>
                <div
                  v-if="(result as RecognizeQuestionResponse).latex"
                  class="latex-display"
                >
                  <MathRenderer
                    :content="`$$${(result as RecognizeQuestionResponse).latex}$$`"
                    :display-mode="true"
                  />
                </div>
              </div>

              <!-- 题库匹配结果 -->
              <div
                v-if="(result as RecognizeQuestionResponse).libraryMatch"
                class="result-block library-match"
              >
                <h4>
                  <CheckCircleOutlined style="color: #52c41a" />
                  题库匹配成功
                </h4>
                <Descriptions :column="1" size="small" bordered>
                  <DescriptionsItem label="相似度">
                    <Progress
                      :percent="
                        (result as RecognizeQuestionResponse).libraryMatch!
                          .similarity * 100
                      "
                      :stroke-color="{ '0%': '#108ee9', '100%': '#87d068' }"
                      size="small"
                    />
                  </DescriptionsItem>
                  <DescriptionsItem label="标准答案">
                    {{
                      (result as RecognizeQuestionResponse).libraryMatch!.answer
                    }}
                  </DescriptionsItem>
                </Descriptions>
              </div>

              <!-- AI解答 -->
              <div
                v-if="(result as RecognizeQuestionResponse).solution"
                class="result-block solution"
              >
                <h4>AI 解答</h4>
                <div class="answer-box">
                  <strong>答案：</strong>
                  {{ (result as RecognizeQuestionResponse).solution!.answer }}
                </div>

                <div
                  v-if="
                    (result as RecognizeQuestionResponse).solution!.steps
                      ?.length
                  "
                  class="steps-list"
                >
                  <h5>解题步骤：</h5>
                  <ol>
                    <li
                      v-for="step in (result as RecognizeQuestionResponse)
                        .solution!.steps"
                      :key="step.step"
                    >
                      <span>{{ step.description }}</span>
                      <div v-if="step.latex" class="step-latex">
                        <MathRenderer :content="`$${step.latex}$`" />
                      </div>
                    </li>
                  </ol>
                </div>

                <div
                  v-if="
                    (result as RecognizeQuestionResponse).solution!.explanation
                  "
                  class="explanation"
                >
                  <h5>解析：</h5>
                  <p>
                    {{
                      (result as RecognizeQuestionResponse).solution!
                        .explanation
                    }}
                  </p>
                </div>
              </div>
            </template>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ocr-page {
  padding: 16px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.options-section {
  display: flex;
  gap: 24px;
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-area {
  margin-bottom: 16px;
}

.preview-image {
  padding: 16px;
}

.preview-image img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.upload-placeholder {
  padding: 40px 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.stats-card {
  margin-top: 16px;
}

.result-card {
  min-height: 500px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #999;
}

.empty-icon {
  margin-bottom: 16px;
  font-size: 64px;
}

.result-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.result-block {
  margin-bottom: 24px;
}

.result-block h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #333;
}

.result-block h5 {
  margin: 12px 0 8px;
  font-size: 14px;
  color: #666;
}

.text-content {
  padding: 16px;
  line-height: 1.8;
  background: #f5f5f5;
  border-radius: 8px;
}

.latex-display {
  padding: 16px;
  margin-top: 12px;
  text-align: center;
  background: #f6ffed;
  border-radius: 8px;
}

.latex-code {
  padding: 8px 12px;
  margin-top: 8px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 12px;
  background: #f0f0f0;
  border-radius: 4px;
}

.library-match {
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.solution {
  padding: 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
}

.answer-box {
  padding: 12px;
  font-size: 16px;
  background: white;
  border-radius: 4px;
}

.steps-list ol {
  padding-left: 20px;
  margin: 0;
}

.steps-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.step-latex {
  padding: 8px;
  margin-top: 4px;
  background: white;
  border-radius: 4px;
}

.explanation {
  padding: 12px;
  background: white;
  border-radius: 4px;
}

.explanation p {
  margin: 0;
  line-height: 1.8;
}
</style>
