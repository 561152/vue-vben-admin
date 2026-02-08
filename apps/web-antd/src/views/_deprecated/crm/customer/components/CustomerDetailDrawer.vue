<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import {
  Drawer,
  Tabs,
  TabPane,
  Avatar,
  Tag,
  Card,
  Timeline,
  TimelineItem,
  Empty,
  Button,
  Space,
  Spin,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  Popconfirm,
  message,
} from 'ant-design-vue';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import {
  getCustomer,
  getCustomerChannels,
  getCustomerTimeline,
  getCustomerFollowUps,
  markFollowUpCompleted,
  type Customer,
  type CustomerChannel,
  type CustomerActivity,
  type FollowUp,
} from '#/api/crm';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps<{
  open: boolean;
  customerId: number | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  refresh: [];
}>();

const activeTab = ref('info');
const loading = ref(false);
const customer = ref<Customer | null>(null);
const channels = ref<CustomerChannel[]>([]);
const activities = ref<CustomerActivity[]>([]);
const followUps = ref<FollowUp[]>([]);
const activitiesTotal = ref(0);
const activitiesHasMore = ref(false);

const statusOptions: Record<string, { label: string; color: string }> = {
  LEAD: { label: '潜在客户', color: 'blue' },
  OPPORTUNITY: { label: '商机', color: 'orange' },
  CUSTOMER: { label: '成交客户', color: 'green' },
  LOST: { label: '已流失', color: 'red' },
  INVALID: { label: '无效客户', color: 'default' },
};

const channelIcons: Record<string, string> = {
  WECOM: 'wechat',
  DOUYIN: 'video',
  XIAOHONGSHU: 'book',
  WECHAT: 'wechat',
};

const channelColors: Record<string, string> = {
  WECOM: '#07c160',
  DOUYIN: '#000000',
  XIAOHONGSHU: '#fe2c55',
  WECHAT: '#07c160',
};

const activityIcons: Record<string, { icon: string; color: string }> = {
  MESSAGE_RECEIVED: { icon: 'message', color: '#1890ff' },
  MESSAGE_SENT: { icon: 'send', color: '#52c41a' },
  CALL: { icon: 'phone', color: '#faad14' },
  MEETING: { icon: 'team', color: '#722ed1' },
  STAGE_CHANGED: { icon: 'swap', color: '#eb2f96' },
  FOLLOW: { icon: 'heart', color: '#f5222d' },
  UNFOLLOW: { icon: 'heart-broken', color: '#8c8c8c' },
  OTHER: { icon: 'info', color: '#8c8c8c' },
};

const pendingFollowUps = computed(() =>
  followUps.value.filter((f) => f.status === 'PENDING'),
);

const overdueFollowUps = computed(() =>
  followUps.value.filter((f) => f.status === 'OVERDUE'),
);

watch(
  () => [props.open, props.customerId],
  async ([open, id]) => {
    if (open && id) {
      await loadData(id);
    }
  },
  { immediate: true },
);

async function loadData(id: number) {
  loading.value = true;
  try {
    const [customerData, channelsData, timelineData, followUpsData] =
      await Promise.all([
        getCustomer(id),
        getCustomerChannels(id).catch(() => []),
        getCustomerTimeline(id, { limit: 20 }).catch(() => ({
          activities: [],
          total: 0,
          hasMore: false,
        })),
        getCustomerFollowUps(id, { pageSize: 50 }).catch(() => ({ items: [] })),
      ]);

    customer.value = customerData;
    channels.value = channelsData;
    activities.value = timelineData.activities;
    activitiesTotal.value = timelineData.total;
    activitiesHasMore.value = timelineData.hasMore;
    followUps.value = followUpsData.items;
  } catch (e) {
    console.error('Failed to load customer data:', e);
  } finally {
    loading.value = false;
  }
}

async function handleMarkCompleted(followUp: FollowUp) {
  try {
    await markFollowUpCompleted(followUp.id);
    message.success('已标记完成');
    // Refresh follow-ups
    if (props.customerId) {
      const data = await getCustomerFollowUps(props.customerId, {
        pageSize: 50,
      });
      followUps.value = data.items;
    }
  } catch (e) {
    message.error('操作失败');
  }
}

function formatTime(time: string | undefined) {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm');
}

function formatRelativeTime(time: string | undefined) {
  if (!time) return '-';
  return dayjs(time).fromNow();
}

