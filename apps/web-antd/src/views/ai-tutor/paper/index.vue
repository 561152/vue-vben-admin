<script lang="ts" setup>
import { ref } from 'vue';
import {
  Card,
  Upload,
  Button,
  Spin,
  Descriptions,
  DescriptionsItem,
  Tag,
  Divider,
  Table,
  Badge,
  Modal,
  message,
} from 'ant-design-vue';
import {
  FileTextOutlined,
  UploadOutlined,
  ImportOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import type { UploadFile, TableColumnsType } from 'ant-design-vue';
import { analyzePaper, importQuestions } from '#/api/ai';
import type { PaperAnalysisResponse, ParsedQuestion, ImportQuestionsResponse } from '#/api/ai';

// 状态
const isAnalyzing = ref(false);
const isImporting = ref(false);
const fileList = ref<UploadFile[]>([]);
const previewUrl = ref<string>('');
const analysisResult = ref<PaperAnalysisResponse | null>(null);
const importResult = ref<ImportQuestionsResponse | null>(null);
const selectedRowKeys = ref<number[]>([]);

// 预览弹窗
const previewVisible = ref(false);
const previewQuestion = ref<ParsedQuestion | null>(null);

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '题号',
    dataIndex: 'index',
    width: 60,
    align: 'center',
  },
  {
    title: '题型',
    dataIndex: 'type',
    width: 100,
  },
  {
    title: '题目内容',
    dataIndex: 'content',
    ellipsis: true,
  },
  {
    title: '分值',
    dataIndex: 'score',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center',
  },
];

// 处理文件选择
const handleFileChange = (info: { file: UploadFile; fileList: UploadFile[] }) => {
  fileList.value = info.fileList.slice(-1);

  if (info.file.originFileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(info.file.originFileObj);
  }

  analysisResult.value = null;
  importResult.value = null;
  selectedRowKeys.value = [];
};

// 执行分析
const handleAnalyze = async () => {
  if (fileList.value.length === 0 || !fileList.value[0]?.originFileObj) {
    message.warning('请先上传试卷图片');
    return;
  }

  isAnalyzing.value = true;
  analysisResult.value = null;
  importResult.value = null;

  try {
    const formData = new FormData();
    formData.append('image', fileList.value[0].originFileObj);

    analysisResult.value = await analyzePaper(formData);
    // 默认全选
    selectedRowKeys.value = analysisResult.value.questions.map((q) => q.index);
    message.success('分析完成');
  } catch (error: any) {
    message.error(error.message || '分析失败');
  } finally {
    isAnalyzing.value = false;
  }
};

// 导入题目
const handleImport = async () => {
  if (!analysisResult.value || selectedRowKeys.value.length === 0) {
    message.warning('请先选择要导入的题目');
    return;
  }

  isImporting.value = true;

  try {
    const formData = new FormData();
    formData.append('image', fileList.value[0]!.originFileObj!);
    formData.append('questionIndexes', JSON.stringify(selectedRowKeys.value));

    importResult.value = await importQuestions(formData);
    message.success(`成功导入 ${importResult.value.imported} 道题目`);
  } catch (error: any) {
    message.error(error.message || '导入失败');
  } finally {
    isImporting.value = false;
  }
};

// 预览题目
const handlePreview = (record: ParsedQuestion) => {
  previewQuestion.value = record;
  previewVisible.value = true;
};

// 清空
const handleClear = () => {
  fileList.value = [];
  previewUrl.value = '';
  analysisResult.value = null;
  importResult.value = null;
  selectedRowKeys.value = [];
};

// 获取题型标签颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '选择题': 'blue',
    '填空题': 'green',
    '判断题': 'orange',
    '计算题': 'purple',
    '解答题': 'cyan',
    '应用题': 'magenta',
  };
  return colorMap[type] || 'default';
};

// 获取导入状态
const getImportStatus = (index: number) => {
  if (!importResult.value) return null;
  return importResult.value.details.find((d) => d.index === index);
};
</script>

