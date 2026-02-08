<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import {
  Table,
  Button,
  Space,
  Card,
  Tag,
  Popconfirm,
  Input,
  Select,
  Drawer,
} from 'ant-design-vue';
import { BarChartOutlined, SendOutlined } from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

const router = useRouter();

// ==================== 类型定义 ====================

interface EmployeeTask {
  id: number;
  tenantId: number;
  campaignId: number | null;
  wecomUserId: string;
  wecomUserName?: string;
  taskType: string;
  targetCount: number;
  content: any;
  status: string;
  notifiedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  successCount: number;
  failCount: number;
  resultData: any;
  createdAt: string;
  updatedAt: string;
}

interface QueryParams {
  page: number;
  pageSize: number;
  wecomUserId?: string;
  taskType?: string;
  status?: string;
}

// ==================== 状态 ====================

const loading = ref(false);
const dataSource = ref<EmployeeTask[]>([]);
const total = ref(0);
const queryParams = ref<QueryParams>({
  page: 1,
  pageSize: 20,
});

const detailVisible = ref(false);
const detailTask = ref<EmployeeTask | null>(null);

// ==================== 选项 ====================

const taskTypeOptions = [
  { value: 'MASS_SEND', label: '群发消息', color: 'blue' },
  { value: 'MOMENT_PUBLISH', label: '朋友圈发布', color: 'green' },
  { value: 'FOLLOW_UP', label: '跟进任务', color: 'orange' },
  { value: 'SURVEY', label: '问卷调查', color: 'purple' },
];

const statusOptions = [
  { value: 'PENDING', label: '待处理', color: 'default' },
  { value: 'NOTIFIED', label: '已通知', color: 'processing' },
  { value: 'IN_PROGRESS', label: '进行中', color: 'processing' },
  { value: 'COMPLETED', label: '已完成', color: 'success' },
  { value: 'EXPIRED', label: '已过期', color: 'error' },
  { value: 'CANCELLED', label: '已取消', color: 'default' },
];

const findOption = (
  options: Array<{ value: string; label: string; color: string }>,
  value: string,
) => options.find((o) => o.value === value);

// ==================== 表格列 ====================

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  {
    title: '员工',
    key: 'employee',
    width: 150,
    customRender: ({ record }: { record: EmployeeTask }) =>
      record.wecomUserName || record.wecomUserId,
  },
  {
    title: '任务类型',
    dataIndex: 'taskType',
    key: 'taskType',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      const opt = findOption(taskTypeOptions, text);
      return h(
        Tag,
        { color: opt?.color || 'default' },
        () => opt?.label || text,
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = findOption(statusOptions, text);
      return h(
        Tag,
        { color: opt?.color || 'default' },
        () => opt?.label || text,
      );
    },
  },
  { title: '目标数', dataIndex: 'targetCount', key: 'targetCount', width: 80 },
  {
    title: '成功数',
    dataIndex: 'successCount',
    key: 'successCount',
    width: 80,
  },
  { title: '失败数', dataIndex: 'failCount', key: 'failCount', width: 80 },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '完成时间',
    dataIndex: 'completedAt',
    key: 'completedAt',
    width: 180,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

// ==================== 数据加载 ====================

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: queryParams.value.page,
      pageSize: queryParams.value.pageSize,
    };
    if (queryParams.value.wecomUserId) {
      params.wecomUserId = queryParams.value.wecomUserId;
    }
    if (queryParams.value.taskType) {
      params.taskType = queryParams.value.taskType;
    }
    if (queryParams.value.status) {
      params.status = queryParams.value.status;
    }

    const res = await requestClient.get<{
      items: EmployeeTask[];
      total: number;
    }>('/operations/employee-task', { params });

    dataSource.value = res.items || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pagination: any) {
  queryParams.value.page = pagination.current;
  queryParams.value.pageSize = pagination.pageSize;
  fetchData();
}

// ==================== 操作 ====================

function showDetail(record: EmployeeTask) {
  detailTask.value = record;
  detailVisible.value = true;
}

async function dispatchTask(id: number) {
  try {
    await requestClient.post(`/operations/employee-task/${id}/dispatch`);
    fetchData();
  } catch (error) {
    console.error('Failed to dispatch task:', error);
  }
}

