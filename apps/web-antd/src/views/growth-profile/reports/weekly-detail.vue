<script lang="ts" setup>
/**
 * 周报详情页面
 * Phase 1: 占位组件（Phase 2 实现完整功能）
 *
 * 计划功能：
 * - 本周学习数据汇总
 * - 时间机器对比（vs上周）
 * - AI 生成家长话术
 * - 分享到微信/下载 PDF
 */
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Empty, Button, Space } from 'ant-design-vue';
import { ArrowLeftOutlined, ShareAltOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import MigrationNotice from '#/components/MigrationNotice.vue';

const route = useRoute();
const router = useRouter();
const reportId = ref(route.params.id as string);

const goBack = () => {
  router.push('/growth-profile/reports');
};
</script>

<template>
  <div class="weekly-report-detail">
    <!-- 迁移提示 -->
    <MigrationNotice />

    <Card :bordered="false">
      <template #title>
        <Space>
          <Button type="text" @click="goBack">
            <ArrowLeftOutlined />
          </Button>
          周报详情 #{{ reportId }}
        </Space>
      </template>
      <template #extra>
        <Space>
          <Button disabled>
            <ShareAltOutlined />
            分享
          </Button>
          <Button type="primary" disabled>
            <DownloadOutlined />
            下载 PDF
          </Button>
        </Space>
      </template>

      <Empty description="功能开发中...">
        <p style="margin-top: 16px; color: #999">
          此功能将在 Phase 2 实现
        </p>
        <p style="color: #999">
          计划功能：本周数据汇总、时间机器对比、AI 家长话术、分享/下载
        </p>
      </Empty>
    </Card>
  </div>
</template>

<style scoped>
.weekly-report-detail {
  padding: 16px;
}
</style>
