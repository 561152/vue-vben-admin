<script lang="ts" setup>
import { ref } from 'vue';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Space,
  message,
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue';

const loading = ref(false);
const searchText = ref('');
const diagnosisList = ref<any[]>([]);

const columns = [
  { title: '诊断编号', dataIndex: 'id', key: 'id', width: 120 },
  {
    title: '学生姓名',
    dataIndex: 'studentName',
    key: 'studentName',
    width: 120,
  },
  { title: '诊断类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '诊断结果', dataIndex: 'result', key: 'result' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
];

const handleSearch = () => {
  message.info('搜索功能开发中...');
};

const handleCreate = () => {
  message.info('创建诊断功能开发中...');
};
</script>

<template>
  <div class="diagnosis-container">
    <Card title="诊断中心" :bordered="false">
      <template #extra>
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
      </template>

      <Table
        :columns="columns"
        :data-source="diagnosisList"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
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
          <div style="padding: 40px; color: #999; text-align: center">
            <p>暂无诊断记录</p>
            <p>点击"新建诊断"开始为学生进行学习诊断</p>
          </div>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.diagnosis-container {
  padding: 16px;
}
</style>
