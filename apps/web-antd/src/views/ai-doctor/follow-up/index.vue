<script lang="ts" setup>
/**
 * 复诊追踪
 * Phase 1: 核心菜单重组 - 合并错题本+错题审核
 *
 * Tabs:
 * 1. 复诊记录 - 原有功能
 * 2. 错题本 - 从 AI 教师迁移
 * 3. 错题审核 - 从 AI 教师迁移（教师专用）
 */
import { ref } from 'vue';
import {
  Card,
  Tabs,
  TabPane,
  Table,
  Tag,
  Space,
  Input,
  DatePicker,
  Button,
  Tree,
  Badge,
  Popconfirm,
  message,
} from 'ant-design-vue';
import {
  SearchOutlined,
  CalendarOutlined,
  BookOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '#/store';
import MigrationNotice from '#/components/MigrationNotice.vue';

const route = useRoute();
const userStore = useUserStore();

// 当前 Tab（支持 URL 参数）
const activeTab = ref((route.query.tab as string) || 'records');

// 复诊记录
const loading = ref(false);
const searchText = ref('');
const followUpList = ref<any[]>([]);

const recordColumns = [
  { title: '追踪编号', dataIndex: 'id', key: 'id', width: 120 },
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
  { title: '关联处方', dataIndex: 'prescriptionId', key: 'prescriptionId', width: 120 },
  { title: '追踪内容', dataIndex: 'content', key: 'content' },
  { title: '下次复诊', dataIndex: 'nextDate', key: 'nextDate', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 },
];

// 错题本
const mistakeTreeData = ref([
  {
    title: '数与代数',
    key: 'algebra',
    children: [
      { title: '分数运算（3题）', key: 'fraction', isLeaf: true },
      { title: '方程求解（2题）', key: 'equation', isLeaf: true },
    ],
  },
  {
    title: '图形与几何',
    key: 'geometry',
    children: [
      { title: '三角形（5题）', key: 'triangle', isLeaf: true },
    ],
  },
]);

const selectedMistakeKeys = ref<string[]>([]);

// 反复错题
const repeatedMistakes = ref([
  { id: '1', questionContent: '小明有5个苹果，吃掉2个，还剩几个？', errorCount: 3 },
  { id: '2', questionContent: '计算：3/4 + 1/2 = ?', errorCount: 2 },
]);

// 错题审核（教师专用）
const isTeacher = userStore.userInfo?.roles?.some((r: any) => r.code === 'LMS_TEACHER') || false;

const reviewColumns = [
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
  { title: '题目内容', dataIndex: 'questionContent', key: 'questionContent' },
  { title: '标记时间', dataIndex: 'markedAt', key: 'markedAt', width: 180 },
  { title: '状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 100 },
  { title: '操作', key: 'action', width: 200 },
];

const reviewList = ref<any[]>([]);

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    completed: 'green',
    overdue: 'red',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待复诊',
    completed: '已完成',
    overdue: '已逾期',
  };
  return texts[status] || status;
};

const getReviewStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
  };
  return colors[status] || 'default';
};

const getReviewStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return texts[status] || status;
};

const handleRetryMistake = (id: string) => {
  message.info(`重做错题 ${id}（功能开发中）`);
};

const handleExportMistakes = () => {
  if (selectedMistakeKeys.value.length === 0) {
    message.warning('请先选择要导出的错题');
    return;
  }
  message.info('导出打印功能开发中...');
};

const handleApproveReview = (id: string) => {
  message.success(`已通过审核 ${id}`);
};

const handleRejectReview = (id: string) => {
  message.success(`已拒绝审核 ${id}`);
};
</script>

<template>
  <div class="follow-up-container">
    <!-- 迁移提示 -->
    <MigrationNotice />

    <Card title="复诊追踪" :bordered="false">
      <Tabs v-model:activeKey="activeTab">
        <!-- Tab 1: 复诊记录 -->
        <TabPane key="records" tab="复诊记录">
          <div class="tab-header">
            <Space>
              <Input
                v-model:value="searchText"
                placeholder="搜索学生姓名"
                style="width: 180px"
              >
                <template #suffix>
                  <SearchOutlined />
                </template>
              </Input>
              <DatePicker placeholder="选择日期" style="width: 150px" />
            </Space>
          </div>

          <Table
            :columns="recordColumns"
            :data-source="followUpList"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <a>查看</a>
                  <a>记录</a>
                </Space>
              </template>
            </template>
            <template #emptyText>
              <div class="empty-placeholder">
                <CalendarOutlined style="margin-bottom: 16px; font-size: 48px" />
                <p>暂无复诊记录</p>
                <p>学生完成学习处方后，系统将自动创建复诊追踪计划</p>
              </div>
            </template>
          </Table>
        </TabPane>

        <!-- Tab 2: 错题本 -->
        <TabPane key="mistakes" tab="错题本">
          <template #tab>
            <span><BookOutlined /> 错题本</span>
          </template>

          <div class="tab-header">
            <Button type="primary" @click="handleExportMistakes">
              <template #icon><PrinterOutlined /></template>
              导出打印
            </Button>
          </div>

          <Card title="按知识点分类" :bordered="false" class="mistakes-card">
            <Tree
              v-model:selectedKeys="selectedMistakeKeys"
              :tree-data="mistakeTreeData"
              checkable
              :default-expand-all="true"
            />
          </Card>

          <Card title="反复错题" :bordered="false" class="repeated-card">
            <div v-for="item in repeatedMistakes" :key="item.id" class="mistake-item">
              <div class="mistake-content">
                <Tag color="red">已错{{ item.errorCount }}次</Tag>
                {{ item.questionContent }}
              </div>
              <Button type="link" @click="handleRetryMistake(item.id)">
                重做
              </Button>
            </div>
          </Card>
        </TabPane>

        <!-- Tab 3: 错题审核（教师专用） -->
        <TabPane v-if="isTeacher" key="review" tab="错题审核">
          <template #tab>
            <span>
              <CheckCircleOutlined /> 错题审核
              <Badge :count="reviewList.length" :offset="[10, 0]" />
            </span>
          </template>

          <Table
            :columns="reviewColumns"
            :data-source="reviewList"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'reviewStatus'">
                <Tag :color="getReviewStatusColor(record.reviewStatus)">
                  {{ getReviewStatusText(record.reviewStatus) }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <a>查看</a>
                  <Popconfirm
                    title="确认通过此错题标记？"
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="handleApproveReview(record.id)"
                  >
                    <a>通过</a>
                  </Popconfirm>
                  <Popconfirm
                    title="确认拒绝此错题标记？"
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="handleRejectReview(record.id)"
                  >
                    <a style="color: #ff4d4f">拒绝</a>
                  </Popconfirm>
                </Space>
              </template>
            </template>
            <template #emptyText>
              <div class="empty-placeholder">
                <p>暂无待审核的错题</p>
              </div>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.follow-up-container {
  padding: 16px;
}

.tab-header {
  margin-bottom: 16px;
}

.empty-placeholder {
  padding: 40px;
  color: #999;
  text-align: center;
}

.mistakes-card,
.repeated-card {
  margin-top: 16px;
}

.mistake-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 8px;
}

.mistake-content {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