function getActivityIcon(type: string) {
  return activityIcons[type] || activityIcons.OTHER;
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer :open="open" title="客户详情" width="640" @close="handleClose">
    <Spin :spinning="loading">
      <template v-if="customer">
        <!-- Header -->
        <div class="mb-6 flex items-start gap-4 border-b pb-4">
          <Avatar :src="customer.avatar" :size="72">
            <template #icon><UserOutlined /></template>
          </Avatar>
          <div class="flex-1">
            <div class="mb-2 flex items-center gap-2">
              <h2 class="m-0 text-xl font-bold">{{ customer.name }}</h2>
              <Tag :color="statusOptions[customer.status]?.color">
                {{ statusOptions[customer.status]?.label }}
              </Tag>
            </div>
            <div class="space-y-1 text-gray-500">
              <div v-if="customer.phone" class="flex items-center gap-2">
                <PhoneOutlined /> {{ customer.phone }}
              </div>
              <div v-if="customer.email" class="flex items-center gap-2">
                <MailOutlined /> {{ customer.email }}
              </div>
              <div v-if="customer.company" class="flex items-center gap-2">
                <EnvironmentOutlined /> {{ customer.company }}
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <Row :gutter="16" class="mb-6">
          <Col :span="6">
            <Statistic
              title="消费总额"
              :value="customer.totalAmount"
              prefix="¥"
              :precision="2"
            />
          </Col>
          <Col :span="6">
            <Statistic title="订单数" :value="customer.orderCount" />
          </Col>
          <Col :span="6">
            <Statistic title="互动次数" :value="customer.totalInteractions" />
          </Col>
          <Col :span="6">
            <Statistic title="RFM评分" :value="customer.rfmScore" />
          </Col>
        </Row>

        <!-- Tabs -->
        <Tabs v-model:activeKey="activeTab">
          <!-- Basic Info Tab -->
          <TabPane key="info" tab="基本信息">
            <Card size="small" class="mb-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-gray-400">客户等级</span>
                  <div>{{ customer.customerLevel }}</div>
                </div>
                <div>
                  <span class="text-gray-400">流失风险</span>
                  <div>
                    <Tag
                      :color="
                        customer.churnRisk === 'HIGH'
                          ? 'red'
                          : customer.churnRisk === 'MEDIUM'
                            ? 'orange'
                            : 'green'
                      "
                    >
                      {{
                        customer.churnRisk === 'HIGH'
                          ? '高'
                          : customer.churnRisk === 'MEDIUM'
                            ? '中'
                            : '低'
                      }}
                    </Tag>
                  </div>
                </div>
                <div>
                  <span class="text-gray-400">生命周期</span>
                  <div>{{ customer.lifecycleStage }}</div>
                </div>
                <div>
                  <span class="text-gray-400">来源渠道</span>
                  <div>{{ customer.source }}</div>
                </div>
                <div>
                  <span class="text-gray-400">负责人</span>
                  <div>{{ customer.ownerName || '-' }}</div>
                </div>
                <div>
                  <span class="text-gray-400">创建时间</span>
                  <div>{{ formatTime(customer.createdAt) }}</div>
                </div>
                <div>
                  <span class="text-gray-400">最后活跃</span>
                  <div>{{ formatRelativeTime(customer.lastActiveAt) }}</div>
                </div>
                <div>
                  <span class="text-gray-400">最后联系</span>
                  <div>{{ formatRelativeTime(customer.lastContactAt) }}</div>
                </div>
              </div>
            </Card>

            <!-- Channels -->
            <Card title="绑定渠道" size="small">
              <template v-if="channels.length > 0">
                <div
                  v-for="channel in channels"
                  :key="channel.id"
                  class="flex items-center gap-3 border-b py-2 last:border-0"
                >
                  <Avatar
                    :style="{
                      backgroundColor: channelColors[channel.channelType],
                    }"
                    :size="36"
                  >
                    <template #icon><WechatOutlined /></template>
                  </Avatar>
                  <div class="flex-1">
                    <div class="font-medium">
                      {{ channel.channelUsername || channel.channelUserId }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ channel.channelType }} · 消息
                      {{ channel.messageCount }}
                    </div>
                  </div>
                  <Tag :color="channel.isFollowing ? 'green' : 'default'">
                    {{ channel.isFollowing ? '已关注' : '未关注' }}
                  </Tag>
                </div>
              </template>
              <Empty
                v-else
                description="暂无绑定渠道"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </Card>
          </TabPane>

          <!-- Timeline Tab -->
          <TabPane key="timeline" tab="活动记录">
            <div class="mb-4 text-gray-500">
              共 {{ activitiesTotal }} 条记录
            </div>
            <Timeline v-if="activities.length > 0">
              <TimelineItem
                v-for="activity in activities"
                :key="activity.id"
                :color="getActivityIcon(activity.activityType).color"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="font-medium">{{ activity.title }}</div>
                    <div
                      v-if="activity.content"
                      class="mt-1 text-sm text-gray-500"
                    >
                      {{ activity.content }}
                    </div>
                    <div class="mt-1 text-xs text-gray-400">
                      <ClockCircleOutlined class="mr-1" />
                      {{ formatTime(activity.createdAt) }}
                      <span v-if="activity.operatorName" class="ml-2">
                        by {{ activity.operatorName }}
                      </span>
                    </div>
                  </div>
                  <Tag v-if="activity.channelType" size="small">
                    {{ activity.channelType }}
                  </Tag>
                </div>
              </TimelineItem>
            </Timeline>
            <Empty v-else description="暂无活动记录" />
          </TabPane>

          <!-- Follow-ups Tab -->
          <TabPane key="followups">
            <template #tab>
              <span>
                跟进计划
                <Badge
                  v-if="overdueFollowUps.length > 0"
                  :count="overdueFollowUps.length"
                  :offset="[8, -4]"
                />
              </span>
            </template>

            <!-- Overdue -->
            <template v-if="overdueFollowUps.length > 0">
              <div class="mb-4">
                <div class="mb-2 font-medium text-red-500">
                  <ExclamationCircleOutlined class="mr-1" />
                  已逾期 ({{ overdueFollowUps.length }})
                </div>
                <Card
                  v-for="item in overdueFollowUps"
                  :key="item.id"
                  size="small"
                  class="mb-2 border-red-200"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <Tag color="red">{{ item.type }}</Tag>
                      <span class="ml-2">{{ item.content }}</span>
                      <div class="mt-1 text-xs text-gray-400">
                        计划: {{ formatTime(item.nextPlanAt) }} ({{
                          formatRelativeTime(item.nextPlanAt)
                        }})
                      </div>
                    </div>
                    <Popconfirm
                      title="标记为已完成?"
                      @confirm="handleMarkCompleted(item)"
                    >
                      <Button type="link" size="small">
                        <CheckCircleOutlined /> 完成
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </div>
            </template>

            <!-- Pending -->
            <template v-if="pendingFollowUps.length > 0">
              <div class="mb-4">
                <div class="mb-2 font-medium text-blue-500">
                  <ClockCircleOutlined class="mr-1" />
                  待执行 ({{ pendingFollowUps.length }})
                </div>
                <Card
                  v-for="item in pendingFollowUps"
                  :key="item.id"
                  size="small"
                  class="mb-2"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <Tag color="blue">{{ item.type }}</Tag>
                      <span class="ml-2">{{ item.content }}</span>
                      <div class="mt-1 text-xs text-gray-400">
                        计划: {{ formatTime(item.nextPlanAt) }} ({{
                          formatRelativeTime(item.nextPlanAt)
                        }})
                      </div>
                    </div>
                    <Popconfirm
                      title="标记为已完成?"
                      @confirm="handleMarkCompleted(item)"
                    >
                      <Button type="link" size="small">
                        <CheckCircleOutlined /> 完成
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </div>
            </template>

            <!-- Completed -->
            <div
              v-if="
                followUps.filter((f) => f.status === 'COMPLETED').length > 0
              "
            >
              <div class="mb-2 font-medium text-green-500">
                <CheckCircleOutlined class="mr-1" />
                已完成
              </div>
              <Card
                v-for="item in followUps
                  .filter((f) => f.status === 'COMPLETED')
                  .slice(0, 5)"
                :key="item.id"
                size="small"
                class="mb-2 opacity-60"
              >
                <Tag color="default">{{ item.type }}</Tag>
                <span class="ml-2">{{ item.content }}</span>
                <div class="mt-1 text-xs text-gray-400">
                  {{ formatTime(item.createdAt) }}
                </div>
              </Card>
            </div>

            <Empty v-if="followUps.length === 0" description="暂无跟进计划" />
          </TabPane>
        </Tabs>
      </template>
    </Spin>
  </Drawer>
</template>
