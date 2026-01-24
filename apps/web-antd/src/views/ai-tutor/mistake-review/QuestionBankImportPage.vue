<template>
  <div class="question-bank-import-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb-section">
        <a-breadcrumb>
          <a-breadcrumb-item>
            <router-link to="/education">教育管理</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>
            <router-link to="/education/question-bank">题库管理</router-link>
          </a-breadcrumb-item>
          <a-breadcrumb-item>题库导入</a-breadcrumb-item>
        </a-breadcrumb>
      </div>
      <div class="header-content">
        <div class="header-left">
          <a-button type="text" @click="handleBack" style="margin-right: 8px">
            <LeftOutlined />
          </a-button>
          <h2>题库导入</h2>
        </div>
        <a-space>
          <a-button @click="refreshData" :loading="loading">
            <ReloadOutlined />
            刷新
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 步骤条 -->
    <div class="steps-section">
      <a-steps :current="currentStep" :items="steps" />
    </div>

    <!-- 步骤1: 选择试卷 -->
    <div v-if="currentStep === 0" class="step-content">
      <a-card title="选择试卷" :bordered="false">
        <a-alert
          message="请选择要导入到题库的试卷"
          description="系统将从已批改的试卷中提取题目，过滤低质量题目，并自动去重后导入题库。"
          type="info"
          show-icon
          style="margin-bottom: 24px"
        />

        <!-- 搜索和筛选 -->
        <a-form layout="inline" style="margin-bottom: 16px">
          <a-form-item label="学科">
            <a-select
              v-model:value="paperFilters.subject"
              style="width: 120px"
              placeholder="全部学科"
              allow-clear
              @change="loadPapers"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="MATH">数学</a-select-option>
              <a-select-option value="CHINESE">语文</a-select-option>
              <a-select-option value="ENGLISH">英语</a-select-option>
              <a-select-option value="PHYSICS">物理</a-select-option>
              <a-select-option value="CHEMISTRY">化学</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="年级">
            <a-select
              v-model:value="paperFilters.gradeLevel"
              style="width: 120px"
              placeholder="全部年级"
              allow-clear
              @change="loadPapers"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="GRADE_10">高一</a-select-option>
              <a-select-option value="GRADE_11">高二</a-select-option>
              <a-select-option value="GRADE_12">高三</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="关键词">
            <a-input
              v-model:value="paperFilters.keyword"
              style="width: 200px"
              placeholder="搜索试卷名称"
              allow-clear
              @press-enter="loadPapers"
            >
              <template #suffix>
                <SearchOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" @click="loadPapers">
              <SearchOutlined />
              搜索
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 试卷列表 -->
        <a-spin :spinning="loadingPapers">
          <a-radio-group v-model:value="selectedPaperId" style="width: 100%">
            <a-list
              :data-source="papers"
              :locale="{ emptyText: '暂无可导入的试卷' }"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <a-radio :value="item.id">
                        {{ item.paperName }}
                      </a-radio>
                    </template>
                    <template #description>
                      <a-space :size="16">
                        <span>
                          <a-tag :color="getSubjectColor(item.subject)">
                            {{ getSubjectText(item.subject) }}
                          </a-tag>
                        </span>
                        <span>
                          {{ item.gradeLevel }}
                        </span>
                        <span> 题目数量: {{ item.questionCount }} </span>
                        <span>
                          批改时间: {{ formatTime(item.completedAt) }}
                        </span>
                      </a-space>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a @click="previewPaper(item)">预览</a>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-radio-group>
        </a-spin>

        <!-- 分页 -->
        <div v-if="paperTotal > 0" style="margin-top: 16px; text-align: center">
          <a-pagination
            v-model:current="paperPagination.current"
            v-model:page-size="paperPagination.pageSize"
            :total="paperTotal"
            :show-total="(total) => `共 ${total} 份试卷`"
            @change="loadPapers"
          />
        </div>

        <!-- 操作按钮 -->
        <div style="margin-top: 24px; text-align: right">
          <a-space>
            <a-button @click="handleBack">取消</a-button>
            <a-button
              type="primary"
              :disabled="!selectedPaperId"
              @click="nextStep"
            >
              下一步
              <RightOutlined />
            </a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 步骤2: 配置导入选项 -->
    <div v-if="currentStep === 1" class="step-content">
      <a-card title="配置导入选项" :bordered="false">
        <a-alert
          message="配置导入参数"
          description="根据需要调整导入配置，系统将根据配置自动处理题目导入。"
          type="info"
          show-icon
          style="margin-bottom: 24px"
        />

        <a-form
          :model="importConfig"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 14 }"
        >
          <!-- 质量阈值 -->
          <a-form-item label="OCR质量阈值" help="低于此阈值的题目将被跳过">
            <a-slider
              v-model:value="importConfig.qualityThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              :marks="{
                0: '0%',
                0.5: '50%',
                0.8: '80% (推荐)',
                1: '100%',
              }"
            />
            <div style="margin-top: 8px">
              当前阈值:
              <a-tag color="blue">
                {{ (importConfig.qualityThreshold * 100).toFixed(0) }}%
              </a-tag>
              <span style="margin-left: 8px; font-size: 12px; color: #8c8c8c">
                OCR置信度低于此值的题目将不会导入
              </span>
            </div>
          </a-form-item>

          <!-- 自动合并重复题 -->
          <a-form-item label="自动合并重复题">
            <a-switch
              v-model:checked="importConfig.autoMerge"
              checked-children="开启"
              un-checked-children="关闭"
            />
            <div style="margin-top: 8px; font-size: 12px; color: #8c8c8c">
              开启后，相似度超过 90% 的题目将自动合并，保留高质量版本
            </div>
          </a-form-item>

          <!-- 去重算法 -->
          <a-form-item label="去重算法">
            <a-radio-group v-model:value="importConfig.dedupeMethod">
              <a-radio value="vector">
                向量检索 (推荐)
                <a-tooltip title="使用 AI 向量嵌入进行语义去重，准确率高">
                  <QuestionCircleOutlined style="margin-left: 4px" />
                </a-tooltip>
              </a-radio>
              <a-radio value="text">
                文本相似度
                <a-tooltip title="基于编辑距离算法，速度快但准确率较低">
                  <QuestionCircleOutlined style="margin-left: 4px" />
                </a-tooltip>
              </a-radio>
              <a-radio value="none"> 不去重 </a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 导入范围 -->
          <a-form-item label="导入范围">
            <a-checkbox-group v-model:value="importConfig.includeTypes">
              <a-checkbox value="MULTIPLE_CHOICE">选择题</a-checkbox>
              <a-checkbox value="FILL_BLANK">填空题</a-checkbox>
              <a-checkbox value="SHORT_ANSWER">简答题</a-checkbox>
              <a-checkbox value="CALCULATION">计算题</a-checkbox>
            </a-checkbox-group>
          </a-form-item>

          <!-- 仅导入错题 -->
          <a-form-item label="仅导入错题">
            <a-switch
              v-model:checked="importConfig.onlyMistakes"
              checked-children="是"
              un-checked-children="否"
            />
            <div style="margin-top: 8px; font-size: 12px; color: #8c8c8c">
              仅导入学生答错的题目，适用于错题本场景
            </div>
          </a-form-item>

          <!-- 标签 -->
          <a-form-item label="添加标签">
            <a-select
              v-model:value="importConfig.tags"
              mode="tags"
              style="width: 100%"
              placeholder="输入标签后按回车添加"
              :max-tag-count="5"
            >
              <a-select-option value="期中考试">期中考试</a-select-option>
              <a-select-option value="期末考试">期末考试</a-select-option>
              <a-select-option value="月考">月考</a-select-option>
              <a-select-option value="模拟考">模拟考</a-select-option>
            </a-select>
          </a-form-item>

          <!-- 预估统计 -->
          <a-form-item label="预估统计" :wrapper-col="{ span: 18 }">
            <a-spin :spinning="loadingEstimate">
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="总题目数">
                  {{ estimateStats.totalQuestions }}
                </a-descriptions-item>
                <a-descriptions-item label="预计导入">
                  <span style="font-weight: 600; color: #52c41a">
                    {{ estimateStats.estimatedImport }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item label="低质量跳过">
                  <span style="color: #faad14">
                    {{ estimateStats.lowQuality }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item label="重复跳过">
                  <span style="color: #8c8c8c">
                    {{ estimateStats.duplicate }}
                  </span>
                </a-descriptions-item>
              </a-descriptions>
            </a-spin>
            <a-button
              type="link"
              size="small"
              style="margin-top: 8px"
              @click="loadEstimate"
            >
              <ReloadOutlined />
              重新估算
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 操作按钮 -->
        <div style="margin-top: 24px; text-align: right">
          <a-space>
            <a-button @click="previousStep">
              <LeftOutlined />
              上一步
            </a-button>
            <a-button type="primary" @click="nextStep">
              下一步
              <RightOutlined />
            </a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 步骤3: 确认并导入 -->
    <div v-if="currentStep === 2" class="step-content">
      <a-card title="确认并导入" :bordered="false">
        <!-- 导入前确认 -->
        <div v-if="!importing && !importResult" class="confirm-section">
          <a-alert
            message="请确认以下信息无误后开始导入"
            type="warning"
            show-icon
            style="margin-bottom: 24px"
          />

          <a-descriptions bordered :column="1">
            <a-descriptions-item label="试卷名称">
              {{ selectedPaper?.paperName }}
            </a-descriptions-item>
            <a-descriptions-item label="学科">
              <a-tag :color="getSubjectColor(selectedPaper?.subject)">
                {{ getSubjectText(selectedPaper?.subject) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="年级">
              {{ selectedPaper?.gradeLevel }}
            </a-descriptions-item>
            <a-descriptions-item label="题目总数">
              {{ estimateStats.totalQuestions }}
            </a-descriptions-item>
            <a-descriptions-item label="预计导入">
              <span style="font-size: 16px; font-weight: 600; color: #52c41a">
                {{ estimateStats.estimatedImport }} 道题
              </span>
            </a-descriptions-item>
            <a-descriptions-item label="质量阈值">
              {{ (importConfig.qualityThreshold * 100).toFixed(0) }}%
            </a-descriptions-item>
            <a-descriptions-item label="自动合并">
              {{ importConfig.autoMerge ? '是' : '否' }}
            </a-descriptions-item>
            <a-descriptions-item label="去重算法">
              {{ getDedupeMethodText(importConfig.dedupeMethod) }}
            </a-descriptions-item>
            <a-descriptions-item label="导入范围">
              <a-space>
                <a-tag
                  v-for="type in importConfig.includeTypes"
                  :key="type"
                  color="blue"
                >
                  {{ getQuestionTypeText(type) }}
                </a-tag>
              </a-space>
            </a-descriptions-item>
            <a-descriptions-item label="标签">
              <a-space>
                <a-tag
                  v-for="tag in importConfig.tags"
                  :key="tag"
                  color="green"
                >
                  {{ tag }}
                </a-tag>
                <span
                  v-if="importConfig.tags.length === 0"
                  style="color: #8c8c8c"
                >
                  无
                </span>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>

          <div style="margin-top: 24px; text-align: right">
            <a-space>
              <a-button @click="previousStep">
                <LeftOutlined />
                上一步
              </a-button>
              <a-button
                type="primary"
                size="large"
                :loading="importing"
                @click="startImport"
              >
                <CheckOutlined />
                开始导入
              </a-button>
            </a-space>
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="importing" class="importing-section">
          <a-result status="info" title="正在导入题目">
            <template #icon>
              <LoadingOutlined />
            </template>
            <template #subTitle>
              请稍候，系统正在处理题目并导入题库...
            </template>
            <template #extra>
              <a-progress
                :percent="importProgress"
                :status="importing ? 'active' : 'success'"
              />
              <div style="margin-top: 16px; color: #8c8c8c">
                {{ importStatusText }}
              </div>
            </template>
          </a-result>
        </div>

        <!-- 导入完成 -->
        <div v-if="!importing && importResult" class="result-section">
          <a-result
            :status="importResult.status === 'completed' ? 'success' : 'error'"
            :title="
              importResult.status === 'completed' ? '导入成功' : '导入失败'
            "
          >
            <template #subTitle>
              <div v-if="importResult.status === 'completed'">
                成功导入 {{ importResult.importedCount }} 道题目到题库
              </div>
              <div v-else>
                {{ importResult.errorLog }}
              </div>
            </template>

            <template #extra>
              <a-space>
                <a-button type="primary" @click="viewQuestionBank">
                  查看题库
                </a-button>
                <a-button @click="importAnother"> 导入其他试卷 </a-button>
                <a-button @click="handleBack"> 返回 </a-button>
              </a-space>
            </template>
          </a-result>

          <!-- 详细统计 -->
          <a-card
            v-if="importResult.status === 'completed'"
            title="导入详情"
            :bordered="false"
            style="margin-top: 24px"
          >
            <a-row :gutter="16">
              <a-col :span="6">
                <a-statistic
                  title="总题目数"
                  :value="importResult.totalQuestions"
                />
              </a-col>
              <a-col :span="6">
                <a-statistic
                  title="成功导入"
                  :value="importResult.importedCount"
                  :value-style="{ color: '#52c41a' }"
                />
              </a-col>
              <a-col :span="6">
                <a-statistic
                  title="重复跳过"
                  :value="importResult.duplicateCount"
                  :value-style="{ color: '#8c8c8c' }"
                />
              </a-col>
              <a-col :span="6">
                <a-statistic
                  title="失败"
                  :value="importResult.failedCount"
                  :value-style="{ color: '#ff4d4f' }"
                />
              </a-col>
            </a-row>

            <!-- 导入日志 -->
            <a-divider />
            <div style="margin-top: 16px">
              <div style="margin-bottom: 8px; font-weight: 600">导入日志</div>
              <a-timeline>
                <a-timeline-item color="green">
                  开始导入试卷: {{ selectedPaper?.paperName }}
                </a-timeline-item>
                <a-timeline-item color="blue">
                  质量过滤: 过滤掉
                  {{
                    importResult.totalQuestions -
                    importResult.importedCount -
                    importResult.duplicateCount
                  }}
                  道低质量题目
                </a-timeline-item>
                <a-timeline-item color="purple">
                  去重检测: 发现 {{ importResult.duplicateCount }} 道重复题目
                </a-timeline-item>
                <a-timeline-item color="green">
                  成功导入: {{ importResult.importedCount }} 道题目
                </a-timeline-item>
                <a-timeline-item color="green">
                  导入完成于: {{ formatTime(importResult.processedAt) }}
                </a-timeline-item>
              </a-timeline>
            </div>
          </a-card>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  ReloadOutlined,
  SearchOutlined,
  RightOutlined,
  LeftOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import axios from 'axios';
// PageHeader component removed - using plain div instead

// 类型定义
interface PaperItem {
  id: string;
  paperName: string;
  subject: string;
  gradeLevel: string;
  questionCount: number;
  completedAt: string;
}

interface ImportConfig {
  qualityThreshold: number;
  autoMerge: boolean;
  dedupeMethod: string;
  includeTypes: string[];
  onlyMistakes: boolean;
  tags: string[];
}

interface EstimateStats {
  totalQuestions: number;
  estimatedImport: number;
  lowQuality: number;
  duplicate: number;
}

interface ImportResult {
  id: string;
  status: string;
  totalQuestions: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  processedAt: string;
  errorLog?: string;
}

// Hooks
const router = useRouter();

// State
const loading = ref(false);
const loadingPapers = ref(false);
const loadingEstimate = ref(false);
const importing = ref(false);

const currentStep = ref(0);

// 步骤配置
const steps = [
  { title: '选择试卷' },
  { title: '配置选项' },
  { title: '确认导入' },
];

// 试卷相关
const papers = ref<PaperItem[]>([]);
const selectedPaperId = ref<string>('');
const paperFilters = reactive({
  subject: '',
  gradeLevel: '',
  keyword: '',
});
const paperPagination = reactive({
  current: 1,
  pageSize: 10,
});
const paperTotal = ref(0);

// 导入配置
const importConfig = reactive<ImportConfig>({
  qualityThreshold: 0.8,
  autoMerge: true,
  dedupeMethod: 'vector',
  includeTypes: [
    'MULTIPLE_CHOICE',
    'FILL_BLANK',
    'SHORT_ANSWER',
    'CALCULATION',
  ],
  onlyMistakes: false,
  tags: [],
});

// 估算统计
const estimateStats = reactive<EstimateStats>({
  totalQuestions: 0,
  estimatedImport: 0,
  lowQuality: 0,
  duplicate: 0,
});

// 导入结果
const importResult = ref<ImportResult | null>(null);
const importProgress = ref(0);
const importStatusText = ref('准备导入...');
const importId = ref<string>('');

// Computed
const selectedPaper = computed(() =>
  papers.value.find((p) => p.id === selectedPaperId.value),
);

// 加载试卷列表
async function loadPapers() {
  loadingPapers.value = true;
  try {
    const params = {
      ...paperFilters,
      status: 'COMPLETED',
      page: paperPagination.current,
      pageSize: paperPagination.pageSize,
    };

    const response = await axios.get('/api/education/papers', { params });

    papers.value = response.data.data.items || [];
    paperTotal.value = response.data.data.total || 0;
  } catch (error: any) {
    console.error('Failed to load papers:', error);
    message.error(error.response?.data?.message || '加载试卷列表失败');
  } finally {
    loadingPapers.value = false;
  }
}

// 加载估算统计
async function loadEstimate() {
  if (!selectedPaperId.value) return;

  loadingEstimate.value = true;
  try {
    const response = await axios.post(
      '/api/education/question-bank/import/estimate',
      {
        paperId: selectedPaperId.value,
        config: importConfig,
      },
    );

    Object.assign(estimateStats, response.data.data);
  } catch (error: any) {
    console.error('Failed to load estimate:', error);
    message.error(error.response?.data?.message || '加载估算失败');
  } finally {
    loadingEstimate.value = false;
  }
}

// 刷新数据
function refreshData() {
  if (currentStep.value === 0) {
    loadPapers();
  } else if (currentStep.value === 1) {
    loadEstimate();
  }
}

// 步骤导航
function nextStep() {
  if (currentStep.value === 0) {
    if (!selectedPaperId.value) {
      message.warning('请选择试卷');
      return;
    }
    loadEstimate();
  }
  currentStep.value++;
}

function previousStep() {
  currentStep.value--;
}

// 开始导入
async function startImport() {
  importing.value = true;
  importProgress.value = 0;
  importStatusText.value = '正在提交导入任务...';

  try {
    // 提交导入任务
    const response = await axios.post('/api/education/question-bank/import', {
      paperId: selectedPaperId.value,
      config: importConfig,
    });

    importId.value = response.data.data.id;
    importStatusText.value = '正在处理题目...';

    // 轮询导入状态
    await pollImportStatus();
  } catch (error: any) {
    console.error('Failed to start import:', error);
    message.error(error.response?.data?.message || '导入失败');
    importing.value = false;
  }
}

// 轮询导入状态
async function pollImportStatus() {
  const pollInterval = setInterval(async () => {
    try {
      const response = await axios.get(
        `/api/education/question-bank/import/${importId.value}/status`,
      );

      const result = response.data.data;

      // 更新进度
      if (result.totalQuestions > 0) {
        importProgress.value = Math.floor(
          ((result.importedCount + result.duplicateCount + result.failedCount) /
            result.totalQuestions) *
            100,
        );
      }

      // 更新状态文本
      importStatusText.value = `已处理 ${result.importedCount + result.duplicateCount + result.failedCount} / ${result.totalQuestions} 道题目`;

      // 检查是否完成
      if (result.status === 'completed' || result.status === 'failed') {
        clearInterval(pollInterval);
        importing.value = false;
        importProgress.value = 100;
        importResult.value = result;

        if (result.status === 'completed') {
          message.success('导入成功');
        } else {
          message.error('导入失败');
        }
      }
    } catch (error: any) {
      console.error('Failed to poll import status:', error);
      clearInterval(pollInterval);
      importing.value = false;
      message.error('获取导入状态失败');
    }
  }, 2000); // 每2秒轮询一次
}

// 预览试卷
function previewPaper(paper: PaperItem) {
  router.push(`/education/papers/${paper.id}`);
}

// 导入另一份试卷
function importAnother() {
  currentStep.value = 0;
  selectedPaperId.value = '';
  importResult.value = null;
  importProgress.value = 0;
  importId.value = '';
  loadPapers();
}

// 查看题库
function viewQuestionBank() {
  router.push('/education/question-bank');
}

// 返回
function handleBack() {
  router.back();
}

// 工具函数
function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    MATH: 'blue',
    CHINESE: 'red',
    ENGLISH: 'green',
    PHYSICS: 'purple',
    CHEMISTRY: 'orange',
  };
  return colors[subject] || 'default';
}

function getSubjectText(subject: string): string {
  const texts: Record<string, string> = {
    MATH: '数学',
    CHINESE: '语文',
    ENGLISH: '英语',
    PHYSICS: '物理',
    CHEMISTRY: '化学',
  };
  return texts[subject] || subject;
}

function getQuestionTypeText(type: string): string {
  const texts: Record<string, string> = {
    MULTIPLE_CHOICE: '选择题',
    FILL_BLANK: '填空题',
    SHORT_ANSWER: '简答题',
    CALCULATION: '计算题',
  };
  return texts[type] || type;
}

function getDedupeMethodText(method: string): string {
  const texts: Record<string, string> = {
    vector: '向量检索',
    text: '文本相似度',
    none: '不去重',
  };
  return texts[method] || method;
}

function formatTime(time: string): string {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
}

// 初始化
onMounted(() => {
  loadPapers();
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'QuestionBankImportPage',
});
</script>

<style scoped lang="less">
.question-bank-import-page {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100vh;

  .page-header {
    background: #fff;
    padding: 16px 24px;
    margin-bottom: 16px;
    border-radius: 4px;

    .breadcrumb-section {
      margin-bottom: 12px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.85);
        }
      }
    }
  }

  .steps-section {
    margin-bottom: 24px;
    padding: 24px;
    background: #fff;
    border-radius: 4px;
  }

  .step-content {
    min-height: 500px;

    .confirm-section,
    .importing-section,
    .result-section {
      padding: 24px;
    }
  }
}
</style>
