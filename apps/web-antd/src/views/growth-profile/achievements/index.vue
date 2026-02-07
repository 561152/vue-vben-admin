<template>
  <div class="achievements-page">
    <!-- 成就统计 -->
    <Card class="mb-4">
      <Row :gutter="16">
        <Col :span="6">
          <Statistic title="获得成就" :value="stats.total" prefix="🏆" />
        </Col>
        <Col :span="6">
          <Statistic title="累计积分" :value="stats.totalPoints" prefix="⭐" />
        </Col>
        <Col :span="6">
          <Statistic
            title="学习成就"
            :value="stats.byType['STUDY'] || 0"
            prefix="📚"
          />
        </Col>
        <Col :span="6">
          <Statistic
            title="进步成就"
            :value="stats.byType['IMPROVEMENT'] || 0"
            prefix="📈"
          />
        </Col>
      </Row>
    </Card>

    <!-- 荣誉墙 -->
    <Card title="🏆 荣誉墙" :loading="loading">
      <template #extra>
        <Space>
          <Select v-model:value="filterOrigin" placeholder="筛选来源" style="width: 150px">
            <SelectOption value="all">全部</SelectOption>
            <SelectOption value="PRESCRIPTION">处方完成</SelectOption>
            <SelectOption value="DIAGNOSIS">能力提升</SelectOption>
            <SelectOption value="MANUAL">家长颁发</SelectOption>
            <SelectOption value="SYSTEM">系统自动</SelectOption>
          </Select>
          <Select v-model:value="filterType" placeholder="筛选类型" style="width: 150px">
            <SelectOption value="all">全部</SelectOption>
            <SelectOption value="STUDY">学习成就</SelectOption>
            <SelectOption value="ATTENDANCE">出勤成就</SelectOption>
            <SelectOption value="IMPROVEMENT">进步成就</SelectOption>
            <SelectOption value="SPECIAL">特殊成就</SelectOption>
          </Select>
        </Space>
      </template>

      <Row :gutter="[16, 16]">
        <Col
          v-for="item in filteredAchievements"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <Card
            hoverable
            class="achievement-card"
            :body-style="{ padding: '16px' }"
            @click="showDetail(item)"
          >
            <div class="achievement-content">
              <!-- 图标 -->
              <div class="achievement-icon">
                {{ item.achievement.icon || '🏅' }}
              </div>

              <!-- 名称 -->
              <h4 class="achievement-name">
                {{ item.achievement.name }}
              </h4>

              <!-- 描述 -->
              <p class="achievement-description">
                {{ item.achievement.description }}
              </p>

              <!-- 来源标签 -->
              <Tag :color="getOriginColor(item.origin)">
                {{ getOriginLabel(item.origin) }}
              </Tag>

              <!-- 获得时间 -->
              <div class="achievement-date">
                {{ formatDate(item.grantedAt) }}
              </div>

              <!-- 积分 -->
              <div class="achievement-points">
                +{{ item.achievement.points }} 分
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 空状态 -->
      <Empty v-if="achievements.length === 0" description="暂无成就" />
    </Card>

    <!-- 成就详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="🏆 成就详情"
      width="600px"
      :footer="null"
    >
      <div v-if="selectedAchievement" class="achievement-detail">
        <!-- 成就图标 -->
        <div class="detail-icon">
          {{ selectedAchievement.achievement.icon || '🏅' }}
        </div>

        <!-- 成就名称 -->
        <h2 class="detail-name">
          {{ selectedAchievement.achievement.name }}
        </h2>

        <!-- 成就描述 -->
        <p class="detail-description">
          {{ selectedAchievement.achievement.description }}
        </p>

        <Divider />

        <!-- 获得原因 -->
        <Card title="获得原因" size="small" class="mb-4">
          <Timeline>
            <TimelineItem color="blue">
              {{ getOriginDescription(selectedAchievement) }}
            </TimelineItem>
            <TimelineItem v-if="selectedAchievement.message" color="green">
              家长寄语：{{ selectedAchievement.message }}
            </TimelineItem>
            <TimelineItem color="gray">
              获得时间：{{ formatDateTime(selectedAchievement.grantedAt) }}
            </TimelineItem>
          </Timeline>
        </Card>

        <!-- 触发数据详情 -->
        <Card
          v-if="selectedAchievement.triggerData"
          title="数据详情"
          size="small"
        >
          <Descriptions bordered size="small" :column="1">
            <DescriptionsItem
              v-for="(value, key) in selectedAchievement.triggerData"
              :key="key"
              :label="formatKey(key)"
            >
              {{ formatValue(key, value) }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Empty,
  Modal,
  Timeline,
  TimelineItem,
  Divider,
  Descriptions,
  DescriptionsItem,
  Space,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

interface StudentAchievement {
  id: string;
  grantedAt: Date;
  message: string | null;
  origin: string | null;
  sourceId: string | null;
  triggerData: Record<string, any>;
  achievement: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    type: string;
    points: number;
  };
}

