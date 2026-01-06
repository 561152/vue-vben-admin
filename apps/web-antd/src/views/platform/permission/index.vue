<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { Table, Form, Input, message, Card, Tag, Row, Col, Statistic, Button, Space } from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  appModule: {
    code: string;
    name: string;
  };
  createdAt: string;
}

const loading = ref(false);
const dataSource = ref<PermissionItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0, totalPages: 0 });
const filterForm = ref({
  code: '',
  name: '',
  module: '',
});

// Statistics
const stats = ref({
  total: 0,
  byModule: {} as Record<string, number>,
  byCategory: {} as Record<string, number>,
});

const columns = [
  {
    title: '权限代码',
    dataIndex: 'code',
    key: 'code',
    width: 250,
    ellipsis: true,
  },
  {
    title: '权限名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '所属模块',
    dataIndex: 'appModule',
    key: 'appModule',
    width: 150,
    customRender: ({ record }: { record: PermissionItem }) => {
      return record.appModule.name;
    }
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      const colors = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'red', 'volcano'];
      const color = colors[text.charCodeAt(0) % colors.length];
      return h(Tag, { color }, () => text);
    }
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 80,
    customRender: ({ text }: { text: boolean }) => {
      return h(Tag, { color: text ? 'green' : 'red' }, () => text ? '启用' : '禁用');
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

    if (filterForm.value.code) params.code = filterForm.value.code;
    if (filterForm.value.name) params.name = filterForm.value.name;
    if (filterForm.value.module) params.module = filterForm.value.module;

    const res = await requestClient.get<{
      data: PermissionItem[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>('/platform/permissions', { params });

    dataSource.value = res.data;
    pagination.value.total = res.total;
    pagination.value.current = res.page;
    pagination.value.pageSize = res.pageSize;
    pagination.value.totalPages = res.totalPages;

    // Calculate statistics
    calculateStats(res.data);
  } catch (e: any) {
    console.error(e);
    message.error(e.message || '获取权限列表失败');
  } finally {
    loading.value = false;
  }
}

function calculateStats(data: PermissionItem[]) {
  stats.value.total = pagination.value.total;

  // Count by module
  const byModule: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  data.forEach(item => {
    const moduleName = item.appModule.name;
    byModule[moduleName] = (byModule[moduleName] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  });

  stats.value.byModule = byModule;
  stats.value.byCategory = byCategory;
}

function handleSearch() {
  pagination.value.current = 1;
  fetchData();
}

function handleReset() {
  filterForm.value = {
    code: '',
    name: '',
    module: '',
  };
  pagination.value.current = 1;
  fetchData();
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-bold mb-4">权限管理</h2>

      <!-- Statistics Cards -->
      <Row :gutter="16" class="mb-4">
        <Col :span="6">
          <Card>
            <Statistic title="总权限数" :value="stats.total" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="应用模块数"
              :value="Object.keys(stats.byModule).length"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="权限分类数"
              :value="Object.keys(stats.byCategory).length"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="启用权限"
              :value="dataSource.filter(p => p.isActive).length"
              :value-style="{ color: '#3f8600' }"
            />
          </Card>
        </Col>
      </Row>

      <!-- Filter Form -->
      <Card class="mb-4">
        <Form layout="inline">
          <Form.Item label="权限代码">
            <Input
              v-model:value="filterForm.code"
              placeholder="如：PLATFORM"
              style="width: 200px"
              allowClear
            />
          </Form.Item>
          <Form.Item label="权限名称">
            <Input
              v-model:value="filterForm.name"
              placeholder="如：用户"
              style="width: 150px"
              allowClear
            />
          </Form.Item>
          <Form.Item label="分类">
            <Input
              v-model:value="filterForm.module"
              placeholder="如：USER"
              style="width: 150px"
              allowClear
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
      :scroll="{ x: 1200 }"
    />
  </div>
</template>
