<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  message,
  Empty,
} from 'ant-design-vue';
import {
  UserOutlined,
  TrophyOutlined,
  RocketOutlined,
  GiftOutlined,
} from '@ant-design/icons-vue';
import {
  getMemberStats,
  getReferralLeaderboard,
  getSopStats,
  type MemberStatsResponse,
  type ReferralLeaderboardResponse,
  type SopStats,
} from '#/api/crm/retail';

// Loading states
const loadingStats = ref(false);
const loadingLeaderboard = ref(false);
const loadingSop = ref(false);

// Data
const memberStats = ref<MemberStatsResponse | null>(null);
const leaderboard = ref<ReferralLeaderboardResponse | null>(null);
const welcomeSopStats = ref<SopStats | null>(null);
const vipSopStats = ref<SopStats | null>(null);

// Member level colors
const levelColors: Record<string, string> = {
  VIP: 'gold',
  GOLD: 'orange',
  SILVER: 'default',
  BRONZE: 'brown',
  REGULAR: 'blue',
};

// Leaderboard columns
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
    customRender: ({ text }: any) => {
      return `${text} 积分`;
    },
  },
];

// Fetch data
async function fetchMemberStats() {
  loadingStats.value = true;
  try {
    memberStats.value = await getMemberStats();
  } catch (error) {
    message.error('获取会员统计失败');
    console.error(error);
  } finally {
    loadingStats.value = false;
  }
}

async function fetchLeaderboard() {
  loadingLeaderboard.value = true;
  try {
    leaderboard.value = await getReferralLeaderboard({ limit: 10 });
  } catch (error) {
    message.error('获取推荐排行榜失败');
    console.error(error);
  } finally {
    loadingLeaderboard.value = false;
  }
}

async function fetchSopStats() {
  loadingSop.value = true;
  try {
    const [welcome, vip] = await Promise.all([
      getSopStats('WELCOME_NEW_MEMBER'),
      getSopStats('VIP_UPGRADE'),
    ]);
    welcomeSopStats.value = welcome;
    vipSopStats.value = vip;
  } catch (error) {
    message.error('获取SOP统计失败');
    console.error(error);
  } finally {
    loadingSop.value = false;
  }
}

onMounted(() => {
  fetchMemberStats();
  fetchLeaderboard();
  fetchSopStats();
});
</script>

