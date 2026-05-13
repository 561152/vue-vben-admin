<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import type { SelectValue } from 'ant-design-vue/es/select';
import type { ValueType } from 'ant-design-vue/es/input-number/src/utils/MiniDecimal';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
  Button,
  Input,
  DatePicker,
  Space,
  Spin,
  Empty,
  message,
  Modal,
  Select,
  Avatar,
  List,
  Divider,
  Form,
  InputNumber,
  Switch,
} from 'ant-design-vue';
import {
  TeamOutlined,
  TrophyOutlined,
  RiseOutlined,
  GiftOutlined,
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
  UserOutlined,
  LinkOutlined,
  CrownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';
import dayjs from 'dayjs';

import {
  getReferralLeaderboard,
  generateReferralCode,
  getReferralRelationships,
  type ReferralLeaderboardEntry,
  type ReferralRelationship,
} from '#/api/crm/retail';
import { getCustomers } from '#/api/crm';

// ==================== 类型定义 ====================

defineOptions({ name: 'ReferralMarketing' });

interface ReferralUser {
  customerId: string;
  customerName: string;
  referralCode: string;
  referralCount: number;
  successfulReferrals: number;
  totalRewardPoints: number;
  createdAt?: string;
}

interface RewardRecord {
  id: string;
  time: string;
  referrerName: string;
  refereeName: string;
  rewardType: 'POINTS' | 'CASH' | 'COUPON';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// ==================== 状态 ====================

const activeTab = ref('overview');
const loading = ref(false);

// Tab 1: 概览
const leaderboard = ref<ReferralLeaderboardEntry[]>([]);
const trendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);

// Tab 2: 推荐人管理
const searchKeyword = ref('');
const searchCode = ref('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(undefined);
const referrerList = ref<ReferralUser[]>([]);
const referrerLoading = ref(false);
const referrerPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// Tab 3: 推荐关系
const selectedCustomer = ref<SelectValue>(undefined);
const customerOptions = ref<Array<{ label: string; value: string }>>([]);
const customerSearchLoading = ref(false);
const referrerInfo = ref<{
  customerId: string;
  customerName: string;
  referralCode: string;
} | null>(null);
const referralsList = ref<ReferralRelationship[]>([]);
const relationshipsLoading = ref(false);
const relationshipsPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// Tab 4: 奖励设置
const rewardSettings = ref({
  enabled: true,
  rewardType: 'POINTS' as 'POINTS' | 'CASH' | 'COUPON',
  referrerReward: 100,
  refereeReward: 50,
  minPurchaseAmount: 0,
  effectiveStart: dayjs().format('YYYY-MM-DD'),
  effectiveEnd: dayjs().add(1, 'year').format('YYYY-MM-DD'),
});
const effectiveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs(rewardSettings.value.effectiveStart),
  dayjs(rewardSettings.value.effectiveEnd),
]);
const rewardRecords = ref<RewardRecord[]>([]);
const saveSettingsLoading = ref(false);

// ==================== 计算属性 ====================

const totalReferrers = computed(() => leaderboard.value.length);

const totalReferrals = computed(() =>
  leaderboard.value.reduce((sum, item) => sum + item.referralCount, 0),
);

const totalRewards = computed(() =>
  leaderboard.value.reduce((sum, item) => sum + item.totalRewardPoints, 0),
);

// ==================== 表格列定义 ====================

const leaderboardColumns = [
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank',
    width: 80,
    customRender: ({ record }: any) => {
      if (record.rank === 1) return '🥇';
      if (record.rank === 2) return '🥈';
      if (record.rank === 3) return '🥉';
      return record.rank;
    },
  },
  {
    title: '客户',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: '推荐码',
    dataIndex: 'referralCode',
    key: 'referralCode',
    customRender: ({ text }: any) =>
      h(
        Space,
        { size: 'small' },
        {
          default: () => [
            h(Tag, { color: 'blue' }, () => text),
            h(
              Button,
              {
                type: 'text',
                size: 'small',
                onClick: () => copyToClipboard(text),
              },
              () => h(CopyOutlined),
            ),
          ],
        },
      ),
  },
  {
    title: '推荐人数',
    dataIndex: 'referralCount',
    key: 'referralCount',
    sorter: (a: any, b: any) => a.referralCount - b.referralCount,
  },
  {
    title: '成功推荐',
    dataIndex: 'successfulReferrals',
    key: 'successfulReferrals',
  },
  {
    title: '奖励积分',
    dataIndex: 'totalRewardPoints',
    key: 'totalRewardPoints',
    sorter: (a: any, b: any) => a.totalRewardPoints - b.totalRewardPoints,
    customRender: ({ text }: any) => `${text} 积分`,
  },
];

