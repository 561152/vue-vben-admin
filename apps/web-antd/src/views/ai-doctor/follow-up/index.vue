<script lang="ts" setup>
import { ref } from 'vue';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  DatePicker,
  Button,
} from 'ant-design-vue';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons-vue';

const loading = ref(false);
const searchText = ref('');
const followUpList = ref<any[]>([]);

const columns = [
  { title: '追踪编号', dataIndex: 'id', key: 'id', width: 120 },
  {
    title: '学生姓名',
    dataIndex: 'studentName',
    key: 'studentName',
    width: 120,
  },
  {
    title: '关联处方',
    dataIndex: 'prescriptionId',
    key: 'prescriptionId',
    width: 120,
  },
  { title: '追踪内容', dataIndex: 'content', key: 'content' },
  { title: '下次复诊', dataIndex: 'nextDate', key: 'nextDate', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 },
];

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
</script>

<template>
  <div class="follow-up-container">
    <Card title="复诊追踪" :bordered="false">
      <template #extra>
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
      </template>

      <Table
        :columns="columns"
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
          <div style="padding: 40px; color: #999; text-align: center">
            <CalendarOutlined style=" margin-bottom: 16px;font-size: 48px" />
            <p>暂无复诊记录</p>
            <p>学生完成学习处方后，系统将自动创建复诊追踪计划</p>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.follow-up-container {
  padding: 16px;
}
</style>
