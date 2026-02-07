<template>
  <div class="stage-reports-page">
    <!-- 页面标题 -->
    <Card class="mb-4">
      <template #title>
        <Space>
          <FileTextOutlined />
          阶段报告
        </Space>
      </template>
      <template #extra>
        <Space>
          <Button @click="showGenerateModal">
            <PlusOutlined /> 生成新报告
          </Button>
        </Space>
      </template>

      <p class="text-gray-500">
        查看学期、月度或自定义时间范围的学习报告，全面了解学习进展
      </p>
    </Card>

    <!-- 报告生成器 -->
    <Modal
      v-model:open="generateModalVisible"
      title="生成阶段报告"
      @ok="handleGenerate"
      @cancel="generateModalVisible = false"
      :confirm-loading="generating"
    >
      <Form :label-col="{ span: 6 }">
        <FormItem label="报告类型">
          <RadioGroup v-model:value="reportForm.type">
            <RadioButton value="MONTHLY">月度报告</RadioButton>
            <RadioButton value="SEMESTER">学期报告</RadioButton>
            <RadioButton value="CUSTOM">自定义</RadioButton>
          </RadioGroup>
        </FormItem>

        <template v-if="reportForm.type === 'MONTHLY'">
          <FormItem label="选择年月">
            <DatePicker
              v-model:value="reportForm.monthDate"
              picker="month"
              format="YYYY-MM"
              placeholder="请选择年月"
            />
          </FormItem>
        </template>

        <template v-else-if="reportForm.type === 'SEMESTER'">
          <FormItem label="选择学年">
            <Select v-model:value="reportForm.year" placeholder="请选择学年">
              <SelectOption :value="2023">2023-2024</SelectOption>
              <SelectOption :value="2024">2024-2025</SelectOption>
              <SelectOption :value="2025">2025-2026</SelectOption>
              <SelectOption :value="2026">2026-2027</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="选择学期">
            <RadioGroup v-model:value="reportForm.semester">
              <Radio :value="1">第一学期（9月-1月）</Radio>
              <Radio :value="2">第二学期（2月-7月）</Radio>
            </RadioGroup>
          </FormItem>
        </template>

        <template v-else-if="reportForm.type === 'CUSTOM'">
          <FormItem label="开始日期">
            <DatePicker
              v-model:value="reportForm.startDate"
              format="YYYY-MM-DD"
              placeholder="请选择开始日期"
            />
          </FormItem>
          <FormItem label="结束日期">
            <DatePicker
              v-model:value="reportForm.endDate"
              format="YYYY-MM-DD"
              placeholder="请选择结束日期"
            />
          </FormItem>
        </template>
      </Form>
    </Modal>

    <!-- 报告内容展示 -->
    <div v-if="currentReport" class="report-content">
      <!-- 报告头部 -->
      <Card class="mb-4">
        <Row :gutter="16" align="middle">
          <Col :span="18">
            <Space direction="vertical" size="small">
              <h2 class="mb-0">
                {{ getReportTitle(currentReport.reportType) }}
              </h2>
              <Space>
                <CalendarOutlined />
                <span>
                  {{ formatDate(currentReport.period.startDate) }} -
                  {{ formatDate(currentReport.period.endDate) }}
                </span>
                <Tag color="blue">{{ currentReport.period.days }} 天</Tag>
              </Space>
            </Space>
          </Col>
          <Col :span="6" class="text-right">
            <Space>
              <Button @click="handleDownloadPDF">
                <DownloadOutlined /> 下载 PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <!-- 总结卡片 -->
      <Card title="📋 学习总结" class="mb-4">
        <List :data-source="currentReport.summary">
          <template #renderItem="{ item }">
            <ListItem>
              <CheckCircleOutlined class="mr-2 text-green-500" />
              {{ item }}
            </ListItem>
          </template>
        </List>
      </Card>

      <!-- 数据统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card>
            <Statistic
              title="批改次数"
              :value="currentReport.gradingStats.totalCount"
              prefix="📝"
            >
              <template #suffix>
                <div class="text-sm text-gray-500">
                  平均准确率 {{ currentReport.gradingStats.averageAccuracy }}%
                </div>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="8">
          <Card>
            <Statistic
              title="学习时长"
              :value="
                formatStudyTime(currentReport.studyTimeStats.totalMinutes)
              "
            >
              <template #prefix>⏱️</template>
              <template #suffix>
                <div class="text-sm text-gray-500">
                  打卡 {{ currentReport.studyTimeStats.studyDays }} 天
                </div>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="8">
          <Card>
            <Statistic
              title="完成处方"
              :value="currentReport.prescriptionStats.completedCount"
              :suffix="`/ ${currentReport.prescriptionStats.totalCount}`"
              prefix="💊"
            >
              <template #suffix>
                <div class="text-sm text-gray-500">
                  完成率 {{ currentReport.prescriptionStats.completionRate }}%
                </div>
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- 图表展示 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="📈 准确率趋势">
            <div ref="accuracyChartRef" style="height: 300px"></div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="📊 学习时长">
            <div ref="studyTimeChartRef" style="height: 300px"></div>
          </Card>
        </Col>
      </Row>

      <Row :gutter="16" class="mb-4">
        <Col :span="12">
          <Card title="🎯 能力雷达图">
            <div
              v-if="currentReport.diagnosisStats.abilityRadar.length > 0"
              ref="abilityRadarRef"
              style="height: 300px"
            ></div>
            <Empty v-else description="暂无诊断数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card title="❌ 错题分布">
            <div
              v-if="currentReport.wrongQuestionStats.totalCount > 0"
              ref="wrongQuestionChartRef"
              style="height: 300px"
            ></div>
            <Empty v-else description="暂无错题数据" />
          </Card>
        </Col>
      </Row>

      <!-- 成就展示 -->
      <Card
        title="🏆 获得成就"
        class="mb-4"
        v-if="currentReport.achievementStats.totalCount > 0"
      >
        <Row :gutter="16">
          <Col
            v-for="achievement in currentReport.achievementStats
              .recentAchievements"
            :key="achievement.id"
            :span="8"
          >
            <Card hoverable class="achievement-card">
              <div class="achievement-icon">{{ achievement.icon || '🏆' }}</div>
              <h4>{{ achievement.name }}</h4>
              <p class="text-gray-500">
                {{ formatDate(achievement.grantedAt) }}
              </p>
            </Card>
          </Col>
        </Row>
      </Card>

      <!-- 改进建议 -->
      <Card title="💡 改进建议" class="mb-4">
        <List :data-source="currentReport.suggestions">
          <template #renderItem="{ item }">
            <ListItem>
              <BulbOutlined class="mr-2 text-yellow-500" />
              {{ item }}
            </ListItem>
          </template>
        </List>
      </Card>
    </div>

    <!-- 空状态 -->
    <Empty
      v-else
      description="点击生成新报告按钮创建学习报告"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch } from 'vue';
