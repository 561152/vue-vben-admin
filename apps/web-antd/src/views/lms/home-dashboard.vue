<template>
  <div class="lms-home-dashboard">
    <!-- 欢迎卡片 -->
    <Card class="welcome-card mb-4">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>{{ greetingMessage }}，{{ userName }}</h2>
          <p class="text-gray-500">
            今天已完成 {{ stats.todayStats.gradingCount }} 次作业，继续加油！
          </p>
        </div>
        <div class="welcome-avatar">
          <Avatar :size="64" :src="userAvatar">
            {{ userName?.charAt(0) }}
          </Avatar>
        </div>
      </div>
    </Card>

    <!-- 快捷操作 -->
    <Card title="🚀 快捷操作" class="mb-4">
      <Row :gutter="16">
        <Col :xs="24" :sm="8">
          <Card
            hoverable
            class="quick-action-card"
            @click="goTo('/ai-tutor/quick-grading')"
          >
            <div class="action-content">
              <CameraOutlined class="action-icon" style="color: #1890ff" />
              <h3>拍照批改</h3>
              <p class="text-gray-500">
                今日已批 {{ quickActions.todayGradingCount }} 次
              </p>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="8">
          <Card hoverable class="quick-action-card" @click="goTo('/chat')">
            <div class="action-content">
              <MessageOutlined class="action-icon" style="color: #52c41a" />
              <h3>新建会话</h3>
              <p class="text-gray-500">统一智能体入口</p>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="8">
          <Card
            hoverable
            class="quick-action-card"
            @click="goTo('/ai-doctor/diagnosis')"
          >
            <div class="action-content">
              <MedicineBoxOutlined class="action-icon" style="color: #fa8c16" />
              <h3>本周诊断</h3>
              <p class="text-gray-500">
                本周已诊断 {{ quickActions.weeklyDiagnosisCount }} 次
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>

    <Row :gutter="16">
      <!-- 待处理事项 -->
      <Col :xs="24" :lg="12">
        <Card title="📋 待处理事项" class="mb-4" :loading="loading">
          <List
            :data-source="pendingTasks"
            :locale="{ emptyText: '暂无待处理事项' }"
          >
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta>
                  <template #title>
                    <a @click="handleTask(item)">
                      <Tag :color="getPriorityColor(item.priority)">
                        {{ getPriorityLabel(item.priority) }}
                      </Tag>
                      {{ item.title }}
                    </a>
                  </template>
                  <template #description>{{ item.description }}</template>
                </ListItemMeta>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>

      <!-- 实时统计 -->
      <Col :xs="24" :lg="12">
        <Card title="📊 学习统计" class="mb-4">
          <Tabs v-model:activeKey="statsTab">
            <TabPane key="today" tab="今日">
              <Row :gutter="16">
                <Col :span="8">
                  <Statistic
                    title="批改次数"
                    :value="stats.todayStats.gradingCount"
                    prefix="📝"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="学习时长"
                    :value="stats.todayStats.studyMinutes"
                    suffix="分钟"
                    prefix="⏱️"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="准确率"
                    :value="stats.todayStats.accuracy"
                    suffix="%"
                    prefix="✓"
                    :value-style="{
                      color: getAccuracyColor(stats.todayStats.accuracy),
                    }"
                  />
                </Col>
              </Row>
            </TabPane>

            <TabPane key="week" tab="本周">
              <Row :gutter="16">
                <Col :span="8">
                  <Statistic
                    title="批改次数"
                    :value="stats.weeklyStats.gradingCount"
                    prefix="📝"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="打卡天数"
                    :value="stats.weeklyStats.studyDays"
                    suffix="天"
                    prefix="📅"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="平均准确率"
                    :value="stats.weeklyStats.averageAccuracy"
                    suffix="%"
                    prefix="✓"
                    :value-style="{
                      color: getAccuracyColor(
                        stats.weeklyStats.averageAccuracy,
                      ),
                    }"
                  />
                </Col>
              </Row>
            </TabPane>

            <TabPane key="month" tab="本月">
              <Row :gutter="16">
                <Col :span="8">
                  <Statistic
                    title="批改次数"
                    :value="stats.monthlyStats.gradingCount"
                    prefix="📝"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="完成处方"
                    :value="stats.monthlyStats.completedPrescriptions"
                    suffix="个"
                    prefix="💊"
                  />
                </Col>
                <Col :span="8">
                  <Statistic
                    title="获得成就"
                    :value="stats.monthlyStats.achievementCount"
                    suffix="个"
                    prefix="🏆"
                  />
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </Col>
    </Row>

    <!-- 最近成就 -->
    <Card title="🏆 最近成就" class="mb-4" v-if="recentAchievements.length > 0">
      <Row :gutter="16">
        <Col
          v-for="achievement in recentAchievements"
          :key="achievement.id"
          :xs="24"
          :sm="8"
        >
          <Card hoverable class="achievement-mini-card">
            <div class="achievement-mini-content">
              <div class="achievement-mini-icon">{{ achievement.icon }}</div>
              <div class="achievement-mini-info">
                <h4>{{ achievement.name }}</h4>
                <p class="text-gray-500">
                  {{ formatDate(achievement.grantedAt) }}
                </p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>

    <!-- 模块入口 -->
    <Row :gutter="16">
      <Col :xs="24" :sm="8">
        <Card
          title="📚 AI 教师"
          hoverable
          class="module-card"
          @click="goTo('/ai-tutor')"
        >
          <ul class="module-menu">
            <li>
              <a @click.stop="goTo('/ai-tutor/quick-grading')">拍照批改</a>
            </li>
            <li>
              <a @click.stop="goTo('/ai-tutor/calculator')">数学计算器</a>
            </li>
            <li>
              <a @click.stop="goTo('/ai-tutor/grading-history')">批改历史</a>
            </li>
            <li>
              <a @click.stop="goTo('/ai-tutor/question-bank')">题库导入</a>
            </li>
          </ul>
        </Card>
      </Col>

      <Col :xs="24" :sm="8">
        <Card
          title="🏥 AI 学习医生"
          hoverable
          class="module-card"
          @click="goTo('/ai-doctor')"
        >
          <ul class="module-menu">
            <li><a @click.stop="goTo('/ai-doctor/diagnosis')">诊断中心</a></li>
            <li>
              <a @click.stop="goTo('/ai-doctor/prescription')">学习处方</a>
            </li>
            <li><a @click.stop="goTo('/ai-doctor/follow-up')">复诊追踪</a></li>
            <li><a @click.stop="goTo('/ai-doctor/counselor')">AI 咨询师</a></li>
            <li>
              <a @click.stop="goTo('/ai-doctor/parent-report')">家长报告</a>
            </li>
          </ul>
        </Card>
      </Col>

      <Col :xs="24" :sm="8">
        <Card
          title="📈 成长档案"
          hoverable
          class="module-card"
          @click="goTo('/growth-profile')"
        >
          <ul class="module-menu">
            <li>
              <a @click.stop="goTo('/growth-profile/progress')">学习进度</a>
            </li>
            <li>
              <a @click.stop="goTo('/growth-profile/achievements')">荣誉墙</a>
            </li>
            <li>
              <a @click.stop="goTo('/growth-profile/reports')">阶段报告</a>
            </li>
          </ul>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@vben/stores';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Avatar,
  List,
  ListItem,
  ListItemMeta,
  Tag,
  Statistic,
  Tabs,
  TabPane,
  message,
} from 'ant-design-vue';
import {
  CameraOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const statsTab = ref<string>('today');

// 用户信息
const userName = computed(
  () =>
    userStore.userInfo?.realName || userStore.userInfo?.username || '学习者',
);
const userAvatar = computed(() => userStore.userInfo?.avatar || '');

// 问候语
const greetingMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 快捷操作统计
const quickActions = ref({
  todayGradingCount: 0,
  weeklyDiagnosisCount: 0,
  activeTutorSessions: 0,
});

// 待处理事项
const pendingTasks = ref<any[]>([]);

// 实时统计
const stats = ref({
  todayStats: {
    gradingCount: 0,
    studyMinutes: 0,
    accuracy: 0,
  },
  weeklyStats: {
    gradingCount: 0,
    studyDays: 0,
    averageAccuracy: 0,
  },
  monthlyStats: {
    gradingCount: 0,
    completedPrescriptions: 0,
    achievementCount: 0,
  },
});

// 最近成就
const recentAchievements = ref<any[]>([]);

// 加载首页数据
const loadDashboardData = async () => {
  try {
    loading.value = true;

    const response = await axios.get('/api/lms/dashboard/overview');

    quickActions.value = response.data.quickActions;
    pendingTasks.value = response.data.pendingTasks;
    stats.value = response.data.realtimeStats;
    recentAchievements.value = response.data.recentAchievements;
  } catch (error) {
    console.error('加载首页数据失败:', error);
    message.error('加载首页数据失败');
  } finally {
    loading.value = false;
  }
};

// 路由跳转
const goTo = (path: string) => {
  router.push(path);
};

// 处理待办事项
const handleTask = (task: any) => {
  router.push(task.url);
};

// 获取优先级颜色
const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    HIGH: 'red',
    MEDIUM: 'orange',
    LOW: 'default',
  };
  return colors[priority] || 'default';
};