<template>
  <div class="retail-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <h2><GiftOutlined /> 零售业态营销</h2>
      <p>会员管理、推荐营销、SOP自动化</p>
    </div>

    <!-- Overview Statistics -->
    <Row :gutter="[16, 16]" class="mb-4">
      <Col :xs="24" :sm="12" :md="6">
        <Card>
          <Statistic
            title="零售会员总数"
            :value="memberStats?.total || 0"
            :prefix="h(UserOutlined)"
            :loading="loadingStats"
          />
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :md="6">
        <Card>
          <Statistic
            title="推荐活跃用户"
            :value="leaderboard?.leaderboard?.length || 0"
            :prefix="h(TrophyOutlined)"
            :loading="loadingLeaderboard"
          />
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :md="6">
        <Card>
          <Statistic
            title="新会员SOP"
            :value="welcomeSopStats?.totalCustomers || 0"
            suffix="人"
            :prefix="h(RocketOutlined)"
            :loading="loadingSop"
          />
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :md="6">
        <Card>
          <Statistic
            title="VIP升级SOP"
            :value="vipSopStats?.totalCustomers || 0"
            suffix="人"
            :prefix="h(RocketOutlined)"
            :loading="loadingSop"
          />
        </Card>
      </Col>
    </Row>

    <!-- Member Level Distribution -->
    <Row :gutter="[16, 16]" class="mb-4">
      <Col :xs="24" :lg="12">
        <Card title="会员等级分布" :loading="loadingStats">
          <div v-if="memberStats?.stats && memberStats.stats.length > 0">
            <div
              v-for="stat in memberStats.stats"
              :key="stat.level"
              class="level-item"
            >
              <div class="level-header">
                <Tag :color="levelColors[stat.level] || 'default'">
                  {{ stat.level }}
                </Tag>
                <span class="count">{{ stat.count }} 人</span>
              </div>
              <Progress
                :percent="Number(stat.percentage.toFixed(1))"
                :stroke-color="levelColors[stat.level]"
              />
              <div class="level-stats">
                <span>平均消费: ¥{{ stat.avgPurchaseAmount.toFixed(0) }}</span>
                <span>平均订单: {{ stat.avgOrders.toFixed(1) }} 单</span>
                <span>平均积分: {{ stat.avgPointsBalance.toFixed(0) }}</span>
              </div>
            </div>
          </div>
          <Empty v-else description="暂无数据" />
        </Card>
      </Col>

      <!-- SOP Statistics -->
      <Col :xs="24" :lg="12">
        <Card title="SOP 执行统计" :loading="loadingSop">
          <div v-if="welcomeSopStats || vipSopStats" class="sop-stats">
            <!-- Welcome SOP -->
            <div v-if="welcomeSopStats" class="sop-item">
              <div class="sop-header">
                <h4>{{ welcomeSopStats.sopName }}</h4>
                <Tag color="blue">{{ welcomeSopStats.totalCustomers }} 人</Tag>
              </div>
              <div class="sop-progress">
                <div class="progress-item">
                  <span class="label">进行中</span>
                  <Progress
                    :percent="
                      welcomeSopStats.totalCustomers > 0
                        ? (welcomeSopStats.inProgress /
                            welcomeSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#1890ff"
                  />
                  <span class="value">{{ welcomeSopStats.inProgress }}</span>
                </div>
                <div class="progress-item">
                  <span class="label">已完成</span>
                  <Progress
                    :percent="
                      welcomeSopStats.totalCustomers > 0
                        ? (welcomeSopStats.completed /
                            welcomeSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#52c41a"
                  />
                  <span class="value">{{ welcomeSopStats.completed }}</span>
                </div>
                <div class="progress-item">
                  <span class="label">已放弃</span>
                  <Progress
                    :percent="
                      welcomeSopStats.totalCustomers > 0
                        ? (welcomeSopStats.abandoned /
                            welcomeSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#ff4d4f"
                  />
                  <span class="value">{{ welcomeSopStats.abandoned }}</span>
                </div>
              </div>
              <div class="sop-footer">
                <Tag color="green"
                  >完成率: {{ welcomeSopStats.completionRate.toFixed(1) }}%</Tag
                >
              </div>
            </div>

            <!-- VIP Upgrade SOP -->
            <div v-if="vipSopStats" class="sop-item mt-4">
              <div class="sop-header">
                <h4>{{ vipSopStats.sopName }}</h4>
                <Tag color="gold">{{ vipSopStats.totalCustomers }} 人</Tag>
              </div>
              <div class="sop-progress">
                <div class="progress-item">
                  <span class="label">进行中</span>
                  <Progress
                    :percent="
                      vipSopStats.totalCustomers > 0
                        ? (vipSopStats.inProgress /
                            vipSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#1890ff"
                  />
                  <span class="value">{{ vipSopStats.inProgress }}</span>
                </div>
                <div class="progress-item">
                  <span class="label">已完成</span>
                  <Progress
                    :percent="
                      vipSopStats.totalCustomers > 0
                        ? (vipSopStats.completed / vipSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#52c41a"
                  />
                  <span class="value">{{ vipSopStats.completed }}</span>
                </div>
                <div class="progress-item">
                  <span class="label">已放弃</span>
                  <Progress
                    :percent="
                      vipSopStats.totalCustomers > 0
                        ? (vipSopStats.abandoned / vipSopStats.totalCustomers) *
                          100
                        : 0
                    "
                    :show-info="false"
                    stroke-color="#ff4d4f"
                  />
                  <span class="value">{{ vipSopStats.abandoned }}</span>
                </div>
              </div>
              <div class="sop-footer">
                <Tag color="green"
                  >完成率: {{ vipSopStats.completionRate.toFixed(1) }}%</Tag
                >
              </div>
            </div>
          </div>
          <Empty v-else description="暂无数据" />
        </Card>
      </Col>
    </Row>

    <!-- Referral Leaderboard -->
    <Row :gutter="[16, 16]">
      <Col :span="24">
        <Card title="推荐排行榜 🏆" :loading="loadingLeaderboard">
          <Table
            :columns="leaderboardColumns"
            :data-source="leaderboard?.leaderboard || []"
            :pagination="false"
            :scroll="{ x: 600 }"
            row-key="customerId"
          >
            <template #emptyText>
              <Empty description="暂无推荐数据" />
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<style scoped lang="less">
.retail-dashboard {
  padding: 16px;

  .page-header {
    margin-bottom: 24px;

    h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    p {
      color: rgba(0, 0, 0, 0.45);
      margin: 0;
    }
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  .level-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .count {
        font-weight: 500;
      }
    }

    .level-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .sop-stats {
    .sop-item {
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;

      .sop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
      }

      .sop-progress {
        .progress-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            width: 60px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.65);
          }

          .value {
            width: 40px;
            text-align: right;
            font-size: 12px;
            font-weight: 500;
          }

          :deep(.ant-progress) {
            flex: 1;
          }
        }
      }

      .sop-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e8e8e8;
      }
    }
  }
}
</style>
