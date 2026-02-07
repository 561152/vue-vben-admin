<template>
  <div class="wrong-question-print-page">
    <Card title="错题打印" :bordered="false">
      <template #extra>
        <Space>
          <Button type="primary" @click="showPrintModal">
            <PrinterOutlined /> 打印错题
          </Button>
          <Button @click="showStatisticsModal">
            <BarChartOutlined /> 统计报告
          </Button>
          <Button @click="showHistoryModal">
            <HistoryOutlined /> 打印历史
          </Button>
        </Space>
      </template>

      <!-- 学生选择 -->
      <Card title="选择学生" size="small" class="mb-4">
        <Select
          v-model:value="selectedStudentId"
          placeholder="请选择学生"
          style="width: 300px"
          show-search
          :filter-option="filterStudent"
        >
          <SelectOption
            v-for="student in students"
            :key="student.id"
            :value="student.id"
          >
            {{ student.name }} ({{ student.studentNumber }})
          </SelectOption>
        </Select>
      </Card>

      <!-- 错题预览 -->
      <Card v-if="selectedStudentId" title="错题预览" size="small">
        <Alert
          :message="`共 ${wrongQuestions.length} 道错题`"
          type="info"
          show-icon
          class="mb-4"
        />

        <Table
          :columns="columns"
          :data-source="wrongQuestions"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'question'">
              <div class="question-preview">
                <Image
                  v-if="record.questionImageUrl"
                  :src="record.questionImageUrl"
                  :width="100"
                  :preview="true"
                />
                <div v-else class="text-content">
                  {{ record.question }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'subject'">
              <Tag :color="getSubjectColor(record.subject)">
                {{ record.subject }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'errorType'">
              <Tag>{{ record.errorType }}</Tag>
            </template>
            <template v-else-if="column.key === 'isMastered'">
              <Tag :color="record.isMastered ? 'green' : 'red'">
                {{ record.isMastered ? '已掌握' : '未掌握' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'reviewPriority'">
              <Rate
                :value="record.reviewPriority"
                :count="5"
                disabled
                allow-half
              />
            </template>
            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </Card>

    <!-- 打印错题弹窗 -->
    <Modal
      v-model:open="printModalVisible"
      title="打印错题"
      width="600px"
      @ok="handlePrint"
      :confirm-loading="printing"
    >
      <Form :model="printForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="打印学生">
          <Select v-model:value="printForm.studentIds" mode="multiple" placeholder="选择学生">
            <SelectOption v-for="student in students" :key="student.id" :value="student.id">
              {{ student.name }}
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem label="科目筛选">
          <Select v-model:value="printForm.subject" placeholder="全部科目" allow-clear>
            <SelectOption value="MATH">数学</SelectOption>
            <SelectOption value="CHINESE">语文</SelectOption>
            <SelectOption value="ENGLISH">英语</SelectOption>
            <SelectOption value="PHYSICS">物理</SelectOption>
            <SelectOption value="CHEMISTRY">化学</SelectOption>
          </Select>
        </FormItem>

        <FormItem label="日期范围">
          <RangePicker
            v-model:value="printForm.dateRange"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </FormItem>

        <FormItem label="知识点筛选">
          <Select
            v-model:value="printForm.knowledgePointIds"
            mode="multiple"
            placeholder="全部知识点"
          >
            <SelectOption
              v-for="kp in knowledgePoints"
              :key="kp.id"
              :value="kp.id"
            >
              {{ kp.name }}
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem label="打印选项">
          <Space direction="vertical">
            <Checkbox v-model:checked="printForm.includeAnswers">
              包含答案
            </Checkbox>
            <Checkbox v-model:checked="printForm.includeSolutions">
              包含解析
            </Checkbox>
          </Space>
        </FormItem>
      </Form>
    </Modal>

    <!-- 统计报告弹窗 -->
    <Modal
      v-model:open="statisticsModalVisible"
      title="生成统计报告"
      width="500px"
      @ok="handleGenerateStatistics"
      :confirm-loading="generatingStatistics"
    >
      <Form :model="statisticsForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="学生">
          <Select v-model:value="statisticsForm.studentId" placeholder="选择学生">
            <SelectOption v-for="student in students" :key="student.id" :value="student.id">
              {{ student.name }}
            </SelectOption>
          </Select>
        </FormItem>

        <FormItem label="日期范围">
          <RangePicker
            v-model:value="statisticsForm.dateRange"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 打印历史弹窗 -->
    <Modal
      v-model:open="historyModalVisible"
      title="打印历史"
      width="800px"
      :footer="null"
    >
      <Table
        :columns="historyColumns"
        :data-source="printHistory"
        :loading="loadingHistory"
        :pagination="historyPagination"
        @change="handleHistoryTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'printType'">
            <Tag :color="record.printType === 'WORKBOOK' ? 'blue' : 'green'">
              {{ record.printType === 'WORKBOOK' ? '错题本' : '统计报告' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'filters'">
            <div class="filter-tags">
              <Tag v-if="record.filters.subject">
                {{ record.filters.subject }}
              </Tag>
              <Tag v-if="record.filters.startDate">
                {{ record.filters.startDate }} ~ {{ record.filters.endDate }}
              </Tag>
            </div>
          </template>
          <template v-else-if="column.key === 'printedAt'">
            {{ formatDate(record.printedAt) }}
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Card,
  Button,
  Space,
  Select,
  SelectOption,
  Table,
  Modal,
  Form,
  FormItem,
  Checkbox,
  RangePicker,
  Alert,
  Tag,
  Rate,
  Image,
  message,
} from 'ant-design-vue';
import {
  PrinterOutlined,
  BarChartOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

// ==================== 数据定义 ====================

const selectedStudentId = ref<string>('');
const students = ref<any[]>([]);
const wrongQuestions = ref<any[]>([]);
const knowledgePoints = ref<any[]>([]);
const loading = ref(false);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 打印弹窗
const printModalVisible = ref(false);
const printing = ref(false);
const printForm = reactive({
  studentIds: [] as string[],
  subject: undefined as string | undefined,
  knowledgePointIds: [] as string[],
  dateRange: undefined as [Dayjs, Dayjs] | undefined,
  includeAnswers: true,
  includeSolutions: true,
});

// 统计报告弹窗
const statisticsModalVisible = ref(false);
const generatingStatistics = ref(false);
const statisticsForm = reactive({
  studentId: undefined as string | undefined,
  dateRange: undefined as [Dayjs, Dayjs] | undefined,
});

// 打印历史弹窗
const historyModalVisible = ref(false);
const printHistory = ref<any[]>([]);
const loadingHistory = ref(false);
const historyPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// ==================== 表格列定义 ====================

const columns = [
  {
    title: '题目',
    key: 'question',
    width: 200,
  },
  {
    title: '科目',
    key: 'subject',
    width: 80,
  },
  {
    title: '错误类型',
    key: 'errorType',
    width: 100,
  },
  {
    title: '复习优先级',
    key: 'reviewPriority',
    width: 120,
  },
  {
    title: '掌握状态',
    key: 'isMastered',
    width: 100,
  },
  {
    title: '错误日期',
    key: 'createdAt',
    width: 120,
  },
];

const historyColumns = [
  {
    title: '学生',
    dataIndex: 'studentName',
    key: 'studentName',
  },
  {
    title: '打印类型',
    key: 'printType',
  },
  {
    title: '题目数量',
    dataIndex: 'questionCount',
    key: 'questionCount',
  },
  {
    title: '筛选条件',
    key: 'filters',
  },
  {
    title: '打印人',
    dataIndex: 'printedBy',
    key: 'printedBy',
  },
  {
    title: '打印时间',
    key: 'printedAt',
  },
];

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadStudents();
});

// ==================== 数据加载 ====================

async function loadStudents() {
  try {
    loading.value = true;
    const response = await axios.get('/api/lms/students');
    students.value = response.data || [];
  } catch (error: any) {
    message.error('加载学生列表失败：' + error.message);
  } finally {
    loading.value = false;
  }
}

async function loadWrongQuestions() {
  if (!selectedStudentId.value) return;

  try {
    loading.value = true;
    const response = await axios.get('/api/ai-doctor/mistakes', {
      params: {
        studentId: selectedStudentId.value,
        isMastered: false,
        page: pagination.current,
        pageSize: pagination.pageSize,
      },
    });

    wrongQuestions.value = response.data.items || [];
    pagination.total = response.data.total || 0;
  } catch (error: any) {
    message.error('加载错题失败：' + error.message);
  } finally {
    loading.value = false;
  }
}

async function loadPrintHistory() {
  try {
    loadingHistory.value = true;
    const response = await axios.get('/api/ai-doctor/wrong-questions/print/history', {
      params: {
        studentId: selectedStudentId.value,
        page: historyPagination.current,
        pageSize: historyPagination.pageSize,
      },
    });

    printHistory.value = response.data.items || [];
    historyPagination.total = response.data.total || 0;
  } catch (error: any) {
    message.error('加载打印历史失败：' + error.message);
  } finally {
    loadingHistory.value = false;
  }
}

// ==================== 事件处理 ====================

function handleTableChange(paginationData: any) {
  pagination.current = paginationData.current;
  pagination.pageSize = paginationData.pageSize;
  loadWrongQuestions();
}

function handleHistoryTableChange(paginationData: any) {
  historyPagination.current = paginationData.current;
  historyPagination.pageSize = paginationData.pageSize;
  loadPrintHistory();
}

function showPrintModal() {
  if (!selectedStudentId.value) {
    message.warning('请先选择学生');
    return;
  }
  printForm.studentIds = [selectedStudentId.value];
  printModalVisible.value = true;
}

function showStatisticsModal() {
  if (!selectedStudentId.value) {
    message.warning('请先选择学生');
    return;
  }
  statisticsForm.studentId = selectedStudentId.value;
  statisticsModalVisible.value = true;
}

function showHistoryModal() {
  historyModalVisible.value = true;
  loadPrintHistory();
}

async function handlePrint() {
  if (printForm.studentIds.length === 0) {
    message.warning('请选择至少一个学生');
    return;
  }

  try {
    printing.value = true;

    const requestData: any = {
      includeAnswers: printForm.includeAnswers,
      includeSolutions: printForm.includeSolutions,
    };

    if (printForm.subject) {
      requestData.subject = printForm.subject;
    }

    if (printForm.knowledgePointIds.length > 0) {
      requestData.knowledgePointIds = printForm.knowledgePointIds;
    }

    if (printForm.dateRange) {
      requestData.startDate = printForm.dateRange[0].format('YYYY-MM-DD');
      requestData.endDate = printForm.dateRange[1].format('YYYY-MM-DD');
    }

    if (printForm.studentIds.length === 1) {
      // 单个学生直接下载
      requestData.studentId = printForm.studentIds[0];
      const response = await axios.post(
        '/api/ai-doctor/wrong-questions/print/single',
        requestData,
        { responseType: 'blob' }
      );

      // 下载文件
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wrong-questions-${printForm.studentIds[0]}-${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      message.success('错题本已生成！');
      printModalVisible.value = false;
    } else {
      // 多个学生批量打印
      requestData.studentIds = printForm.studentIds;
      const response = await axios.post(
        '/api/ai-doctor/wrong-questions/print/batch',
        requestData
      );

      message.success(
        `批量打印任务已创建，任务ID: ${response.data.jobId}。请稍后在打印历史中查看。`
      );
      printModalVisible.value = false;
    }
  } catch (error: any) {
    message.error('打印失败：' + error.message);
  } finally {
    printing.value = false;
  }
}

async function handleGenerateStatistics() {
  if (!statisticsForm.studentId) {
    message.warning('请选择学生');
    return;
  }

  try {
    generatingStatistics.value = true;

    const requestData: any = {
      studentId: statisticsForm.studentId,
    };

    if (statisticsForm.dateRange) {
      requestData.startDate = statisticsForm.dateRange[0].format('YYYY-MM-DD');
      requestData.endDate = statisticsForm.dateRange[1].format('YYYY-MM-DD');
    }

    const response = await axios.post(
      '/api/ai-doctor/wrong-questions/print/statistics',
      requestData,
      { responseType: 'blob' }
    );

    // 下载文件
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statistics-${statisticsForm.studentId}-${Date.now()}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);

    message.success('统计报告已生成！');
    statisticsModalVisible.value = false;
  } catch (error: any) {
    message.error('生成统计报告失败：' + error.message);
  } finally {
    generatingStatistics.value = false;
  }
}

// ==================== 工具函数 ====================

function filterStudent(input: string, option: any) {
  return option.children[0].toLowerCase().includes(input.toLowerCase());
}

function getSubjectColor(subject: string) {
  const colors: Record<string, string> = {
    MATH: 'blue',
    CHINESE: 'green',
    ENGLISH: 'orange',
    PHYSICS: 'purple',
    CHEMISTRY: 'cyan',
  };
  return colors[subject] || 'default';
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}
</script>

<style scoped lang="less">
.wrong-question-print-page {
  .question-preview {
    max-width: 200px;

    .text-content {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .filter-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
}
</style>