async function cancelTask(id: number) {
  try {
    await requestClient.delete(`/operations/employee-task/${id}`);
    fetchData();
  } catch (error) {
    console.error('Failed to cancel task:', error);
  }
}

function goToStatistics() {
  router.push('/operations/employee-task/statistics');
}

onMounted(fetchData);
</script>

<template>
  <div class="p-5">
    <Card title="员工任务管理">
      <template #extra>
        <Space>
          <Button @click="goToStatistics">
            <template #icon><BarChartOutlined /></template>
            统计分析
          </Button>
        </Space>
      </template>

      <!-- 筛选区 -->
      <div class="mb-4 flex gap-4">
        <Input
          v-model:value="queryParams.wecomUserId"
          placeholder="员工ID"
          style="width: 150px"
          allow-clear
          @change="fetchData"
        />
        <Select
          v-model:value="queryParams.taskType"
          placeholder="任务类型"
          style="width: 150px"
          allow-clear
          :options="taskTypeOptions"
          @change="fetchData"
        />
        <Select
          v-model:value="queryParams.status"
          placeholder="状态"
          style="width: 120px"
          allow-clear
          :options="statusOptions"
          @change="fetchData"
        />
        <Button type="primary" @click="fetchData">查询</Button>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        :scroll="{ x: 1300 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button
                type="link"
                size="small"
                @click="showDetail(record as EmployeeTask)"
              >
                详情
              </Button>
              <Button
                v-if="(record as EmployeeTask).status === 'PENDING'"
                type="link"
                size="small"
                @click="dispatchTask((record as EmployeeTask).id)"
              >
                <template #icon><SendOutlined /></template>
                派发
              </Button>
              <Popconfirm
                v-if="
                  ['PENDING', 'NOTIFIED'].includes(
                    (record as EmployeeTask).status,
                  )
                "
                title="确定要取消这个任务吗？"
                @confirm="cancelTask((record as EmployeeTask).id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <Button type="link" danger size="small">取消</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情抽屉 -->
    <Drawer
      v-model:open="detailVisible"
      title="任务详情"
      width="600"
      placement="right"
    >
      <div v-if="detailTask" class="space-y-4">
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">任务ID：</span>
          <span>{{ detailTask.id }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">员工：</span>
          <span>{{ detailTask.wecomUserName || detailTask.wecomUserId }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-24 font-medium text-gray-500">任务类型：</span>
          <Tag :color="findOption(taskTypeOptions, detailTask.taskType)?.color">
            {{ findOption(taskTypeOptions, detailTask.taskType)?.label }}
          </Tag>
        </div>
        <div class="flex items-center">
          <span class="w-24 font-medium text-gray-500">状态：</span>
          <Tag :color="findOption(statusOptions, detailTask.status)?.color">
            {{ findOption(statusOptions, detailTask.status)?.label }}
          </Tag>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">目标数：</span>
          <span>{{ detailTask.targetCount }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">成功数：</span>
          <span class="text-green-500">{{ detailTask.successCount }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">失败数：</span>
          <span class="text-red-500">{{ detailTask.failCount }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">创建时间：</span>
          <span>{{
            dayjs(detailTask.createdAt).format('YYYY-MM-DD HH:mm:ss')
          }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">通知时间：</span>
          <span>{{
            detailTask.notifiedAt
              ? dayjs(detailTask.notifiedAt).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">完成时间：</span>
          <span>{{
            detailTask.completedAt
              ? dayjs(detailTask.completedAt).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }}</span>
        </div>
        <div class="flex">
          <span class="w-24 font-medium text-gray-500">过期时间：</span>
          <span>{{
            detailTask.expiresAt
              ? dayjs(detailTask.expiresAt).format('YYYY-MM-DD HH:mm:ss')
              : '-'
          }}</span>
        </div>
        <div v-if="detailTask.content" class="flex flex-col">
          <span class="mb-2 w-24 font-medium text-gray-500">任务内容：</span>
          <pre class="overflow-auto rounded bg-gray-100 p-2 text-sm">{{
            JSON.stringify(detailTask.content, null, 2)
          }}</pre>
        </div>
      </div>
    </Drawer>
  </div>
</template>
