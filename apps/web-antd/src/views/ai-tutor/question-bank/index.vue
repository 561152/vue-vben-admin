<template>
  <div class="question-bank-page">
    <!-- 页面标题 -->
    <Card class="mb-4">
      <template #title>
        <Space>
          <DatabaseOutlined />
          题库管理
        </Space>
      </template>
      <template #extra>
        <Space>
          <Button @click="downloadTemplate">
            <DownloadOutlined /> 下载导入模板
          </Button>
          <Button type="primary" @click="showCreateModal">
            <PlusOutlined /> 创建题库
          </Button>
        </Space>
      </template>

      <p class="text-gray-500">
        支持导入 Excel/JSON 格式的题目文件，快速构建班级题库
      </p>
    </Card>

    <!-- 题库列表 -->
    <Card title="📚 我的题库" :loading="loading">
      <Table
        :columns="bankColumns"
        :data-source="questionBanks"
        :pagination="pagination"
        :row-key="(record: any) => record.id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="viewBankDetail(record)">{{ record.name }}</a>
          </template>

          <template v-else-if="column.key === 'subject'">
            <Tag color="blue">{{ record.subject }}</Tag>
          </template>

          <template v-else-if="column.key === 'gradeLevel'">
            <Tag v-if="record.gradeLevel" color="green">
              {{ record.gradeLevel }}
            </Tag>
            <span v-else class="text-gray-400">未设置</span>
          </template>

          <template v-else-if="column.key === 'questionCount'">
            <Statistic
              :value="record.questionCount"
              suffix="题"
              :value-style="{ fontSize: '14px' }"
            />
          </template>

          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button type="link" size="small" @click="viewBankDetail(record)">
                查看题目
              </Button>
              <Button type="link" size="small" @click="showUploadModal(record)">
                导入题目
              </Button>
              <Popconfirm
                title="确定删除该题库吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteBank(record.id)"
              >
                <Button type="link" size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建题库弹窗 -->
    <Modal
      v-model:open="createModalVisible"
      title="创建题库"
      @ok="handleCreate"
      @cancel="createModalVisible = false"
    >
      <Form :model="createForm" :label-col="{ span: 6 }">
        <FormItem label="题库名称" required>
          <Input v-model:value="createForm.name" placeholder="请输入题库名称" />
        </FormItem>
        <FormItem label="学科">
          <Select v-model:value="createForm.subject" placeholder="请选择学科">
            <SelectOption value="数学">数学</SelectOption>
            <SelectOption value="语文">语文</SelectOption>
            <SelectOption value="英语">英语</SelectOption>
            <SelectOption value="物理">物理</SelectOption>
            <SelectOption value="化学">化学</SelectOption>
            <SelectOption value="生物">生物</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="年级">
          <Select
            v-model:value="createForm.gradeLevel"
            placeholder="请选择年级"
          >
            <SelectOption value="一年级">一年级</SelectOption>
            <SelectOption value="二年级">二年级</SelectOption>
            <SelectOption value="三年级">三年级</SelectOption>
            <SelectOption value="四年级">四年级</SelectOption>
            <SelectOption value="五年级">五年级</SelectOption>
            <SelectOption value="六年级">六年级</SelectOption>
            <SelectOption value="初一">初一</SelectOption>
            <SelectOption value="初二">初二</SelectOption>
            <SelectOption value="初三">初三</SelectOption>
            <SelectOption value="高一">高一</SelectOption>
            <SelectOption value="高二">高二</SelectOption>
            <SelectOption value="高三">高三</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="createForm.description"
            placeholder="请输入题库描述"
            :rows="3"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 导入题目弹窗 -->
    <Modal
      v-model:open="uploadModalVisible"
      title="导入题目"
      width="600px"
      @ok="uploadModalVisible = false"
      @cancel="uploadModalVisible = false"
    >
      <Alert
        message="支持的文件格式"
        description="支持 .xlsx, .xls, .json 格式的题目文件"
        type="info"
        show-icon
        class="mb-4"
      />

      <Upload
        :before-upload="handleBeforeUpload"
        :file-list="fileList"
        @remove="fileList = []"
        accept=".xlsx,.xls,.json"
      >
        <Button> <UploadOutlined /> 选择文件 </Button>
      </Upload>

      <Divider />

      <div v-if="uploadResult" class="upload-result">
        <Alert
          :message="`导入完成：成功 ${uploadResult.imported} 题，失败 ${uploadResult.skipped} 题`"
          :type="uploadResult.skipped > 0 ? 'warning' : 'success'"
          show-icon
          class="mb-4"
        />

        <div v-if="uploadResult.errors && uploadResult.errors.length > 0">
          <h4 class="mb-2">错误详情：</h4>
          <ul class="error-list">
            <li v-for="(error, index) in uploadResult.errors" :key="index">
              第 {{ error.row }} 行：{{ error.error }}
            </li>
          </ul>
        </div>
      </div>
    </Modal>

    <!-- 题库详情弹窗 -->
    <Modal
      v-model:open="detailModalVisible"
      :title="`题库：${selectedBank?.name}`"
      width="1000px"
      footer=""
    >
      <Table
        :columns="questionColumns"
        :data-source="questions"
        :pagination="questionPagination"
        :loading="loadingQuestions"
        :row-key="(record: any) => record.id"
        @change="handleQuestionTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'questionType'">
            <Tag :color="getQuestionTypeColor(record.questionType)">
              {{ getQuestionTypeLabel(record.questionType) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'content'">
            <div class="question-content">
              {{ truncateText(record.content, 50) }}
            </div>
          </template>

          <template v-else-if="column.key === 'difficulty'">
            <Rate :value="record.difficulty" disabled />
          </template>

          <template v-else-if="column.key === 'tags'">
            <Tag v-for="tag in record.tags" :key="tag" color="default">
              {{ tag }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <Button
              type="link"
              size="small"
              @click="viewQuestionDetail(record)"
            >
              查看详情
            </Button>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 题目详情弹窗 -->
    <Modal
      v-model:open="questionDetailVisible"
      title="题目详情"
      width="800px"
      footer=""
    >
      <div v-if="selectedQuestion" class="question-detail">
        <Descriptions bordered :column="1">
          <DescriptionsItem label="题型">
            <Tag :color="getQuestionTypeColor(selectedQuestion.questionType)">
              {{ getQuestionTypeLabel(selectedQuestion.questionType) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="难度">
            <Rate :value="selectedQuestion.difficulty" disabled />
          </DescriptionsItem>
          <DescriptionsItem label="题目内容">
            <div class="whitespace-pre-wrap">
              {{ selectedQuestion.content }}
            </div>
          </DescriptionsItem>
          <DescriptionsItem label="答案" v-if="selectedQuestion.answer">
            <div class="whitespace-pre-wrap">{{ selectedQuestion.answer }}</div>
          </DescriptionsItem>
          <DescriptionsItem label="解析" v-if="selectedQuestion.solution">
            <div class="whitespace-pre-wrap">
              {{ selectedQuestion.solution }}
            </div>
          </DescriptionsItem>
          <DescriptionsItem label="知识点标签">
            <Tag
              v-for="tag in selectedQuestion.tags"
              :key="tag"
              color="default"
            >
              {{ tag }}
            </Tag>
          </DescriptionsItem>
        </Descriptions>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { requestClient } from '#/api/request';
import type { ColumnsType } from 'ant-design-vue/es/table';
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  FormItem,
  Input,
  Textarea,
  Select,
  SelectOption,
  Upload,
  Alert,
  Divider,
  Popconfirm,
  Statistic,
  Descriptions,
  DescriptionsItem,
  Rate,
  message,
} from 'ant-design-vue';
import {
  DatabaseOutlined,
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

// 数据定义
const loading = ref(false);
const loadingQuestions = ref(false);
const questionBanks = ref<any[]>([]);
const questions = ref<any[]>([]);
const createModalVisible = ref(false);
const uploadModalVisible = ref(false);
const detailModalVisible = ref(false);
const questionDetailVisible = ref(false);
const selectedBank = ref<any>(null);
const selectedQuestion = ref<any>(null);
const fileList = ref<any[]>([]);
const uploadResult = ref<any>(null);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const questionPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

// 创建表单
const createForm = reactive({
  name: '',
  subject: '',
  gradeLevel: '',
  description: '',
});

// 表格列定义
const bankColumns: ColumnsType = [
  { title: '题库名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '学科', dataIndex: 'subject', key: 'subject', width: 100 },
  { title: '年级', dataIndex: 'gradeLevel', key: 'gradeLevel', width: 100 },
  {
    title: '题目数量',
    dataIndex: 'questionCount',
    key: 'questionCount',
    width: 120,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 250 },
];

const questionColumns = [
  { title: '题型', dataIndex: 'questionType', key: 'questionType', width: 100 },
  { title: '题目内容', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 120 },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 150 },
  { title: '操作', key: 'actions', width: 100 },
];

// 加载题库列表
const loadQuestionBanks = async () => {
  try {
    loading.value = true;
    const response = await requestClient.get('/lms/question-bank', {
      params: {
        page: pagination.current,
        limit: pagination.pageSize,
      },
    });

    questionBanks.value = response.items;
    pagination.total = response.total;
  } catch (error) {
    console.error('加载题库列表失败:', error);
    message.error('加载题库列表失败');
  } finally {
    loading.value = false;
  }
};

// 查看题库详情
const viewBankDetail = async (bank: any) => {
  selectedBank.value = bank;
  detailModalVisible.value = true;
  await loadQuestions(bank.id);
};

// 加载题库中的题目
const loadQuestions = async (bankId: string) => {
  try {
    loadingQuestions.value = true;
    const response = await requestClient.get(
      `/lms/question-bank/${bankId}/questions`,
      {
        params: {
          page: questionPagination.current,
          limit: questionPagination.pageSize,
        },
      },
    );

    questions.value = response.items;
    questionPagination.total = response.total;
  } catch (error) {
    console.error('加载题目列表失败:', error);
    message.error('加载题目列表失败');
  } finally {
    loadingQuestions.value = false;
  }
};

// 查看题目详情
const viewQuestionDetail = (question: any) => {
  selectedQuestion.value = question;
  questionDetailVisible.value = true;
};

// 创建题库
const showCreateModal = () => {
  createModalVisible.value = true;
  // 重置表单
  createForm.name = '';
  createForm.subject = '';
  createForm.gradeLevel = '';
  createForm.description = '';
};

const handleCreate = async () => {
  try {
    if (!createForm.name || !createForm.subject) {
      message.warning('请填写题库名称和学科');
      return;
    }

    await requestClient.post('/lms/question-bank', createForm);
    message.success('创建题库成功');
    createModalVisible.value = false;
    await loadQuestionBanks();
  } catch (error) {
    console.error('创建题库失败:', error);
    message.error('创建题库失败');
  }
};

// 删除题库
const deleteBank = async (id: string) => {
  try {
    await requestClient.delete(`/lms/question-bank/${id}`);
    message.success('删除题库成功');
    await loadQuestionBanks();
  } catch (error: any) {
    console.error('删除题库失败:', error);
    message.error(error.response?.data?.message || '删除题库失败');
  }
};

// 显示上传弹窗
const showUploadModal = (bank: any) => {
  selectedBank.value = bank;
  uploadModalVisible.value = true;
  fileList.value = [];
  uploadResult.value = null;
};

// 文件上传前处理
const handleBeforeUpload = async (file: any) => {
  try {
    // 检查文件类型
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['xlsx', 'xls', 'json'].includes(fileExt)) {
      message.error('仅支持 .xlsx, .xls, .json 格式的文件');
      return false;
    }

    // 上传文件
    const formData = new FormData();
    formData.append('file', file);

    const response = await requestClient.post(
      `/lms/question-bank/${selectedBank.value.id}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    uploadResult.value = response;
    message.success(response.message);

    // 刷新题库列表
    await loadQuestionBanks();
  } catch (error: any) {
    console.error('文件上传失败:', error);
    message.error(error.response?.data?.message || '文件上传失败');
  }

  return false; // 阻止自动上传
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await requestClient.get(
      '/lms/question-bank/template/download',
      {
        responseType: 'blob',
      },
    );

    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'question-bank-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    message.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    message.error('下载模板失败');
  }
};

// 表格翻页
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadQuestionBanks();
};

const handleQuestionTableChange = (pag: any) => {
  questionPagination.current = pag.current;
  questionPagination.pageSize = pag.pageSize;
  if (selectedBank.value) {
    loadQuestions(selectedBank.value.id);
  }
};

// 工具函数
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getQuestionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    CHOICE: 'blue',
    MULTIPLE_CHOICE: 'cyan',
    FILL_BLANK: 'green',
    TRUE_FALSE: 'orange',
    CALCULATION: 'purple',
    SUBJECTIVE: 'default',
  };
  return colors[type] || 'default';
};

const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CHOICE: '选择题',
    MULTIPLE_CHOICE: '多选题',
    FILL_BLANK: '填空题',
    TRUE_FALSE: '判断题',
    CALCULATION: '计算题',
    SUBJECTIVE: '主观题',
  };
  return labels[type] || type;
};

onMounted(() => {
  loadQuestionBanks();
});
</script>

<style scoped lang="scss">
.question-bank-page {
  padding: 24px;
}

.question-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.upload-result {
  margin-top: 16px;
}

.error-list {
  max-height: 200px;
  padding-left: 20px;
  overflow-y: auto;

  li {
    margin-bottom: 8px;
    color: #ff4d4f;
  }
}

.question-detail {
  :deep(.ant-descriptions-item-label) {
    width: 100px;
  }
}

.whitespace-pre-wrap {
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
