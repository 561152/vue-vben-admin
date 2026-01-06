<script lang="ts" setup>
import { ref, onMounted, h, computed } from 'vue';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  TabPane,
  List,
  ListItem,
  ListItemMeta,
  Avatar,
  Badge,
  Popconfirm,
  DatePicker,
  Empty,
} from 'ant-design-vue';
import {
  PhoneOutlined,
  MessageOutlined,
  TeamOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface FollowUpItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  userId: number;
  userName: string | null;
  type: string;
  content: string;
  nextPlanAt: string | null;
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED';
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FollowUpStats {
  total: number;
  todayCount: number;
  pendingCount: number;
  overdueCount: number;
  byType: Record<string, number>;
  recentDays: { date: string; count: number }[];
}

interface TodayFollowUp {
  today: FollowUpItem[];
  overdue: FollowUpItem[];
  upcoming: FollowUpItem[];
  stats: {
    todayCount: number;
    overdueCount: number;
    upcomingCount: number;
  };
}

interface CustomerItem {
  id: number;
  name: string;
}

const loading = ref(false);
const dataSource = ref<FollowUpItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const formState = ref({
  customerId: undefined as number | undefined,
  type: 'CALL',
  content: '',
  nextPlanAt: null as dayjs.Dayjs | null,
});
const customers = ref<CustomerItem[]>([]);
const stats = ref<FollowUpStats | null>(null);
const todayData = ref<TodayFollowUp | null>(null);
const activeTab = ref('dashboard');
const filterStatus = ref<string | undefined>(undefined);
const filterType = ref<string | undefined>(undefined);

const typeOptions = [
  { value: 'CALL', label: '电话', color: 'blue', icon: PhoneOutlined },
  { value: 'MESSAGE', label: '消息', color: 'green', icon: MessageOutlined },
  { value: 'MEETING', label: '会议', color: 'orange', icon: TeamOutlined },
  { value: 'EMAIL', label: '邮件', color: 'purple', icon: MailOutlined },
  { value: 'OTHER', label: '其他', color: 'default', icon: ClockCircleOutlined },
];

const statusOptions = [
  { value: 'PENDING', label: '待执行', color: 'blue' },
  { value: 'OVERDUE', label: '已逾期', color: 'red' },
  { value: 'COMPLETED', label: '已完成', color: 'default' },
];

const columns = [
  {
    title: '客户',
    key: 'customer',
    width: 180,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    customRender: ({ text }: { text: string }) => {
      const opt = typeOptions.find(o => o.value === text);
      return h(Tag, { color: opt?.color || 'default' }, () => opt?.label || text);
    }
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    customRender: ({ record }: { record: FollowUpItem }) => {
      if (record.status === 'OVERDUE') {
        return h(Tag, { color: 'red' }, () => '已逾期');
      } else if (record.status === 'PENDING') {
        return h(Tag, { color: 'blue' }, () => '待执行');
      }
      return h(Tag, { color: 'default' }, () => '已完成');
    }
  },
  {
    title: '计划时间',
    dataIndex: 'nextPlanAt',
    key: 'nextPlanAt',
    width: 160,
    customRender: ({ text }: { text: string | null }) => {
      if (!text) return '-';
      return dayjs(text).format('MM-DD HH:mm');
    }
  },
  {
    title: '跟进人',
    dataIndex: 'userName',
    key: 'userName',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 140,
    customRender: ({ text }: { text: string }) => dayjs(text).format('MM-DD HH:mm')
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    fixed: 'right',
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterType.value) params.type = filterType.value;

    const res = await requestClient.get<{ items: FollowUpItem[]; total: number }>('/follow-ups', { params });
    dataSource.value = res.items;
    pagination.value.total = res.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await requestClient.get<FollowUpStats>('/follow-ups/stats');
    stats.value = res;
  } catch (e) {
    console.error(e);
  }
}

async function fetchTodayData() {
  try {
    const res = await requestClient.get<TodayFollowUp>('/follow-ups/today');
    todayData.value = res;
  } catch (e) {
    console.error(e);
  }
}

async function fetchCustomers() {
  try {
    const res = await requestClient.get<{ items: CustomerItem[] }>('/customers', {
      params: { pageSize: 100 }
    });
    customers.value = res.items;
  } catch (e) {
    console.error(e);
  }
}

