<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Button, Space, message, Spin, Breadcrumb } from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import PipelineEditor from './components/PipelineEditor.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const pipeline = ref<any>(null);
const pipelineKey = ref(route.params.key as string);

// Fetch pipeline details
const fetchPipeline = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get(
      `/ai-studio/pipelines/${pipelineKey.value}`,
    );
    pipeline.value = response.data || response;
  } catch (error) {
    console.error('Failed to fetch pipeline:', error);
    message.error('获取流程详情失败');
  } finally {
    loading.value = false;
  }
};

// Save pipeline steps
const handleSave = async (steps: any[]) => {
  try {
    await requestClient.put(`/ai-studio/pipelines/${pipelineKey.value}`, {
      steps,
    });
    message.success('流程已保存');

    // Refresh pipeline data
    await fetchPipeline();
  } catch (error: any) {
    console.error('Failed to save pipeline:', error);
    const errorMsg = error?.response?.data?.message || '保存失败';
    message.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }
};

// Go back to list
const goBack = () => {
  router.push('/ai-studio/pipeline');
};

onMounted(() => {
  fetchPipeline();
});
</script>

<template>
  <div class="pipeline-edit">
    <Card>
      <template #title>
        <Space>
          <Button type="link" @click="goBack">
            <template #icon><ArrowLeftOutlined /></template>
          </Button>
          <Breadcrumb>
            <Breadcrumb.Item>AI 工作室</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a @click="goBack">流程管理</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>编辑流程</Breadcrumb.Item>
          </Breadcrumb>
        </Space>
      </template>

      <template #extra>
        <Space>
          <span v-if="pipeline">{{ pipeline.name }}</span>
          <span v-if="pipeline" style="color: #999; font-size: 12px">
            v{{ pipeline.version }}
          </span>
        </Space>
      </template>

      <Spin :spinning="loading" tip="加载中...">
        <PipelineEditor
          v-if="pipeline"
          :pipeline-key="pipelineKey"
          :steps="pipeline.steps"
          @save="handleSave"
        />
        <div v-else-if="!loading" class="empty-state">
          <p>未找到流程</p>
          <Button @click="goBack">返回列表</Button>
        </div>
      </Spin>
    </Card>
  </div>
</template>

<style scoped>
.pipeline-edit {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #999;
}
</style>
