<template>
  <Page
    title="数据同步"
    description="从企业微信同步员工和客户数据"
  >
    <!-- 顶部统计卡片 -->
    <Row :gutter="16" class="mb-6">
      <Col :span="8">
        <div class="stats-card">
          <div class="stats-icon">
            <UserOutlined class="text-blue-500" />
          </div>
          <div class="stats-info">
            <div class="stats-label">已同步员工</div>
            <div class="stats-value">{{ syncStats.users.total }} <span class="text-gray-400 text-sm">人</span></div>
            <div class="stats-time" v-if="syncStats.users.lastSyncAt">
              最后同步: {{ formatTime(syncStats.users.lastSyncAt) }}
            </div>
          </div>
        </div>
      </Col>
      <Col :span="8">
        <div class="stats-card">
          <div class="stats-icon">
            <TeamOutlined class="text-purple-500" />
          </div>
          <div class="stats-info">
            <div class="stats-label">已同步客户</div>
            <div class="stats-value">{{ syncStats.customers.total }} <span class="text-gray-400 text-sm">人</span></div>
            <div class="stats-time" v-if="syncStats.customers.lastSyncAt">
              最后同步: {{ formatTime(syncStats.customers.lastSyncAt) }}
            </div>
          </div>
        </div>
      </Col>
      <Col :span="8">
        <div class="stats-card">
          <div class="stats-icon">
            <LinkOutlined class="text-cyan-500" />
          </div>
          <div class="stats-info">
            <div class="stats-label">跟进关系</div>
            <div class="stats-value">{{ syncStats.customers.relations }} <span class="text-gray-400 text-sm">条</span></div>
            <div class="stats-time" v-if="syncStats.customers.lastSyncAt">
              更新时间: {{ formatTime(syncStats.customers.lastSyncAt) }}
            </div>
          </div>
        </div>
      </Col>
    </Row>

    <!-- 同步操作卡片 -->
    <Card class="sync-card">
      <template #title>
        <div class="card-header">
          <div class="card-title">
            <SyncOutlined class="mr-2" />
            同步操作
          </div>
        </div>
      </template>

      <Alert
        v-if="!syncStats.isConfigured"
        type="warning"
        message="企业微信未配置"
        description="请先在企业微信配置页面完成配置"
        show-icon
        class="mb-4"
      />

      <Alert
        v-else-if="!syncStats.isEnabled"
        type="warning"
        message="企业微信未启用"
        description="请在企业微信配置页面启用集成"
        show-icon
        class="mb-4"
      />

      <div class="sync-actions">
        <div class="sync-action-item">
          <div class="action-info">
            <UserOutlined class="action-icon text-blue-500" />
            <div>
              <div class="action-title">同步员工</div>
              <div class="action-desc">从企微拉取通讯录中的员工和部门信息</div>
            </div>
          </div>
          <Button
            size="large"
            :loading="syncingUsers"
            :disabled="!syncStats.isConfigured || !syncStats.isEnabled"
            @click="handleSyncUsers"
          >
            <template #icon><SyncOutlined /></template>
            立即同步
          </Button>
        </div>

        <Divider class="my-4" />

        <div class="sync-action-item">
          <div class="action-info">
            <TeamOutlined class="action-icon text-purple-500" />
            <div>
              <div class="action-title">同步客户</div>
              <div class="action-desc">从企微拉取外部联系人（客户）及跟进关系</div>
            </div>
          </div>
          <Button
            size="large"
            :loading="syncingCustomers"
            :disabled="!syncStats.isConfigured || !syncStats.isEnabled"
            @click="handleSyncCustomers"
          >
            <template #icon><SyncOutlined /></template>
            立即同步
          </Button>
        </div>

        <Divider class="my-4" />

        <div class="sync-action-item">
          <div class="action-info">
            <CloudSyncOutlined class="action-icon text-green-500" />
            <div>
              <div class="action-title">全量同步</div>
              <div class="action-desc">一键同步所有员工和客户数据（推荐首次使用）</div>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            :loading="syncingAll"
            :disabled="!syncStats.isConfigured || !syncStats.isEnabled"
            @click="handleSyncAll"
          >
            <template #icon><SyncOutlined /></template>
            全量同步
          </Button>
        </div>
      </div>

      <Alert
        v-if="lastSyncResult"
        :type="lastSyncResult.success ? 'success' : 'error'"
        :message="lastSyncResult.message"
        show-icon
        closable
        class="mt-4"
        @close="lastSyncResult = null"
      />
    </Card>

    <!-- 同步说明 -->
    <Card class="help-card mt-6">
      <template #title>
        <div class="help-title">
          <InfoCircleOutlined class="mr-2" />
          同步说明
        </div>
      </template>

      <div class="notice-list">
        <div class="notice-item">
          <ClockCircleOutlined class="notice-icon" />
          <span>首次同步可能需要较长时间，请耐心等待</span>
        </div>
        <div class="notice-item">
          <SafetyCertificateOutlined class="notice-icon" />
          <span>同步操作是安全的，不会删除任何数据</span>
        </div>
        <div class="notice-item">
          <ReloadOutlined class="notice-icon" />
          <span>增量同步只会更新变化的数据，推荐定期执行</span>
        </div>
        <div class="notice-item">
          <ThunderboltOutlined class="notice-icon" />
          <span>配置回调后，客户数据可自动实时同步</span>
        </div>
      </div>
    </Card>
  </Page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Row, Col, Card, Button, Alert, Divider } from 'ant-design-vue';