import axios from 'axios';
import * as echarts from 'echarts';
import dayjs, { Dayjs } from 'dayjs';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  List,
  ListItem,
  Tag,
  Empty,
  Modal,
  Form,
  FormItem,
  RadioGroup,
  RadioButton,
  Radio,
  DatePicker,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import {
  FileTextOutlined,
  PlusOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue';

// 数据定义
const generateModalVisible = ref(false);
const generating = ref(false);
const currentReport = ref<any>(null);

// 图表引用
const accuracyChartRef = ref<HTMLElement | null>(null);
const studyTimeChartRef = ref<HTMLElement | null>(null);
const abilityRadarRef = ref<HTMLElement | null>(null);
const wrongQuestionChartRef = ref<HTMLElement | null>(null);

// 报告表单
const reportForm = reactive<{
  type: 'MONTHLY' | 'SEMESTER' | 'CUSTOM';
  monthDate: Dayjs | null;
  year: number;
  semester: number;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}>({
  type: 'MONTHLY',
  monthDate: dayjs(),
  year: 2026,
  semester: 1,
  startDate: dayjs().subtract(30, 'day'),
  endDate: dayjs(),
});

// 显示生成弹窗
const showGenerateModal = () => {
  generateModalVisible.value = true;
};

// 生成报告
const handleGenerate = async () => {
  try {
    generating.value = true;

    let apiUrl = '';
    let requestData: any = {
      studentId: '1', // TODO: 从用户状态获取
    };

    if (reportForm.type === 'MONTHLY') {
      apiUrl = '/api/lms/growth-profile/reports/generate/monthly';
      requestData.year = reportForm.monthDate?.year();
      requestData.month = reportForm.monthDate?.month() + 1;
    } else if (reportForm.type === 'SEMESTER') {
      apiUrl = '/api/lms/growth-profile/reports/generate/semester';
      requestData.year = reportForm.year;
      requestData.semester = reportForm.semester;
    } else {
      apiUrl = '/api/lms/growth-profile/reports/generate/custom';
      requestData.startDate = reportForm.startDate?.format('YYYY-MM-DD');
      requestData.endDate = reportForm.endDate?.format('YYYY-MM-DD');
    }

    const response = await axios.post(apiUrl, requestData);
    currentReport.value = response.data;

    message.success('报告生成成功');
    generateModalVisible.value = false;

    // 等待 DOM 更新后渲染图表
    await nextTick();
    renderCharts();
  } catch (error: any) {
    console.error('生成报告失败:', error);
    message.error(error.response?.data?.message || '生成报告失败');
  } finally {
    generating.value = false;
  }
};

// 渲染图表
const renderCharts = () => {
  if (!currentReport.value) return;

  // 准确率趋势图
  if (accuracyChartRef.value) {
    const chart = echarts.init(accuracyChartRef.value);
    const data = currentReport.value.gradingStats.accuracyTrend;
    chart.setOption({
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: data.map((item: any) => dayjs(item.date).format('MM-DD')),
      },
      yAxis: {
        type: 'value',
        name: '准确率 (%)',
        max: 100,
      },
      series: [
        {
          name: '准确率',
          type: 'line',
          data: data.map((item: any) => item.value),
          smooth: true,
          itemStyle: { color: '#1890ff' },
        },
      ],
    });
  }

  // 学习时长柱状图
  if (studyTimeChartRef.value) {
    const chart = echarts.init(studyTimeChartRef.value);
    const dailyMinutes = currentReport.value.studyTimeStats.dailyMinutes;
    const dates = Object.keys(dailyMinutes).sort();
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value;
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          return `${params[0].name}<br/>${hours}小时${minutes}分钟`;
        },
      },
      xAxis: {
        type: 'category',
        data: dates.map((date) => dayjs(date).format('MM-DD')),
      },
      yAxis: {
        type: 'value',
        name: '时长 (分钟)',
      },
      series: [
        {
          name: '学习时长',
          type: 'bar',
          data: dates.map((date) => dailyMinutes[date]),
          itemStyle: { color: '#52c41a' },
        },
      ],
    });
  }

  // 能力雷达图
  if (
    abilityRadarRef.value &&
    currentReport.value.diagnosisStats.abilityRadar.length > 0
  ) {
    const chart = echarts.init(abilityRadarRef.value);
    const abilityData = currentReport.value.diagnosisStats.abilityRadar;
    chart.setOption({
      radar: {
        indicator: abilityData.map((item: any) => ({
          name: item.ability,
          max: 100,
        })),
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: abilityData.map((item: any) => item.score),
              name: '能力评分',
              itemStyle: { color: '#fa8c16' },
            },
          ],
        },
      ],
    });
  }

  // 错题分布饼图
  if (
    wrongQuestionChartRef.value &&
    currentReport.value.wrongQuestionStats.totalCount > 0
  ) {
    const chart = echarts.init(wrongQuestionChartRef.value);
    const typeDistribution =
      currentReport.value.wrongQuestionStats.typeDistribution;
    const data = Object.entries(typeDistribution).map(([type, count]) => ({
      name: getQuestionTypeLabel(type),
      value: count,
    }));
    chart.setOption({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    });
  }
};

