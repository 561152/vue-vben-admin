<script lang="ts" setup>
/**
 * 教师仪表盘
 * Phase 2: 教师操作增强
 *
 * 功能：
 * - OCR 题目批量解析
 * - 一键分发错题
 * - 题库管理快捷入口
 */
import { ref, onMounted } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Upload,
  Button,
  Table,
  Input,
  Select,
  SelectOption,
  Checkbox,
  Alert,
  message,
  Space,
} from 'ant-design-vue';
import {
  PlusOutlined,
  CameraOutlined,
  SendOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '#/store';
import { useRouter } from 'vue-router';
import axios from 'axios';
import type { UploadProps } from 'ant-design-vue';

// 状态
const userStore = useUserStore();
const router = useRouter();

const pendingWrongQuestions = ref(0);
const questionBankCount = ref(0);

// OCR 解析弹窗
const ocrParserVisible = ref(false);
const ocrUploading = ref(false);
const parsedQuestions = ref<any[]>([]);
const imageFile = ref<File | null>(null);

// 批量分发弹窗
const distributeVisible = ref(false);
const distributing = ref(false);
const selectedRecordIds = ref<string[]>([]);
const selectedStudents = ref<string[]>([]);
const students = ref<any[]>([]);
const distributionTitle = ref('');
const distributionDescription = ref('');

// 题目表格列定义
const questionColumns = [
  {
    title: '题号',
    dataIndex: 'questionNumber',
    key: 'questionNumber',
    width: 80,
  },
  {
    title: '题型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: '题目内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
  },
  {
    title: '答案',
    dataIndex: 'answer',
    key: 'answer',
    width: 150,
  },
  {
    title: 'OCR置信度',
    dataIndex: 'ocrConfidence',
    key: 'ocrConfidence',
    width: 120,
  },
];

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取待分发错题数
    const statsRes = await axios.get('/api/lms/grading-records/wrong-questions/stats', {
      params: {
        teacherId: userStore.user.id,
      },
    });
    pendingWrongQuestions.value = statsRes.data.totalWrongQuestions || 0;

    // 获取题库数量
    const banksRes = await axios.get('/api/lms/question-banks', {
      params: {
        page: 1,
        pageSize: 1,
      },
    });
    questionBankCount.value = banksRes.data.total || 0;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// OCR 上传前处理
const handleOcrUpload: UploadProps['beforeUpload'] = (file) => {
  imageFile.value = file;
  ocrUploading.value = true;

  // 调用 OCR 解析 API
  parseImage(file);

  return false; // 阻止自动上传
};

// 解析图片
const parseImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(
      '/api/lms/question-banks/ocr-parse',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    parsedQuestions.value = response.data.questions || [];
    message.success(`成功解析 ${parsedQuestions.value.length} 道题目`);
  } catch (error: any) {
    console.error('OCR解析失败:', error);
    message.error(error.message || 'OCR解析失败，请重试');
  } finally {
    ocrUploading.value = false;
  }
};

// 导入题库
const importToQuestionBank = async () => {
  if (parsedQuestions.value.length === 0) {
    message.warning('没有可导入的题目');
    return;
  }

  try {
    const response = await axios.post('/api/lms/question-banks/import', {
      questions: parsedQuestions.value,
    });

    message.success(
      `成功导入 ${response.data.success} 道题目，失败 ${response.data.failed} 道`,
    );

    // 关闭弹窗
    ocrParserVisible.value = false;
    parsedQuestions.value = [];
    imageFile.value = null;

    // 刷新统计
    loadStats();
  } catch (error: any) {
    console.error('导入题库失败:', error);
    message.error(error.message || '导入题库失败，请重试');
  }
};

// 显示批量分发弹窗
const showBatchDistribute = async () => {
  try {
    // 加载待分发的批改记录
    const response = await axios.get('/api/lms/grading-records/pending-distribution', {
      params: {
        teacherId: userStore.user.id,
      },
    });

    selectedRecordIds.value = response.data.records.map((r: any) => r.id);
    students.value = response.data.students || [];
    selectedStudents.value = students.value.map((s: any) => s.id);

    distributeVisible.value = true;
  } catch (error: any) {
    console.error('加载待分发记录失败:', error);
    message.error(error.message || '加载待分发记录失败');
  }
};

// 批量分发错题
const handleBatchDistribute = async () => {
  if (selectedStudents.value.length === 0) {
    message.warning('请至少选择一个学生');
    return;
  }

  distributing.value = true;

  try {
    const response = await axios.post('/api/lms/grading-records/batch-distribute', {
      recordIds: selectedRecordIds.value,
      teacherId: userStore.user.id,
      studentIds: selectedStudents.value,
      title: distributionTitle.value || undefined,
      description: distributionDescription.value || undefined,
    });

    message.success(
      `成功分发 ${response.data.total} 个任务，共 ${response.data.summary.totalQuestions} 道错题`,
    );

    // 关闭弹窗
    distributeVisible.value = false;
    selectedRecordIds.value = [];
    selectedStudents.value = [];
    distributionTitle.value = '';
    distributionDescription.value = '';

    // 刷新统计
    loadStats();
  } catch (error: any) {
    console.error('批量分发失败:', error);
    message.error(error.message || '批量分发失败，请重试');
  } finally {
    distributing.value = false;
  }
};

// 跳转到题库管理
const goToQuestionBank = () => {
  router.push('/lms/question-banks');
};

// 显示 OCR 解析弹窗
const showOcrParser = () => {
  ocrParserVisible.value = true;
  parsedQuestions.value = [];
  imageFile.value = null;
};