import {
  UserOutlined,
  TeamOutlined,
  LinkOutlined,
  SyncOutlined,
  CloudSyncOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface SyncStatsItem {
  total: number;
  synced: number;
  lastSyncAt: string | null;
}

interface CustomerSyncStatsItem extends SyncStatsItem {
  relations: number;
}

interface SyncStats {
  users: SyncStatsItem;
  customers: CustomerSyncStatsItem;
  isConfigured: boolean;
  isEnabled: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
}

const syncStats = ref<SyncStats>({
  users: { total: 0, synced: 0, lastSyncAt: null },
  customers: { total: 0, synced: 0, lastSyncAt: null, relations: 0 },
  isConfigured: false,
  isEnabled: false,
});

const syncingUsers = ref(false);
const syncingCustomers = ref(false);
const syncingAll = ref(false);
const lastSyncResult = ref<SyncResult | null>(null);

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const fetchSyncStats = async () => {
  try {
    const res = await requestClient.get<SyncStats>('/wecom/sync/stats');
    syncStats.value = res;
  } catch (error: any) {
    console.error('获取同步统计失败', error);
  }
};

const handleSyncUsers = async () => {
  syncingUsers.value = true;
  lastSyncResult.value = null;
  try {
    // 增加超时时间到 5 分钟
    const res = await requestClient.post<{
      success: boolean;
      totalUsers: number;
      created: number;
      updated: number;
      failed: number;
    }>('/wecom/sync/users', {}, { timeout: 300000 });

    lastSyncResult.value = {
      success: res.success,
      message: `员工同步完成：新增 ${res.created} 人，更新 ${res.updated} 人${res.failed > 0 ? `，失败 ${res.failed} 人` : ''}`,
    };
    await fetchSyncStats();
  } catch (error: any) {
    lastSyncResult.value = {
      success: false,
      message: error.message || '员工同步失败',
    };
  } finally {
    syncingUsers.value = false;
  }
};

const handleSyncCustomers = async () => {
  syncingCustomers.value = true;
  lastSyncResult.value = null;
  try {
    // 增加超时时间到 5 分钟
    const res = await requestClient.post<{
      success: boolean;
      totalCustomers: number;
      created: number;
      updated: number;
      failed: number;
      relationsCreated: number;
    }>('/wecom/sync/customers', {}, { timeout: 300000 });

    lastSyncResult.value = {
      success: res.success,
      message: `客户同步完成：新增 ${res.created} 人，更新 ${res.updated} 人，关系 ${res.relationsCreated} 条${res.failed > 0 ? `，失败 ${res.failed} 人` : ''}`,
    };
    await fetchSyncStats();
  } catch (error: any) {
    lastSyncResult.value = {
      success: false,
      message: error.message || '客户同步失败',
    };
  } finally {
    syncingCustomers.value = false;
  }
};

const handleSyncAll = async () => {
  syncingAll.value = true;
  lastSyncResult.value = null;

  // 显示同步进行中的提示
  message.loading('正在同步数据，这可能需要几分钟时间...', 0);

  try {
    // 增加超时时间到 10 分钟（大量数据同步需要更长时间）
    const res = await requestClient.post<{
      success: boolean;
      users: { created: number; updated: number; failed: number };
      customers: { created: number; updated: number; failed: number; relationsCreated: number };
    }>('/wecom/sync/all', {}, { timeout: 600000 });

    message.destroy();

    lastSyncResult.value = {
      success: res.success,
      message: `全量同步完成：员工 ${res.users.created}/${res.users.updated}，客户 ${res.customers.created}/${res.customers.updated}，关系 ${res.customers.relationsCreated} 条`,
    };

    message.success('同步完成！');
    await fetchSyncStats();
  } catch (error: any) {
    message.destroy();

    // 如果是超时错误，给出友好提示
    if (error.message && error.message.includes('timeout')) {
      lastSyncResult.value = {
        success: false,
        message: '同步请求超时，但后台仍在继续同步。请稍后刷新页面查看同步结果。',
      };
      message.warning('请求超时，但同步仍在后台进行，请稍后查看结果');

      // 30秒后自动刷新统计
      setTimeout(() => {
        fetchSyncStats();
      }, 30000);
    } else {
      lastSyncResult.value = {
        success: false,
        message: error.message || '全量同步失败',
      };
      message.error('同步失败');
    }
  } finally {
    syncingAll.value = false;
  }
};

onMounted(() => {
  fetchSyncStats();
});
</script>

<style scoped>
/* 统计卡片 */
.stats-card {
  background: var(--component-background, #fff);
  border: 1px solid var(--border-color, #f0f0f0);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s;
}

.stats-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #1890ff;
}

.stats-icon {
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-info {
  flex: 1;
}

.stats-label {
  color: var(--text-color-secondary, #666);
  font-size: 14px;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-color, #333);
  margin-bottom: 4px;
}

.stats-time {
  font-size: 12px;
  color: var(--text-color-secondary, #999);
}

/* 同步卡片 */
.sync-card {
  border-radius: 12px;
}

.sync-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  padding: 16px 24px;
}

.sync-card :deep(.ant-card-body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

/* 同步操作 */
.sync-actions {
  padding: 8px 0;
}

.sync-action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.action-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  font-size: 32px;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color, #333);
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: var(--text-color-secondary, #999);
}

/* 帮助卡片 */
.help-card {
  border-radius: 12px;
}

.help-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  padding: 12px 20px;
  min-height: auto;
}

.help-card :deep(.ant-card-body) {
  padding: 20px;
}

.help-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

/* 注意事项 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--text-color, #333);
  line-height: 1.5;
}

.notice-icon {
  color: var(--text-color-secondary, #999);
  margin-top: 3px;
  flex-shrink: 0;
}

/* 暗色模式适配 */
:deep(.dark) {
  .stats-card {
    background: #1f1f1f;
    border-color: #303030;
  }

  .stats-card:hover {
    border-color: #177ddc;
  }
}
</style>