<template>
  <div class="paper-page">
    <div class="page-header">
      <h2><FileTextOutlined /> 试卷分析与入库</h2>
      <p>上传试卷图片，自动识别题目并导入题库</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：上传区 -->
      <div class="upload-section">
        <Card title="上传试卷" :bordered="false">
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
                  <FileTextOutlined style="font-size: 48px; color: #1890ff" />
                </p>
                <p class="ant-upload-text">点击或拖拽试卷图片到此处</p>
                <p class="ant-upload-hint">支持 JPG、PNG 格式</p>
              </div>
            </Upload.Dragger>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <Button @click="handleClear">清空</Button>
            <Button
              type="primary"
              :icon="FileTextOutlined"
              :loading="isAnalyzing"
              @click="handleAnalyze"
            >
              开始分析
            </Button>
          </div>
        </Card>

        <!-- 试卷信息 -->
        <Card v-if="analysisResult" title="试卷信息" :bordered="false" class="info-card">
          <Descriptions :column="1" size="small">
            <DescriptionsItem label="试卷标题">
              {{ analysisResult.paperInfo.title || '未识别' }}
            </DescriptionsItem>
            <DescriptionsItem label="学科">
              {{ analysisResult.paperInfo.subject || '未识别' }}
            </DescriptionsItem>
            <DescriptionsItem label="总分">
              {{ analysisResult.paperInfo.totalScore || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="题目数量">
              <Tag color="blue">{{ analysisResult.paperInfo.questionCount }}</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="处理耗时">
              {{ analysisResult.processingMs }}ms
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-section">
        <Card title="识别结果" :bordered="false" class="result-card">
          <!-- 加载中 -->
          <div v-if="isAnalyzing" class="loading-state">
            <Spin size="large" />
            <p>正在分析试卷，请稍候...</p>
          </div>

          <!-- 无结果 -->
          <div v-else-if="!analysisResult" class="empty-state">
            <FileTextOutlined class="empty-icon" />
            <p>上传试卷图片后点击"开始分析"</p>
          </div>

          <!-- 显示结果 -->
          <template v-else>
            <!-- 导入操作栏 -->
            <div class="import-toolbar">
              <span>已选择 {{ selectedRowKeys.length }} 道题目</span>
              <Button
                type="primary"
                :icon="ImportOutlined"
                :loading="isImporting"
                :disabled="selectedRowKeys.length === 0"
                @click="handleImport"
              >
                导入题库
              </Button>
            </div>

            <!-- 导入结果 -->
            <div v-if="importResult" class="import-result">
              <Tag color="green">导入成功: {{ importResult.imported }}</Tag>
              <Tag v-if="importResult.duplicates" color="orange">
                重复跳过: {{ importResult.duplicates }}
              </Tag>
              <Tag v-if="importResult.failed" color="red">
                导入失败: {{ importResult.failed }}
              </Tag>
            </div>

            <Divider />

            <!-- 题目列表 -->
            <Table
              :columns="columns"
              :data-source="analysisResult.questions"
              :pagination="false"
              :row-selection="{
                selectedRowKeys,
                onChange: (keys: number[]) => selectedRowKeys = keys,
              }"
              size="small"
              row-key="index"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'type'">
                  <Tag :color="getTypeColor(record.type)">{{ record.type }}</Tag>
                </template>
                <template v-if="column.dataIndex === 'score'">
                  {{ record.score || '-' }}
                </template>
                <template v-if="column.key === 'action'">
                  <div class="action-cell">
                    <Button
                      type="link"
                      size="small"
                      @click="handlePreview(record)"
                    >
                      <EyeOutlined />
                    </Button>
                    <template v-if="getImportStatus(record.index)">
                      <Badge
                        v-if="getImportStatus(record.index)!.status === 'imported'"
                        status="success"
                        text="已导入"
                      />
                      <Badge
                        v-else-if="getImportStatus(record.index)!.status === 'duplicate'"
                        status="warning"
                        text="重复"
                      />
                      <Badge
                        v-else
                        status="error"
                        text="失败"
                      />
                    </template>
                  </div>
                </template>
              </template>
            </Table>
          </template>
        </Card>
      </div>
    </div>

    <!-- 题目预览弹窗 -->
    <Modal
      v-model:open="previewVisible"
      title="题目详情"
      :footer="null"
      width="600px"
    >
      <template v-if="previewQuestion">
        <Descriptions :column="1" bordered size="small">
          <DescriptionsItem label="题号">
            {{ previewQuestion.index }}
          </DescriptionsItem>
          <DescriptionsItem label="题型">
            <Tag :color="getTypeColor(previewQuestion.type)">
              {{ previewQuestion.type }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="分值">
            {{ previewQuestion.score || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="题目内容">
            <div class="question-content">{{ previewQuestion.content }}</div>
          </DescriptionsItem>
          <DescriptionsItem v-if="previewQuestion.options?.length" label="选项">
            <ul class="options-list">
              <li v-for="(opt, idx) in previewQuestion.options" :key="idx">
                {{ opt }}
              </li>
            </ul>
          </DescriptionsItem>
          <DescriptionsItem v-if="previewQuestion.answer" label="答案">
            {{ previewQuestion.answer }}
          </DescriptionsItem>
        </Descriptions>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.paper-page {
  padding: 16px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
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

.info-card {
  margin-top: 16px;
}

.result-card {
  min-height: 600px;
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
  font-size: 64px;
  margin-bottom: 16px;
}

.import-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.import-result {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-content {
  white-space: pre-wrap;
  line-height: 1.8;
}

.options-list {
  margin: 0;
  padding-left: 20px;
}

.options-list li {
  margin-bottom: 4px;
}
</style>
