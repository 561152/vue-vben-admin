<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Input, Button, Select } from 'ant-design-vue';
import {
  SearchOutlined,
  FilePdfOutlined,
  MailOutlined,
} from '@ant-design/icons-vue';

const loading = ref(false);
const searchText = ref('');
const reportList = ref<any[]>([]);

const columns = [
  { title: '报告编号', dataIndex: 'id', key: 'id', width: 120 },
  {
    title: '学生姓名',
    dataIndex: 'studentName',
    key: 'studentName',
    width: 120,
  },
  { title: '报告类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '报告周期', dataIndex: 'period', key: 'period', width: 150 },
  { title: '生成时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200 },
];

const reportTypes = [
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'term', label: '学期报告' },
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'default',
    generated: 'blue',
    sent: 'green',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    generated: '已生成',
    sent: '已发送',
  };
  return texts[status] || status;
};
</script>

<template>
  <div class="parent-report-container">
    <Card title="家长报告" :bordered="false">
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
          <Select
            placeholder="报告类型"
            style="width: 120px"
            :options="reportTypes"
            allow-clear
          />
          <Button type="primary"> 生成报告 </Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="reportList"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag>
              {{
                reportTypes.find((t) => t.value === record.type)?.label ||
                record.type
              }}
            </Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <a><FilePdfOutlined /> 预览</a>
              <a><FilePdfOutlined /> 下载</a>
              <a><MailOutlined /> 发送</a>
            </Space>
          </template>
        </template>
        <template #emptyText>
          <div style="padding: 40px; color: #999; text-align: center">
            <FilePdfOutlined style="margin-bottom: 16px; font-size: 48px" />
            <p>暂无家长报告</p>
            <p>点击"生成报告"为学生创建学习情况报告</p>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.parent-report-container {
  padding: 16px;
}
</style>