const referrerColumns = [
  {
    title: '客户名称',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: '推荐码',
    dataIndex: 'referralCode',
    key: 'referralCode',
    customRender: ({ text }: any) =>
      h(
        Space,
        { size: 'small' },
        {
          default: () => [
            h(Tag, { color: 'blue' }, () => text),
            h(
              Button,
              {
                type: 'text',
                size: 'small',
                onClick: () => copyToClipboard(text),
              },
              () => h(CopyOutlined),
            ),
          ],
        },
      ),
  },
  {
    title: '推荐人数',
    dataIndex: 'referralCount',
    key: 'referralCount',
  },
  {
    title: '成功转化',
    dataIndex: 'successfulReferrals',
    key: 'successfulReferrals',
  },
  {
    title: '获得奖励',
    dataIndex: 'totalRewardPoints',
    key: 'totalRewardPoints',
    customRender: ({ text }: any) => `${text} 积分`,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    customRender: ({ record }: any) =>
      h(
        Space,
        { size: 'small' },
        {
          default: () => [
            h(
              Button,
              {
                type: 'link',
                size: 'small',
                onClick: () => viewReferralDetail(record),
              },
              () => [h(EyeOutlined), ' 详情'],
            ),
            h(
              Button,
              {
                type: 'link',
                size: 'small',
                onClick: () => viewRelationships(record.customerId),
              },
              () => [h(LinkOutlined), ' 关系树'],
            ),
          ],
        },
      ),
  },
];

const referralColumns = [
  {
    title: '客户名称',
    dataIndex: 'referredCustomerName',
    key: 'referredCustomerName',
  },
  {
    title: '推荐时间',
    dataIndex: 'referredAt',
    key: 'referredAt',
    customRender: ({ text }: any) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: any) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        PENDING: { color: 'orange', label: '待激活' },
        ACTIVE: { color: 'green', label: '已激活' },
        INACTIVE: { color: 'red', label: '已流失' },
      };
      const status = statusMap[text] || { color: 'default', label: text };
      return h(Tag, { color: status.color }, () => status.label);
    },
  },
];

const formatPoints = (value: ValueType) => `${value ?? 0} 积分`;
const formatCurrency = (value: ValueType) => `¥${value ?? 0}`;

const rewardRecordColumns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
  },
  {
    title: '推荐人',
    dataIndex: 'referrerName',
    key: 'referrerName',
  },
  {
    title: '被推荐人',
    dataIndex: 'refereeName',
    key: 'refereeName',
  },
  {
    title: '奖励类型',
    dataIndex: 'rewardType',
    key: 'rewardType',
    customRender: ({ text }: any) => {
      const typeMap: Record<string, string> = {
        POINTS: '积分',
        CASH: '现金',
        COUPON: '优惠券',
      };
      return typeMap[text] || text;
    },
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: any) => {
      const statusMap: Record<string, { color: string; label: string }> = {
        PENDING: { color: 'orange', label: '待发放' },
        COMPLETED: { color: 'green', label: '已发放' },
        CANCELLED: { color: 'red', label: '已取消' },
      };
      const status = statusMap[text] || { color: 'default', label: text };
      return h(Tag, { color: status.color }, () => status.label);
    },
  },
];

// ==================== 辅助函数 ====================

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板');
  });
}