// 监听报告变化，重新渲染图表
watch(currentReport, async (newValue) => {
  if (newValue) {
    await nextTick();
    renderCharts();
  }
});

// 下载 PDF
const handleDownloadPDF = () => {
  message.info('PDF 导出功能开发中...');
  // TODO: 实现 PDF 导出
};

// 工具函数
const getReportTitle = (type: string): string => {
  const titles: Record<string, string> = {
    MONTHLY: '月度学习报告',
    SEMESTER: '学期学习报告',
    CUSTOM: '学习报告',
  };
  return titles[type] || '学习报告';
};

const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY年MM月DD日');
};

const formatStudyTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CHOICE: '选择题',
    FILL_BLANK: '填空题',
    TRUE_FALSE: '判断题',
    CALCULATION: '计算题',
    SUBJECTIVE: '主观题',
    UNKNOWN: '未知',
  };
  return labels[type] || type;
};
</script>

<style scoped lang="scss">
.stage-reports-page {
  padding: 24px;
}

.report-content {
  h2 {
    margin-bottom: 0;
    font-size: 24px;
    font-weight: 600;
  }
}

.achievement-card {
  height: 100%;
  text-align: center;

  .achievement-icon {
    margin-bottom: 12px;
    font-size: 48px;
  }

  h4 {
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
