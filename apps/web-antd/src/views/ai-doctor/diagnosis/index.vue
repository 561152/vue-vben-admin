<script lang="ts" setup>
/**
 * 诊断中心
 * Phase 1: 核心菜单重组 - 合并试卷分析功能
 *
 * Tabs:
 * 1. 快速诊断 - 原有功能
 * 2. 试卷深度分析 - 从 AI 教师迁移
 * 3. 作业趋势分析 - 新增
 */
import { ref } from 'vue';
import {
  Card,
  Tabs,
  TabPane,
  Button,
  Input,
  Select,
  SelectOption,
  Table,
  Tag,
  Space,
  Empty,
  Statistic,
  Row,
  Col,
  Progress,
  message,
} from 'ant-design-vue';
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import MigrationNotice from '#/components/MigrationNotice.vue';

const route = useRoute();

// 当前 Tab（支持 URL 参数）
const activeTab = ref((route.query.tab as string) || 'quick');

// 快速诊断
const loading = ref(false);
const searchText = ref('');
const diagnosisList = ref<any[]>([]);

const columns = [
  { title: '诊断编号', dataIndex: 'id', key: 'id', width: 120 },
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
  { title: '诊断类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '诊断结果', dataIndex: 'result', key: 'result' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
];

// 试卷分析
const paperAnalysisData = ref({
  knowledgeCoverage: [
    { name: '数与代数', coverage: 0.85, color: '#52c41a' },
    { name: '图形与几何', coverage: 0.70, color: '#faad14' },
    { name: '统计与概率', coverage: 0.60, color: '#ff4d4f' },
  ],
  abilityRadar: [
    { dimension: '计算能力', score: 85 },
    { dimension: '概念理解', score: 75 },
    { dimension: '应用能力', score: 70 },
    { dimension: '推理能力', score: 80 },
  ],
});

// 作业趋势
const trendData = ref({
  accuracy: [
    { day: '周一', value: 75 },
    { day: '周二', value: 80 },
    { day: '周三', value: 78 },
    { day: '周四', value: 85 },
    { day: '周五', value: 82 },
  ],
  avgAccuracy: 80,
  avgTime: 25,
  completionRate: 0.92,
});

const handleSearch = () => {
  message.info('搜索功能开发中...');
};

const handleCreate = () => {
  message.info('创建诊断功能开发中...');
};

const handleAnalyzePaper = () => {
  message.info('试卷分析功能开发中...');
};
</script>

<template>
  <div class="diagnosis-container">
    <!-- 迁移提示 -->
    <MigrationNotice />

    <Card title="诊断中心" :bordered="false">
      <Tabs v-model:activeKey="activeTab">
        <!-- Tab 1: 快速诊断 -->
        <TabPane key="quick" tab="快速诊断">
          <div class="tab-header">
            <Space>
              <Input
                v-model:value="searchText"
                placeholder="搜索学生姓名"
                style="width: 200px"
                @press-enter="handleSearch"
              >
                <template #suffix>
                  <SearchOutlined />
                </template>
              </Input>
              <Button type="primary" @click="handleCreate">
                <template #icon><PlusOutlined /></template>
                新建诊断
              </Button>
            </Space>
          </div>

          <Table
            :columns="columns"
            :data-source="diagnosisList"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
            class="diagnosis-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'completed' ? 'green' : 'blue'">
                  {{ record.status === 'completed' ? '已完成' : '进行中' }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <a>查看</a>
                  <a>编辑</a>
                </Space>
              </template>
            </template>
            <template #emptyText>
              <div class="empty-placeholder">
                <p>暂无诊断记录</p>
                <p>点击"新建诊断"开始为学生进行学习诊断</p>
              </div>
            </template>
          </Table>
        </TabPane>

        <!-- Tab 2: 试卷深度分析 -->
        <TabPane key="paper" tab="试卷深度分析">
          <template #tab>
            <span><FileTextOutlined /> 试卷深度分析</span>
          </template>

          <div class="tab-header">
            <Button type="primary" @click="handleAnalyzePaper">
              <template #icon><PlusOutlined /></template>
              上传试卷分析
            </Button>
          </div>

          <!-- 知识点覆盖率 -->
          <Card title="知识点覆盖率" :bordered="false" class="section-card">
            <Row :gutter="16">
              <Col
                v-for="item in paperAnalysisData.knowledgeCoverage"
                :key="item.name"
                :xs="24"
                :sm="8"
              >
                <div class="coverage-item">
                  <div class="coverage-header">
                    <span class="coverage-name">{{ item.name }}</span>
                    <span class="coverage-value">{{
                      Math.round(item.coverage * 100)
                    }}%</span>
                  </div>
                  <Progress
                    :percent="Math.round(item.coverage * 100)"
                    :stroke-color="item.color"
                    :show-info="false"
                  />
                </div>
              </Col>
            </Row>
          </Card>

          <!-- 能力雷达图 -->
          <Card title="能力雷达图" :bordered="false" class="section-card">
            <Empty description="能力雷达图功能开发中..." />
          </Card>
        </TabPane>

        <!-- Tab 3: 作业趋势分析 -->
        <TabPane key="trend" tab="作业趋势">
          <template #tab>
            <span><BarChartOutlined /> 作业趋势分析</span>
          </template>

          <!-- 统计卡片 -->
          <Row :gutter="16" class="trend-stats">
            <Col :xs="8">
              <Card :bordered="false">
                <Statistic
                  title="平均正确率"
                  :value="trendData.avgAccuracy"
                  suffix="%"
                  :value-style="{ color: '#3f8600' }"
                />
              </Card>
            </Col>
            <Col :xs="8">
              <Card :bordered="false">
                <Statistic
                  title="平均用时"
                  :value="trendData.avgTime"
                  suffix="分钟"
                />
              </Card>
            </Col>
            <Col :xs="8">
              <Card :bordered="false">
                <Statistic
                  title="完成率"
                  :value="trendData.completionRate * 100"
                  suffix="%"
                  :precision="0"
                />
              </Card>
            </Col>
          </Row>

          <!-- 趋势图表 -->
          <Card title="最近7天准确率" :bordered="false" class="section-card">
            <Empty description="趋势图表功能开发中..." />
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.diagnosis-container {
  padding: 16px;
}

.tab-header {
  margin-bottom: 16px;
}

.diagnosis-table {
  margin-top: 16px;
}

.empty-placeholder {
  padding: 40px;
  color: #999;
  text-align: center;
}

.section-card {
  margin-top: 16px;
}

.coverage-item {
  padding: 12px 0;
}

.coverage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.coverage-name {
  font-weight: 500;
}

.coverage-value {
  color: #666;
}

.trend-stats {
  margin-bottom: 16px;
}
</style>