// 页面加载时加载统计
onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="teacher-dashboard">
    <Card title="教师工作台" :bordered="false">
      <!-- 快捷操作 -->
      <Row :gutter="16" class="quick-actions">
        <Col :span="8">
          <Card hoverable class="action-card" @click="showOcrParser">
            <div class="action-content">
              <CameraOutlined class="action-icon" />
              <Statistic
                title="OCR 题目解析"
                :value="0"
                suffix=""
              />
              <div class="action-desc">批量识别题目图片</div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card hoverable class="action-card" @click="showBatchDistribute">
            <div class="action-content">
              <SendOutlined class="action-icon action-icon-warning" />
              <Statistic
                title="一键分发错题"
                :value="pendingWrongQuestions"
                suffix="道"
                :value-style="{ color: pendingWrongQuestions > 0 ? '#cf1322' : '#999' }"
              />
              <div class="action-desc">待分发错题数</div>
            </div>
          </Card>
        </Col>
        <Col :span="8">
          <Card hoverable class="action-card" @click="goToQuestionBank">
            <div class="action-content">
              <BookOutlined class="action-icon action-icon-success" />
              <Statistic
                title="题库管理"
                :value="questionBankCount"
                suffix="题"
              />
              <div class="action-desc">管理班级题库</div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>

    <!-- OCR 解析弹窗 -->
    <Modal
      v-model:open="ocrParserVisible"
      title="OCR 题目解析"
      width="900px"
      :footer="null"
    >
      <div class="ocr-parser-modal">
        <!-- 上传区域 -->
        <Upload
          :before-upload="handleOcrUpload"
          accept="image/*"
          list-type="picture-card"
          :max-count="1"
        >
          <div v-if="!imageFile">
            <PlusOutlined />
            <div class="upload-text">上传题目图片</div>
          </div>
        </Upload>

        <Alert
          message="提示：请确保图片清晰，题目完整可见"
          type="info"
          show-icon
          class="mt-4"
        />

        <!-- 解析中提示 -->
        <div v-if="ocrUploading" class="parsing-hint">
          <Space>
            <CheckCircleOutlined spin />
            <span>正在解析题目...</span>
          </Space>
        </div>

        <!-- 解析结果 -->
        <div v-if="parsedQuestions.length > 0" class="parsed-results">
          <Alert
            :message="`成功解析 ${parsedQuestions.length} 道题目，请检查并编辑后导入`"
            type="success"
            show-icon
            class="mb-4"
          />

          <Table
            :columns="questionColumns"
            :data-source="parsedQuestions"
            :pagination="false"
            bordered
            :scroll="{ y: 400 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'content'">
                <Input.TextArea
                  v-model:value="record.content"
                  :rows="2"
                  placeholder="题目内容"
                />
              </template>
              <template v-else-if="column.key === 'answer'">
                <Input
                  v-model:value="record.answer"
                  placeholder="答案"
                />
              </template>
              <template v-else-if="column.key === 'ocrConfidence'">
                <span>{{ (record.ocrConfidence * 100).toFixed(0) }}%</span>
              </template>
            </template>
          </Table>

          <div class="actions mt-4">
            <Space>
              <Button @click="ocrParserVisible = false">取消</Button>
              <Button
                type="primary"
                :disabled="parsedQuestions.length === 0"
                @click="importToQuestionBank"
              >
                导入题库
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 批量分发弹窗 -->
    <Modal
      v-model:open="distributeVisible"
      title="批量分发错题"
      width="700px"
      :footer="null"
    >
      <div class="distribute-modal">
        <Alert
          :message="`已选中 ${selectedRecordIds.length} 条批改记录`"
          type="info"
          show-icon
          class="mb-4"
        />

        <!-- 自定义任务信息（可选） -->
        <div class="task-info mb-4">
          <div class="form-item">
            <label>任务标题（可选）：</label>
            <Input
              v-model:value="distributionTitle"
              placeholder="留空则自动生成，如：小明的错题巩固"
            />
          </div>
          <div class="form-item mt-3">
            <label>任务描述（可选）：</label>
            <Input.TextArea
              v-model:value="distributionDescription"
              :rows="3"
              placeholder="留空则自动生成，如：本周错题共 X 道，请认真完成..."
            />
          </div>
        </div>

        <!-- 学生选择 -->
        <div class="student-selection">
          <h4>选择学生（{{ selectedStudents.length }}/{{ students.length }}）</h4>
          <Checkbox.Group v-model:value="selectedStudents" style="width: 100%">
            <Row>
              <Col v-for="student in students" :key="student.id" :span="12">
                <Checkbox :value="student.id" class="mb-2">
                  {{ student.name }}（{{ student.wrongQuestionCount }} 道错题）
                </Checkbox>
              </Col>
            </Row>
          </Checkbox.Group>
        </div>

        <div class="actions mt-4">
          <Space>
            <Button @click="distributeVisible = false">取消</Button>
            <Button
              type="primary"
              :loading="distributing"
              :disabled="selectedStudents.length === 0"
              @click="handleBatchDistribute"
            >
              确认分发
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.teacher-dashboard {
  padding: 16px;
}

.quick-actions {
  margin-top: 16px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 200px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.action-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 16px;
}

.action-icon-warning {
  color: #fa8c16;
}

.action-icon-success {
  color: #52c41a;
}

.action-desc {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}

.ocr-parser-modal {
  min-height: 300px;
}

.upload-text {
  margin-top: 8px;
  color: #666;
}

.parsing-hint {
  margin-top: 16px;
  padding: 12px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  text-align: center;
}

.parsed-results {
  margin-top: 24px;
}

.distribute-modal {
  min-height: 200px;
}

.task-info .form-item {
  margin-bottom: 12px;
}

.task-info label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.student-selection h4 {
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.actions {
  text-align: right;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
  }

  .action-card {
    height: auto;
    margin-bottom: 16px;
  }
}
</style>
