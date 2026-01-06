<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Card,
  Table,
  Tag,
  Progress,
  Button,
  DatePicker,
  Space,
  message,
} from 'ant-design-vue';
import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import { getGradingHistory } from '#/api/ai';
import type { GradingHistoryItem } from '#/api/ai';

// 状态
const loading = ref(false);
const dataSource = ref<GradingHistoryItem[]>([]);
const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`,
});

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '批改时间',
    dataIndex: 'createdAt',
    width: 180,
  },
  {
    title: '题目数',
    dataIndex: 'questionCount',
    width: 80,
    align: 'center',
  },
  {
    title: '正确数',
    dataIndex: 'correctCount',
    width: 80,
    align: 'center',
  },
  {
    title: '正确率',
    dataIndex: 'accuracy',
    width: 200,
  },
  {
    title: '得分',
    dataIndex: 'totalScore',
    width: 120,
    align: 'center',
  },
  {
    title: '处理耗时',
    dataIndex: 'processingMs',
    width: 100,
    align: 'center',
  },
];

// 获取正确率颜色
const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 0.8) return '#52c41a';
  if (accuracy >= 0.6) return '#faad14';
  return '#ff4d4f';
};

// 格式化时间
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 加载数据
const loadData = async () => {
  loading.value = true;

  try {
    const res = await getGradingHistory({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });

    dataSource.value = res.items;
    pagination.value.total = res.total;
  } catch (error: any) {
    message.error(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadData();
};

// 刷新
const handleRefresh = () => {
  pagination.value.current = 1;
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <h2><HistoryOutlined /> 批改历史</h2>
      <p>查看作业批改的历史记录</p>
    </div>

    <Card :bordered="false">
      <!-- 工具栏 -->
      <div class="toolbar">
        <Space>
          <Button :icon="ReloadOutlined" @click="handleRefresh"> 刷新 </Button>
        </Space>
      </div>

      <!-- 数据表格 -->
      <Table
        :columns="columns"
        :data-source="dataSource"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatTime(record.createdAt) }}
          </template>
          <template v-if="column.dataIndex === 'questionCount'">
            <Tag color="blue">{{ record.questionCount }}</Tag>
          </template>
          <template v-if="column.dataIndex === 'correctCount'">
            <Tag color="green">{{ record.correctCount }}</Tag>
          </template>
          <template v-if="column.dataIndex === 'accuracy'">
            <Progress
              :percent="record.accuracy * 100"
              :stroke-color="getAccuracyColor(record.accuracy)"
              :format="(percent) => `${percent?.toFixed(1)}%`"
              size="small"
            />
          </template>
          <template v-if="column.dataIndex === 'totalScore'">
            <span class="score-text">
              {{ record.totalScore }} / {{ record.maxScore }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'processingMs'">
            <span class="time-text">{{ record.processingMs }}ms</span>
          </template>
        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <div class="empty-state">
            <HistoryOutlined class="empty-icon" />
            <p>暂无批改记录</p>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.history-page {
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

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.score-text {
  font-weight: 500;
  color: #1890ff;
}

.time-text {
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #999;
}

.empty-icon {
  margin-bottom: 16px;
  font-size: 48px;
}
</style>