// 获取优先级标签
const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    HIGH: '紧急',
    MEDIUM: '普通',
    LOW: '低',
  };
  return labels[priority] || '普通';
};

// 获取准确率颜色
const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 90) return '#52c41a';
  if (accuracy >= 70) return '#faad14';
  return '#f5222d';
};

// 格式化日期
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('MM-DD');
};

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped lang="scss">
.lms-home-dashboard {
  padding: 24px;
}

.welcome-card {
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  :deep(.ant-card-body) {
    padding: 24px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-text {
  h2 {
    margin-bottom: 8px;
    font-size: 24px;
    color: white;
  }

  p {
    color: rgb(255 255 255 / 85%);
  }
}

.quick-action-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    transform: translateY(-4px);
  }
}

.action-content {
  padding: 16px 0;
  text-align: center;

  .action-icon {
    margin-bottom: 12px;
    font-size: 48px;
  }

  h3 {
    margin: 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin-top: 8px;
    font-size: 14px;
  }
}

.achievement-mini-card {
  height: 100%;
}

.achievement-mini-content {
  display: flex;
  gap: 12px;
  align-items: center;
}

.achievement-mini-icon {
  flex-shrink: 0;
  font-size: 36px;
}

.achievement-mini-info {
  flex: 1;

  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 12px;
  }
}

.module-card {
  height: 100%;
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    transform: translateY(-4px);
  }
}

.module-menu {
  padding: 0;
  margin: 0;
  list-style: none;

  li {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    a {
      color: #1890ff;
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: #40a9ff;
      }
    }
  }
}
</style>
