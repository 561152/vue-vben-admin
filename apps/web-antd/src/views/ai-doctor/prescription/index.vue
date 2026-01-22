<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Button, Input, Table, Tag, Space, message } from 'ant-design-vue';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons-vue';

const loading = ref(false);
const searchText = ref('');
const prescriptionList = ref<any[]>([]);

const columns = [
  { title: '处方编号', dataIndex: 'id', key: 'id', width: 120 },
  { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 120 },
  { title: '诊断结果', dataIndex: 'diagnosis', key: 'diagnosis' },
  { title: '学习计划', dataIndex: 'plan', key: 'plan' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
];

const handleSearch = () => {
  message.info('搜索功能开发中...');
};
</script>

<template>
  <div class="prescription-container">
    <Card title="学习处方" :bordered="false">
      <template #extra>
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
      </template>

      <Table
        :columns="columns"
        :data-source="prescriptionList"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'active' ? 'green' : 'default'">
              {{ record.status === 'active' ? '执行中' : '已完成' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <a>查看详情</a>
              <a>调整计划</a>
            </Space>
          </template>
        </template>
        <template #emptyText>
          <div style="padding: 40px; text-align: center; color: #999">
            <FileTextOutlined style="font-size: 48px; margin-bottom: 16px" />
            <p>暂无学习处方</p>
            <p>完成学习诊断后，系统将自动生成个性化学习处方</p>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.prescription-container {
  padding: 16px;
}
</style>