function handleAdd() {
  formState.value = { customerId: undefined, type: 'CALL', content: '', nextPlanAt: null };
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.value.customerId) {
    message.warning('请选择客户');
    return;
  }
  if (!formState.value.content) {
    message.warning('请输入跟进内容');
    return;
  }

  try {
    await requestClient.post('/follow-ups', {
      customerId: formState.value.customerId,
      type: formState.value.type,
      content: formState.value.content,
      nextPlanAt: formState.value.nextPlanAt?.toISOString(),
    });
    message.success('添加成功');
    modalVisible.value = false;
    fetchData();
    fetchStats();
    fetchTodayData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function handleMarkCompleted(id: number) {
  try {
    await requestClient.put(`/follow-ups/${id}/complete`);
    message.success('已标记完成');
    fetchData();
    fetchStats();
    fetchTodayData();
  } catch (e) {
    message.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await requestClient.delete(`/follow-ups/${id}`);
    message.success('删除成功');
    fetchData();
    fetchStats();
    fetchTodayData();
  } catch (e) {
    message.error('删除失败');
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
}

function handleFilter() {
  pagination.value.current = 1;
  fetchData();
}

function handleResetFilter() {
  filterStatus.value = undefined;
  filterType.value = undefined;
  pagination.value.current = 1;
  fetchData();
}

function formatRelativeTime(time: string | null) {
  if (!time) return '-';
  return dayjs(time).fromNow();
}

function getTypeIcon(type: string) {
  const opt = typeOptions.find(o => o.value === type);
  return opt?.icon || ClockCircleOutlined;
}

onMounted(() => {
  fetchData();
  fetchStats();
  fetchTodayData();
  fetchCustomers();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">跟进管理</h2>
      <Button type="primary" @click="handleAdd">新增跟进</Button>
    </div>

    <!-- Stats Cards -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic
            title="总跟进数"
            :value="stats?.total || 0"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <CalendarOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="待执行"
            :value="stats?.pendingCount || 0"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="已逾期"
            :value="stats?.overdueCount || 0"
            :value-style="{ color: '#ff4d4f' }"
          >
            <template #prefix>
              <ExclamationCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="今日新增"
            :value="stats?.todayCount || 0"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <Tabs v-model:activeKey="activeTab">
      <!-- Dashboard Tab -->
      <TabPane key="dashboard" tab="工作台">
        <Row :gutter="16">
          <!-- Overdue -->
          <Col :span="8">
            <Card title="已逾期" size="small" class="h-96 overflow-auto">
              <template #extra>
                <Badge :count="todayData?.stats.overdueCount || 0" :number-style="{ backgroundColor: '#ff4d4f' }" />
              </template>
              <List
                v-if="todayData?.overdue.length"
                :data-source="todayData?.overdue"
                size="small"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <ListItemMeta>
                      <template #avatar>
                        <Avatar :style="{ backgroundColor: '#ff4d4f' }" :size="32">
                          <template #icon><component :is="getTypeIcon(item.type)" /></template>
                        </Avatar>
                      </template>
                      <template #title>
                        <div class="flex justify-between items-center">
                          <span>{{ item.customerName }}</span>
                          <Popconfirm title="标记为已完成?" @confirm="handleMarkCompleted(item.id)">
                            <Button type="link" size="small">
                              <CheckCircleOutlined />
                            </Button>
                          </Popconfirm>
                        </div>
                      </template>
                      <template #description>
                        <div class="text-xs">{{ item.content }}</div>
                        <div class="text-xs text-red-500">{{ formatRelativeTime(item.nextPlanAt) }}</div>
                      </template>
                    </ListItemMeta>
                  </ListItem>
                </template>
              </List>
              <Empty v-else description="无逾期任务" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
            </Card>
          </Col>

          <!-- Today -->
          <Col :span="8">
            <Card title="今日待办" size="small" class="h-96 overflow-auto">
              <template #extra>
                <Badge :count="todayData?.stats.todayCount || 0" :number-style="{ backgroundColor: '#1890ff' }" />
              </template>
              <List
                v-if="todayData?.today.length"
                :data-source="todayData?.today"
                size="small"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <ListItemMeta>
                      <template #avatar>
                        <Avatar :style="{ backgroundColor: '#1890ff' }" :size="32">
                          <template #icon><component :is="getTypeIcon(item.type)" /></template>
                        </Avatar>
                      </template>
                      <template #title>
                        <div class="flex justify-between items-center">
                          <span>{{ item.customerName }}</span>
                          <Popconfirm title="标记为已完成?" @confirm="handleMarkCompleted(item.id)">
                            <Button type="link" size="small">
                              <CheckCircleOutlined />
                            </Button>
                          </Popconfirm>
                        </div>
                      </template>
                      <template #description>
                        <div class="text-xs">{{ item.content }}</div>
                        <div class="text-xs text-gray-400">
                          {{ dayjs(item.nextPlanAt).format('HH:mm') }}
                        </div>
                      </template>
                    </ListItemMeta>
                  </ListItem>
                </template>
              </List>
              <Empty v-else description="今日无待办" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
            </Card>
          </Col>

          <!-- Upcoming -->
          <Col :span="8">
            <Card title="即将到来 (3天内)" size="small" class="h-96 overflow-auto">
              <template #extra>
                <Badge :count="todayData?.stats.upcomingCount || 0" :number-style="{ backgroundColor: '#52c41a' }" />
              </template>
              <List
                v-if="todayData?.upcoming.length"
                :data-source="todayData?.upcoming"
                size="small"
              >
                <template #renderItem="{ item }">
                  <ListItem>
                    <ListItemMeta>
                      <template #avatar>
                        <Avatar :style="{ backgroundColor: '#52c41a' }" :size="32">
                          <template #icon><component :is="getTypeIcon(item.type)" /></template>
                        </Avatar>
                      </template>
                      <template #title>{{ item.customerName }}</template>
                      <template #description>
                        <div class="text-xs">{{ item.content }}</div>
                        <div class="text-xs text-gray-400">
                          {{ dayjs(item.nextPlanAt).format('MM-DD HH:mm') }}
                        </div>
                      </template>
                    </ListItemMeta>
                  </ListItem>
                </template>
              </List>
              <Empty v-else description="暂无即将到来的任务" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
            </Card>
          </Col>
        </Row>
      </TabPane>

      <!-- List Tab -->
      <TabPane key="list" tab="全部记录">
        <!-- Filters -->
        <Card class="mb-4" size="small">
          <Space wrap>
            <span class="text-gray-500">状态:</span>
            <Select
              v-model:value="filterStatus"
              :options="[{ value: '', label: '全部' }, ...statusOptions]"
              placeholder="选择状态"
              style="width: 120px"
              allow-clear
            />
            <span class="text-gray-500 ml-4">类型:</span>
            <Select
              v-model:value="filterType"
              :options="[{ value: '', label: '全部' }, ...typeOptions]"
              placeholder="选择类型"
              style="width: 120px"
              allow-clear
            />
            <Button type="primary" @click="handleFilter">筛选</Button>
            <Button @click="handleResetFilter">重置</Button>
          </Space>
        </Card>

        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 1100 }"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'customer'">
              <div class="flex items-center gap-2">
                <Avatar :size="32">
                  <template #icon><UserOutlined /></template>
                </Avatar>
                <div>
                  <div class="font-medium">{{ record.customerName }}</div>
                  <div v-if="record.customerPhone" class="text-xs text-gray-400">
                    {{ record.customerPhone }}
                  </div>
                </div>
              </div>
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Popconfirm
                  v-if="record.status !== 'COMPLETED'"
                  title="标记为已完成?"
                  @confirm="handleMarkCompleted(record.id)"
                >
                  <Button type="link" size="small">完成</Button>
                </Popconfirm>
                <Popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
                  <Button type="link" size="small" danger>删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </TabPane>
    </Tabs>

    <!-- Create Modal -->
    <Modal v-model:open="modalVisible" title="新增跟进记录" @ok="handleSubmit">
      <Form layout="vertical" class="mt-4">
        <Form.Item label="客户" required>
          <Select
            v-model:value="formState.customerId"
            placeholder="请选择客户"
            show-search
            :filter-option="(input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())"
            :options="customers.map(c => ({ value: c.id, label: c.name }))"
          />
        </Form.Item>
        <Form.Item label="跟进方式">
          <Select v-model:value="formState.type" :options="typeOptions" />
        </Form.Item>
        <Form.Item label="跟进内容" required>
          <Input.TextArea
            v-model:value="formState.content"
            placeholder="请输入跟进内容"
            :rows="4"
          />
        </Form.Item>
        <Form.Item label="计划时间">
          <DatePicker
            v-model:value="formState.nextPlanAt"
            show-time
            placeholder="选择计划执行时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