function renderTrendChartData() {
  // 模拟近30天推荐趋势数据
  const dates: string[] = [];
  const counts: number[] = [];

  for (let i = 29; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'));
    // 模拟数据：随机生成0-10之间的数
    counts.push(Math.floor(Math.random() * 10));
  }

  renderTrendChart({
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    series: [
      {
        name: '新增推荐',
        type: 'line',
        smooth: true,
        data: counts,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#1890ff',
        },
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  });
}

// ==================== 数据加载 ====================

async function loadLeaderboard() {
  loading.value = true;
  try {
    const response = await getReferralLeaderboard({ limit: 10 });
    leaderboard.value = response.leaderboard || [];
    renderTrendChartData();
  } catch (error) {
    console.error('加载推荐排行榜失败', error);
    message.error('加载推荐排行榜失败');
  } finally {
    loading.value = false;
  }
}

async function loadReferrerList() {
  referrerLoading.value = true;
  try {
    // 使用排行榜数据作为推荐人列表（实际项目中应该调用搜索API）
    const response = await getReferralLeaderboard({ limit: 100 });
    let list = response.leaderboard || [];

    // 本地筛选
    if (searchKeyword.value) {
      list = list.filter((item) =>
        item.customerName
          .toLowerCase()
          .includes(searchKeyword.value.toLowerCase()),
      );
    }
    if (searchCode.value) {
      list = list.filter((item) =>
        item.referralCode
          .toLowerCase()
          .includes(searchCode.value.toLowerCase()),
      );
    }

    referrerPagination.value.total = list.length;
    referrerList.value = list.slice(
      (referrerPagination.value.current - 1) *
        referrerPagination.value.pageSize,
      referrerPagination.value.current * referrerPagination.value.pageSize,
    );
  } catch (error) {
    console.error('加载推荐人列表失败', error);
    message.error('加载推荐人列表失败');
  } finally {
    referrerLoading.value = false;
  }
}

async function handleReferrerTableChange(pagination: any) {
  referrerPagination.value.current = pagination.current;
  referrerPagination.value.pageSize = pagination.pageSize;
  await loadReferrerList();
}

async function searchCustomers(keyword: string) {
  if (!keyword || keyword.length < 2) return;

  customerSearchLoading.value = true;
  try {
    const response = await getCustomers({
      page: 1,
      pageSize: 20,
      keyword,
    });
    customerOptions.value = (response.items || []).map((customer: any) => ({
      label: `${customer.name} (${customer.phone || '无电话'})`,
      value: customer.id.toString(),
    }));
  } catch (error) {
    console.error('搜索客户失败', error);
  } finally {
    customerSearchLoading.value = false;
  }
}

async function loadRelationships() {
  const customerId =
    typeof selectedCustomer.value === 'string' ? selectedCustomer.value : '';
  if (!customerId) return;

  relationshipsLoading.value = true;
  try {
    const response = await getReferralRelationships(customerId, {
      page: relationshipsPagination.value.current,
      pageSize: relationshipsPagination.value.pageSize,
    });

    referrerInfo.value = {
      customerId: response.customerId,
      customerName: '推荐人', // 实际应该从客户列表中获取
      referralCode: response.referralCode,
    };
    referralsList.value = response.referrals || [];
    relationshipsPagination.value.total = response.pagination?.total || 0;
  } catch (error) {
    console.error('加载推荐关系失败', error);
    message.error('加载推荐关系失败');
  } finally {
    relationshipsLoading.value = false;
  }
}

function handleRelationshipsTableChange(pagination: any) {
  relationshipsPagination.value.current = pagination.current;
  relationshipsPagination.value.pageSize = pagination.pageSize;
  loadRelationships();
}

function viewRelationships(customerId: string) {
  activeTab.value = 'relationships';
  selectedCustomer.value = customerId;
  loadRelationships();
}

function viewReferralDetail(record: ReferralUser) {
  Modal.info({
    title: '推荐人详情',
    width: 600,
    content: h('div', { class: 'mt-4 space-y-3' }, [
      h('div', { class: 'flex justify-between' }, [
        h('span', { class: 'text-gray-500' }, '客户名称'),
        h('span', { class: 'font-medium' }, record.customerName),
      ]),
      h('div', { class: 'flex justify-between' }, [
        h('span', { class: 'text-gray-500' }, '推荐码'),
        h('span', { class: 'font-medium' }, record.referralCode),
      ]),
      h('div', { class: 'flex justify-between' }, [
        h('span', { class: 'text-gray-500' }, '推荐人数'),
        h('span', { class: 'font-medium' }, `${record.referralCount} 人`),
      ]),
      h('div', { class: 'flex justify-between' }, [
        h('span', { class: 'text-gray-500' }, '成功转化'),
        h('span', { class: 'font-medium' }, `${record.successfulReferrals} 人`),
      ]),
      h('div', { class: 'flex justify-between' }, [
        h('span', { class: 'text-gray-500' }, '累计奖励'),
        h(
          'span',
          { class: 'font-medium text-green-600' },
          `${record.totalRewardPoints} 积分`,
        ),
      ]),
    ]),
  });
}

function handleGenerateCode() {
  let customerId = '';

  Modal.confirm({
    title: '生成推荐码',
    content: h('div', { class: 'mt-4' }, [
      h('p', { class: 'mb-2 text-gray-500' }, '请输入客户ID'),
      h(Input, {
        placeholder: '客户ID',
        onChange: (e: any) => {
          customerId = e.target.value;
        },
      }),
    ]),
    onOk: async () => {
      if (!customerId) {
        message.error('请输入客户ID');
        return Promise.reject();
      }
      try {
        const result = await generateReferralCode(customerId);
        message.success(`推荐码生成成功: ${result.referralCode}`);
        loadReferrerList();
      } catch (error) {
        console.error('生成推荐码失败', error);
        message.error('生成推荐码失败');
      }
    },
  });
}

async function handleSaveSettings() {
  saveSettingsLoading.value = true;
  try {
    // 同步日期范围到设置
    if (effectiveDateRange.value) {
      rewardSettings.value.effectiveStart =
        effectiveDateRange.value[0].format('YYYY-MM-DD');
      rewardSettings.value.effectiveEnd =
        effectiveDateRange.value[1].format('YYYY-MM-DD');
    }
    // 实际项目中应该调用API保存设置
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success('奖励设置保存成功');
  } catch (error) {
    console.error('保存设置失败', error);
    message.error('保存设置失败');
  } finally {
    saveSettingsLoading.value = false;
  }
}

function resetSearch() {
  searchKeyword.value = '';
  searchCode.value = '';
  dateRange.value = undefined;
  loadReferrerList();
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadLeaderboard();
  loadReferrerList();

  // 模拟奖励记录数据
  rewardRecords.value = [
    {
      id: '1',
      time: '2024-01-15 10:30',
      referrerName: '张三',
      refereeName: '李四',
      rewardType: 'POINTS',
      amount: 100,
      status: 'COMPLETED',
    },
    {
      id: '2',
      time: '2024-01-14 15:20',
      referrerName: '王五',
      refereeName: '赵六',
      rewardType: 'POINTS',
      amount: 100,
      status: 'COMPLETED',
    },
    {
      id: '3',
      time: '2024-01-13 09:15',
      referrerName: '李四',
      refereeName: '钱七',
      rewardType: 'CASH',
      amount: 50,
      status: 'PENDING',
    },
  ];
});
</script>

