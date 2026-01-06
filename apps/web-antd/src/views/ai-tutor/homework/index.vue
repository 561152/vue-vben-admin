<script lang="ts" setup>
import { ref, computed } from 'vue';
import {
  Card,
  Upload,
  Button,
  Spin,
  Alert,
  Descriptions,
  DescriptionsItem,
  Tag,
  Divider,
  Progress,
  Table,
  Badge,
  message,
} from 'ant-design-vue';
import {
  EditOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
} from '@ant-design/icons-vue';
import type { UploadFile, TableColumnsType } from 'ant-design-vue';
import { gradeHomework } from '#/api/ai';
import type { HomeworkGradingResponse, QuestionGradingResult } from '#/api/ai';

// 状态
const isLoading = ref(false);
const fileList = ref<UploadFile[]>([]);
const previewUrl = ref<string>('');
const result = ref<HomeworkGradingResponse | null>(null);

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '题号',
    dataIndex: 'index',
    width: 60,
    align: 'center',
  },
  {
    title: '题目内容',
    dataIndex: 'questionContent',
    ellipsis: true,
  },
  {
    title: '学生答案',
    dataIndex: 'studentAnswer',
    width: 120,
  },
  {
    title: '批改结果',
    dataIndex: 'isCorrect',
    width: 100,
    align: 'center',
  },
  {
    title: '得分',
    dataIndex: 'score',
    width: 80,
    align: 'center',
  },
  {
    title: '错误分析',
    dataIndex: 'errorAnalysis',
    ellipsis: true,
  },
];

// 计算正确率颜色
const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 0.8) return '#52c41a';
  if (accuracy >= 0.6) return '#faad14';
  return '#ff4d4f';
};

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

  result.value = null;
};

// 执行批改
const handleGrade = async () => {
  if (fileList.value.length === 0 || !fileList.value[0]?.originFileObj) {
    message.warning('请先上传作业图片');
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    const formData = new FormData();
    formData.append('image', fileList.value[0].originFileObj);

    result.value = await gradeHomework(formData);
    message.success('批改完成');
  } catch (error: any) {
    message.error(error.message || '批改失败');
  } finally {
    isLoading.value = false;
  }
};

// 清空
const handleClear = () => {
  fileList.value = [];
  previewUrl.value = '';
  result.value = null;
};
</script>

<template>
  <div class="homework-page">
    <div class="page-header">
      <h2><EditOutlined /> 智能作业批改</h2>
      <p>上传作业图片，AI自动识别并批改每道题目</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：上传区 -->
      <div class="upload-section">
        <Card title="上传作业" :bordered="false">
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
                  <FileImageOutlined style="font-size: 48px; color: #1890ff" />
                </p>
                <p class="ant-upload-text">点击或拖拽作业图片到此处</p>
                <p class="ant-upload-hint">支持 JPG、PNG 格式，建议清晰拍摄</p>
              </div>
            </Upload.Dragger>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <Button @click="handleClear">清空</Button>
            <Button
              type="primary"
              :icon="EditOutlined"
              :loading="isLoading"
              @click="handleGrade"
            >
              开始批改
            </Button>
          </div>
        </Card>

        <!-- 使用说明 -->
        <Card title="使用说明" :bordered="false" class="tips-card">
          <ul class="tips-list">
            <li>请确保作业图片清晰、光线充足</li>
            <li>建议正面平拍，避免倾斜</li>
            <li>支持手写和打印体识别</li>
            <li>单次最多批改一张作业图片</li>
          </ul>
        </Card>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-section">
        <Card title="批改结果" :bordered="false" class="result-card">
          <!-- 加载中 -->
          <div v-if="isLoading" class="loading-state">
            <Spin size="large" />
            <p>正在批改中，请稍候...</p>
          </div>

          <!-- 无结果 -->
          <div v-else-if="!result" class="empty-state">
            <EditOutlined class="empty-icon" />
            <p>上传作业图片后点击"开始批改"</p>
          </div>

          <!-- 显示结果 -->
          <template v-else>
            <!-- 总体统计 -->
            <div class="summary-section">
              <div class="summary-header">
                <h3>批改概览</h3>
                <Tag color="blue">耗时 {{ result.processingMs }}ms</Tag>
              </div>

              <div class="summary-cards">
                <div class="summary-card">
                  <div class="summary-value">{{ result.summary.totalQuestions }}</div>
                  <div class="summary-label">总题数</div>
                </div>
                <div class="summary-card correct">
                  <div class="summary-value">{{ result.summary.correctCount }}</div>
                  <div class="summary-label">正确</div>
                </div>
                <div class="summary-card wrong">
                  <div class="summary-value">{{ result.summary.totalQuestions - result.summary.correctCount }}</div>
                  <div class="summary-label">错误</div>
                </div>
                <div class="summary-card score">
                  <div class="summary-value">{{ result.summary.score }}/{{ result.summary.maxScore }}</div>
                  <div class="summary-label">得分</div>
                </div>
              </div>

              <div class="accuracy-bar">
                <span>正确率</span>
                <Progress
                  :percent="result.summary.accuracy * 100"
                  :stroke-color="getAccuracyColor(result.summary.accuracy)"
                  :format="(percent) => `${percent?.toFixed(1)}%`"
                />
              </div>
            </div>

            <Divider />

            <!-- 薄弱知识点 -->
            <div v-if="result.weakPoints?.length" class="weak-points-section">
              <h4>薄弱知识点</h4>
              <div class="weak-points">
                <Tag
                  v-for="point in result.weakPoints"
                  :key="point.name"
                  color="orange"
                >
                  {{ point.name }} ({{ point.errorCount }}次错误)
                </Tag>
              </div>
            </div>

            <Divider v-if="result.weakPoints?.length" />

            <!-- 详细结果表格 -->
            <div class="detail-section">
              <h4>逐题详情</h4>
              <Table
                :columns="columns"
                :data-source="result.questions"
                :pagination="false"
                size="small"
                row-key="index"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'isCorrect'">
                    <Badge
                      :status="record.isCorrect ? 'success' : 'error'"
                      :text="record.isCorrect ? '正确' : '错误'"
                    />
                  </template>
                  <template v-if="column.dataIndex === 'score'">
                    <span :style="{ color: record.isCorrect ? '#52c41a' : '#ff4d4f' }">
                      {{ record.score }}/{{ record.maxScore }}
                    </span>
                  </template>
                  <template v-if="column.dataIndex === 'errorAnalysis'">
                    <div v-if="record.errorAnalysis">
                      <div>{{ record.errorAnalysis }}</div>
                      <div v-if="record.correction" class="correction-text">
                        {{ record.correction }}
                      </div>
                    </div>
                    <span v-else class="no-error">-</span>
                  </template>
                </template>
              </Table>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.homework-page {
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

.tips-card {
  margin-top: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.tips-list li {
  margin-bottom: 8px;
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

.summary-section {
  margin-bottom: 16px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.summary-header h3 {
  margin: 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.summary-card.correct {
  background: #f6ffed;
}

.summary-card.wrong {
  background: #fff2f0;
}

.summary-card.score {
  background: #e6f7ff;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.accuracy-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.accuracy-bar span {
  white-space: nowrap;
  color: #666;
}

.accuracy-bar .ant-progress {
  flex: 1;
}

.weak-points-section h4,
.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.weak-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.correction-text {
  margin-top: 4px;
  color: #52c41a;
  font-size: 12px;
}

.no-error {
  color: #999;
}
</style>
