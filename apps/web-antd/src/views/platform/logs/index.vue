<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { Table, Button, Space, Form, Input, message, Select, Tag, DatePicker, Card, Statistic, Row, Col } from 'ant-design-vue';
import { requestClient } from '#/api/request';
import type { Dayjs } from 'dayjs';

interface AuditLogItem {
  id: string;
  tenantId?: string;
  userId?: string;
  username?: string;
  module: string;
  action: string;
  resource?: string;
  resourceId?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  ip?: string;
  userAgent?: string;
  status: string;
  errorMessage?: string;
  duration?: number;
  createdAt: string;
}

interface StatsData {
  total: number;
  byModule: Array<{ module: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

const loading = ref(false);
const dataSource = ref<AuditLogItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const statsData = ref<StatsData>({ total: 0, byModule: [], byAction: [], byStatus: [] });
const filterForm = ref({
  module: undefined,
  action: undefined,
  username: '',
  status: undefined,
  dateRange: undefined as [Dayjs, Dayjs] | undefined,
});

const columns = [
  {
    title: '时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    customRender: ({ text }: { text: string }) => {
      return new Date(text).toLocaleString('zh-CN');
    }
  },
  {
    title: '用户',
    dataIndex: 'username',
    key: 'username',
    width: 120,
  },
  {
    title: '模块',
    dataIndex: 'module',
    key: 'module',
    width: 100,
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const actionMap: Record<string, { color: string; label: string }> = {
        LOGIN: { color: 'blue', label: '登录' },
        LOGOUT: { color: 'default', label: '登出' },
        CREATE: { color: 'green', label: '创建' },
        UPDATE: { color: 'orange', label: '更新' },
        DELETE: { color: 'red', label: '删除' },
        EXPORT: { color: 'purple', label: '导出' },
        ASSIGN: { color: 'cyan', label: '分配' },
        VIEW: { color: 'blue', label: '查看' },
        OTHER: { color: 'default', label: '其他' },
      };
      const action = actionMap[text] || { color: 'default', label: text };
      return h(Tag, { color: action.color }, () => action.label);
    }
  },
  {
    title: '资源',
    dataIndex: 'resource',
    key: 'resource',
    width: 120,
    ellipsis: true,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 130,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    customRender: ({ text }: { text: string }) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        SUCCESS: { color: 'green', label: '成功' },
        FAILED: { color: 'red', label: '失败' },
        PARTIAL: { color: 'orange', label: '部分成功' },
      };
      const status = statusMap[text] || { color: 'default', label: text };
      return h(Tag, { color: status.color }, () => status.label);
    }
  },
  {
    title: '耗时(ms)',
    dataIndex: 'duration',
    key: 'duration',
    width: 90,
    customRender: ({ text }: { text: number | null }) => {
      return text !== null && text !== undefined ? text : '-';
    }
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };

    if (filterForm.value.module) params.module = filterForm.value.module;
    if (filterForm.value.action) params.action = filterForm.value.action;
    if (filterForm.value.username) params.username = filterForm.value.username;
    if (filterForm.value.status) params.status = filterForm.value.status;
    if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
      params.startDate = filterForm.value.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filterForm.value.dateRange[1].format('YYYY-MM-DD');
    }

    const res = await requestClient.get<{ data: AuditLogItem[]; total: number }>('/platform/audit-logs', {
      params
    });
    dataSource.value = res.data;
    pagination.value.total = res.total;
  } catch (e: any) {
    console.error(e);
    message.error(e.message || '获取审计日志失败');
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const params: any = {};
    if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
      params.startDate = filterForm.value.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filterForm.value.dateRange[1].format('YYYY-MM-DD');
    }

    const res = await requestClient.get<StatsData>('/platform/audit-logs/stats', { params });
    statsData.value = res;
  } catch (e: any) {
    console.error(e);
    message.error(e.message || '获取统计数据失败');
  }
}

function handleSearch() {
  pagination.value.current = 1;
  fetchData();
  fetchStats();
}

function handleReset() {
  filterForm.value = {
    module: undefined,
    action: undefined,
    username: '',
    status: undefined,
    dateRange: undefined,
  };
  pagination.value.current = 1;
  fetchData();
  fetchStats();
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchStats();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-bold mb-4">审计日志</h2>

      <!-- Statistics Cards -->
      <Row :gutter="16" class="mb-4">
        <Col :span="6">
          <Card>
            <Statistic title="总日志数" :value="statsData.total" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="成功操作"
              :value="statsData.byStatus.find(s => s.status === 'SUCCESS')?.count || 0"
              :value-style="{ color: '#3f8600' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="失败操作"
              :value="statsData.byStatus.find(s => s.status === 'FAILED')?.count || 0"
              :value-style="{ color: '#cf1322' }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="操作模块数"
              :value="statsData.byModule.length"
            />
          </Card>
        </Col>
      </Row>

      <!-- Filter Form -->
      <Card class="mb-4">
        <Form layout="inline">
          <Form.Item label="模块">
            <Input
              v-model:value="filterForm.module"
              placeholder="模块名称"
              style="width: 150px"
              allowClear
            />
          </Form.Item>
          <Form.Item label="操作">
            <Select
              v-model:value="filterForm.action"
              placeholder="选择操作"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="LOGIN">登录</Select.Option>
              <Select.Option value="LOGOUT">登出</Select.Option>
              <Select.Option value="CREATE">创建</Select.Option>
              <Select.Option value="UPDATE">更新</Select.Option>
              <Select.Option value="DELETE">删除</Select.Option>
              <Select.Option value="EXPORT">导出</Select.Option>
              <Select.Option value="ASSIGN">分配</Select.Option>
              <Select.Option value="VIEW">查看</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="用户">
            <Input
              v-model:value="filterForm.username"
              placeholder="用户名"
              style="width: 150px"
              allowClear
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              v-model:value="filterForm.status"
              placeholder="选择状态"
              style="width: 120px"
              allowClear
            >
              <Select.Option value="SUCCESS">成功</Select.Option>
              <Select.Option value="FAILED">失败</Select.Option>
              <Select.Option value="PARTIAL">部分成功</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="日期范围">
            <DatePicker.RangePicker
              v-model:value="filterForm.dateRange"
              style="width: 260px"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" @click="handleSearch">查询</Button>
              <Button @click="handleReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
      :scroll="{ x: 1400 }"
    />
  </div>
</template>