<template>
  <div class="referral-marketing">
    <!-- 页面头部 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="m-0 text-xl font-bold">推荐营销</h2>
        <Tag color="blue">零售会员</Tag>
      </div>
      <Button type="primary" @click="handleGenerateCode">
        <template #icon><PlusOutlined /></template>
        生成推荐码
      </Button>
    </div>

    <Spin :spinning="loading">
      <Tabs v-model:activeKey="activeTab" type="card">
        <!-- Tab 1: 推荐概览 -->
        <Tabs.TabPane key="overview" tab="推荐概览">
          <!-- 核心指标卡片区 -->
          <Row :gutter="[16, 16]" class="mb-4">
            <Col :xs="24" :sm="12" :md="6">
              <Card>
                <Statistic
                  title="总推荐人数"
                  :value="totalReferrals"
                  :value-style="{ color: '#1890ff' }"
                >
                  <template #prefix><TeamOutlined /></template>
                </Statistic>
                <div class="mt-2 text-xs text-gray-500">累计推荐注册人数</div>
              </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6">
              <Card>
                <Statistic
                  title="活跃推荐人"
                  :value="totalReferrers"
                  :value-style="{ color: '#52c41a' }"
                >
                  <template #prefix><TrophyOutlined /></template>
                </Statistic>
                <div class="mt-2 text-xs text-gray-500">有推荐记录的客户数</div>
              </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6">
              <Card>
                <Statistic
                  title="今日新增"
                  :value="Math.floor(Math.random() * 10)"
                  :value-style="{ color: '#fa8c16' }"
                >
                  <template #prefix><RiseOutlined /></template>
                </Statistic>
                <div class="mt-2 text-xs text-orange-600">
                  <ArrowUpOutlined /> 较昨日 +12%
                </div>
              </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6">
              <Card>
                <Statistic
                  title="累计奖励"
                  :value="totalRewards"
                  :value-style="{ color: '#722ed1' }"
                >
                  <template #prefix><GiftOutlined /></template>
                </Statistic>
                <div class="mt-2 text-xs text-gray-500">已发放积分总数</div>
              </Card>
            </Col>
          </Row>

          <!-- 推荐趋势图 + 排行榜 -->
          <Row :gutter="[16, 16]">
            <Col :xs="24" :lg="12">
              <Card title="推荐趋势（近30天）" class="h-full">
                <EchartsUI
                  v-if="leaderboard.length > 0"
                  ref="trendChartRef"
                  class="h-80"
                />
                <Empty v-else description="暂无数据" class="py-20" />
              </Card>
            </Col>
            <Col :xs="24" :lg="12">
              <Card title="推荐排行榜 TOP 10" class="h-full">
                <Table
                  :columns="leaderboardColumns"
                  :data-source="leaderboard"
                  :pagination="false"
                  :scroll="{ y: 320 }"
                  size="small"
                  row-key="customerId"
                >
                  <template #emptyText>
                    <Empty description="暂无推荐数据" />
                  </template>
                </Table>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <!-- Tab 2: 推荐人管理 -->
        <Tabs.TabPane key="referrers" tab="推荐人管理">
          <!-- 搜索筛选区 -->
          <Card class="mb-4">
            <Space wrap>
              <Input
                v-model:value="searchKeyword"
                placeholder="客户名称"
                style="width: 200px"
                allow-clear
              >
                <template #prefix><UserOutlined /></template>
              </Input>
              <Input
                v-model:value="searchCode"
                placeholder="推荐码"
                style="width: 150px"
                allow-clear
              >
                <template #prefix><CrownOutlined /></template>
              </Input>
              <DatePicker.RangePicker
                v-model:value="dateRange"
                style="width: 240px"
              />
              <Button type="primary" @click="loadReferrerList">
                <SearchOutlined /> 搜索
              </Button>
              <Button @click="resetSearch"> <ReloadOutlined /> 重置 </Button>
            </Space>
          </Card>

          <!-- 推荐人列表表格 -->
          <Card>
            <Table
              :columns="referrerColumns"
              :data-source="referrerList"
              :loading="referrerLoading"
              :pagination="{
                ...referrerPagination,
                showSizeChanger: true,
                showTotal: (total: number) => `共 ${total} 条`,
              }"
              row-key="customerId"
              @change="handleReferrerTableChange"
            >
              <template #emptyText>
                <Empty description="暂无推荐人数据" />
              </template>
            </Table>
          </Card>
        </Tabs.TabPane>

        <!-- Tab 3: 推荐关系树 -->
        <Tabs.TabPane key="relationships" tab="推荐关系树">
          <Row :gutter="[16, 16]">
            <!-- 左侧：客户选择器 -->
            <Col :xs="24" :md="8">
              <Card title="选择客户" class="h-full">
                <Select
                  v-model:value="selectedCustomer"
                  placeholder="搜索客户"
                  show-search
                  :filter-option="false"
                  :options="customerOptions"
                  :loading="customerSearchLoading"
                  style="width: 100%"
                  @search="searchCustomers"
                  @change="loadRelationships"
                />

                <Divider />

                <div v-if="referrerInfo" class="referrer-info">
                  <div class="mb-2 text-sm text-gray-500">当前客户</div>
                  <div class="flex items-center gap-3 rounded bg-gray-50 p-3">
                    <Avatar :size="48" :icon="h(UserOutlined)" />
                    <div>
                      <div class="font-medium">
                        {{ referrerInfo.customerName }}
                      </div>
                      <div class="text-sm text-gray-500">
                        推荐码:
                        <Tag color="blue">{{ referrerInfo.referralCode }}</Tag>
                      </div>
                    </div>
                  </div>
                </div>

                <Empty
                  v-else
                  description="请选择客户查看推荐关系"
                  class="py-10"
                />

                <!-- 上级推荐人 -->
                <div v-if="referrerInfo" class="mt-4">
                  <div class="mb-2 text-sm text-gray-500">上级推荐人</div>
                  <div class="rounded border border-blue-100 bg-blue-50 p-3">
                    <div class="flex items-center gap-2">
                      <ArrowUpOutlined class="text-blue-500" />
                      <span class="text-sm text-gray-600">系统推荐</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <!-- 右侧：下级推荐列表 -->
            <Col :xs="24" :md="16">
              <Card
                :title="referrerInfo ? '下级推荐列表' : '请选择客户'"
                class="h-full"
              >
                <Table
                  v-if="referrerInfo"
                  :columns="referralColumns"
                  :data-source="referralsList"
                  :loading="relationshipsLoading"
                  :pagination="{
                    ...relationshipsPagination,
                    showSizeChanger: true,
                    showTotal: (total: number) => `共 ${total} 条`,
                  }"
                  row-key="referredCustomerId"
                  @change="handleRelationshipsTableChange"
                />
                <Empty
                  v-else
                  description="请在左侧选择客户查看推荐关系"
                  class="py-20"
                />
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <!-- Tab 4: 奖励设置 -->
        <Tabs.TabPane key="settings" tab="奖励设置">
          <Row :gutter="[16, 16]">
            <!-- 奖励规则配置 -->
            <Col :xs="24" :md="12">
              <Card title="奖励规则配置">
                <Form layout="vertical">
                  <Form.Item label="启用推荐奖励">
                    <Switch v-model:checked="rewardSettings.enabled" />
                  </Form.Item>

                  <Form.Item label="奖励类型">
                    <Select v-model:value="rewardSettings.rewardType">
                      <Select.Option value="POINTS">积分</Select.Option>
                      <Select.Option value="CASH">现金</Select.Option>
                      <Select.Option value="COUPON">优惠券</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="推荐人奖励">
                    <InputNumber
                      v-model:value="rewardSettings.referrerReward"
                      style="width: 100%"
                      :min="0"
                      :formatter="formatPoints"
                    />
                  </Form.Item>

                  <Form.Item label="被推荐人奖励">
                    <InputNumber
                      v-model:value="rewardSettings.refereeReward"
                      style="width: 100%"
                      :min="0"
                      :formatter="formatPoints"
                    />
                  </Form.Item>

                  <Form.Item label="最低消费金额">
                    <InputNumber
                      v-model:value="rewardSettings.minPurchaseAmount"
                      style="width: 100%"
                      :min="0"
                      :formatter="formatCurrency"
                    />
                    <div class="mt-1 text-xs text-gray-500">
                      被推荐人需达到此消费金额，推荐人才能获得奖励
                    </div>
                  </Form.Item>

                  <Form.Item label="生效时间">
                    <DatePicker.RangePicker
                      v-model:value="effectiveDateRange"
                      style="width: 100%"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      :loading="saveSettingsLoading"
                      @click="handleSaveSettings"
                    >
                      <SettingOutlined /> 保存设置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <!-- 奖励发放记录 -->
            <Col :xs="24" :md="12">
              <Card title="奖励发放记录">
                <Table
                  :columns="rewardRecordColumns"
                  :data-source="rewardRecords"
                  :pagination="{ pageSize: 5 }"
                  size="small"
                  row-key="id"
                >
                  <template #emptyText>
                    <Empty description="暂无发放记录" />
                  </template>
                </Table>
              </Card>

              <Card title="奖励统计" class="mt-4">
                <List size="small">
                  <List.Item>
                    <div class="flex w-full justify-between">
                      <span>本月发放积分</span>
                      <span class="font-medium text-green-600"
                        >12,500 积分</span
                      >
                    </div>
                  </List.Item>
                  <List.Item>
                    <div class="flex w-full justify-between">
                      <span>本月发放现金</span>
                      <span class="font-medium text-green-600">¥3,200</span>
                    </div>
                  </List.Item>
                  <List.Item>
                    <div class="flex w-full justify-between">
                      <span>待发放奖励</span>
                      <span class="font-medium text-orange-600"
                        >1,800 积分</span
                      >
                    </div>
                  </List.Item>
                </List>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </Spin>
  </div>
</template>

<style scoped lang="less">
.referral-marketing {
  padding: 16px;

  .referrer-info {
    .ant-avatar {
      background-color: #1890ff;
    }
  }
}
</style>