interface AchievementStats {
  total: number;
  byType: Record<string, number>;
  byOrigin: Record<string, number>;
  totalPoints: number;
  recentAchievements: any[];
}

const route = useRoute();
const studentId = computed(() => route.params.studentId as string);

const loading = ref(false);
const achievements = ref<StudentAchievement[]>([]);
const stats = ref<AchievementStats>({
  total: 0,
  byType: {},
  byOrigin: {},
  totalPoints: 0,
  recentAchievements: [],
});

const detailVisible = ref(false);
const selectedAchievement = ref<StudentAchievement | null>(null);

const filterOrigin = ref<string>('all');
const filterType = ref<string>('all');

// 筛选后的成就列表
const filteredAchievements = computed(() => {
  let result = achievements.value;

  if (filterOrigin.value !== 'all') {
    result = result.filter((a) => a.origin === filterOrigin.value);
  }

  if (filterType.value !== 'all') {
    result = result.filter((a) => a.achievement.type === filterType.value);
  }

  return result;
});

// 获取成就列表
const fetchAchievements = async () => {
  try {
    loading.value = true;

    const response = await axios.get(
      `/api/lms/growth-profile/achievements/${studentId.value}`,
    );

    achievements.value = response.data.items || [];
  } catch (error) {
    console.error('获取成就列表失败:', error);
    message.error('获取成就列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取成就统计
const fetchStats = async () => {
  try {
    const response = await axios.get(
      `/api/lms/growth-profile/achievements/${studentId.value}/stats`,
    );

    stats.value = response.data;
  } catch (error) {
    console.error('获取成就统计失败:', error);
  }
};

// 显示成就详情
const showDetail = async (achievement: StudentAchievement) => {
  selectedAchievement.value = achievement;
  detailVisible.value = true;
};

// 获取来源颜色
const getOriginColor = (origin: string | null): string => {
  const colors: Record<string, string> = {
    PRESCRIPTION: 'blue',
    DIAGNOSIS: 'green',
    MANUAL: 'gold',
    SYSTEM: 'default',
  };
  return colors[origin || ''] || 'default';
};

// 获取来源标签
const getOriginLabel = (origin: string | null): string => {
  const labels: Record<string, string> = {
    PRESCRIPTION: '处方完成',
    DIAGNOSIS: '能力提升',
    MANUAL: '家长颁发',
    SYSTEM: '系统自动',
  };
  return labels[origin || ''] || '未知来源';
};

// 获取来源描述
const getOriginDescription = (achievement: StudentAchievement): string => {
  switch (achievement.origin) {
    case 'PRESCRIPTION':
      return `完成了学习处方「${achievement.triggerData?.prescriptionTitle || '学习处方'}」`;
    case 'DIAGNOSIS':
      return `诊断提升达到「${achievement.triggerData?.improvementRate || 0}%」`;
    case 'MANUAL':
      return `家长手动颁发`;
    case 'SYSTEM':
      return `系统自动颁发`;
    default:
      return '未知来源';
  }
};

// 格式化日期
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

// 格式化日期时间
const formatDateTime = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化键名
const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    prescriptionTitle: '处方名称',
    completionRate: '完成率',
    totalCompleted: '累计完成数',
    improvementRate: '提升率',
    abilityType: '能力类型',
    threshold: '目标阈值',
    totalCount: '累计次数',
    milestone: '里程碑',
    avgAccuracy: '平均准确率',
    recentCount: '统计次数',
    consecutiveDays: '连续天数',
  };
  return keyMap[key] || key;
};

// 格式化值
const formatValue = (key: string, value: any): string => {
  if (key.includes('Rate') || key.includes('Accuracy')) {
    return `${value}%`;
  }
  if (key.includes('Days')) {
    return `${value} 天`;
  }
  if (key.includes('Count')) {
    return `${value} 次`;
  }
  return String(value);
};

onMounted(() => {
  fetchAchievements();
  fetchStats();
});
</script>

<style scoped lang="scss">
.achievements-page {
  padding: 24px;
}

.achievement-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.achievement-content {
  text-align: center;
}

.achievement-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.achievement-name {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0;
  color: #262626;
}

.achievement-description {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
  min-height: 36px;
}

.achievement-date {
  font-size: 12px;
  color: #bfbfbf;
  margin-top: 8px;
}

.achievement-points {
  font-size: 14px;
  color: #fa8c16;
  font-weight: 600;
  margin-top: 4px;
}

.achievement-detail {
  text-align: center;
}

.detail-icon {
  font-size: 72px;
  margin-bottom: 16px;
}

.detail-name {
  font-size: 24px;
  font-weight: 600;
  margin: 8px 0;
}

.detail-description {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 16px;
}
</style>
