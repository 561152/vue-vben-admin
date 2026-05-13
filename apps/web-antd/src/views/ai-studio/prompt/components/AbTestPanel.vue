<script lang="tsx" setup>
import { ref, watch } from 'vue';

import {
  DeleteOutlined,
  ExperimentOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import {
  Badge,
  Button,
  Empty,
  message,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'ant-design-vue';
import type { ColumnsType } from 'ant-design-vue/es/table';

import {
  type AbTestResponse,
  AbTestStatus,
  deleteAbTest,
  getAbTests,
  updateAbTest,
} from '#/api/ai-studio/prompt-ab-testing';

import AbTestCreateModal from './AbTestCreateModal.vue';
import AbTestResultsDrawer from './AbTestResultsDrawer.vue';

interface Props {
  templateId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const tests = ref<AbTestResponse[]>([]);

// 创建弹窗
const createModalVisible = ref(false);

// 结果抽屉
const resultsDrawerVisible = ref(false);
const selectedTestId = ref('');

const statusConfig: Record<string, { color: string; label: string }> = {
  [AbTestStatus.DRAFT]: { color: 'default', label: '草稿' },
  [AbTestStatus.ACTIVE]: { color: 'processing', label: '运行中' },
  [AbTestStatus.PAUSED]: { color: 'warning', label: '已暂停' },
  [AbTestStatus.COMPLETED]: { color: 'success', label: '已完成' },
};

const loadTests = async () => {
  if (!props.templateId) return;
  loading.value = true;
  try {
    tests.value = await getAbTests(props.templateId);
  } catch {
    message.error('加载 A/B 测试列表失败');
  } finally {
    loading.value = false;
  }
};

const handleActivate = async (test: AbTestResponse) => {
  try {
    await updateAbTest(props.templateId, test.id, {
      status: AbTestStatus.ACTIVE,
    });
    message.success('测试已激活');
    await loadTests();
  } catch {
    message.error('激活失败');
  }
};

const handlePause = async (test: AbTestResponse) => {
  try {
    await updateAbTest(props.templateId, test.id, {
      status: AbTestStatus.PAUSED,
    });
    message.success('测试已暂停');
    await loadTests();
  } catch {
    message.error('暂停失败');
  }
};

const handleDelete = async (test: AbTestResponse) => {
  try {
    await deleteAbTest(props.templateId, test.id);
    message.success('测试已删除');
    await loadTests();
  } catch {
    message.error('删除失败');
  }
};

const handleViewResults = (test: AbTestResponse) => {
  selectedTestId.value = test.id;
  resultsDrawerVisible.value = true;
};

const columns: ColumnsType<AbTestResponse> = [
  {
    title: '测试名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
    customRender: ({ text }: { text: string }) => {
      const config = statusConfig[text] || { color: 'default', label: text };
      return (
        <Badge
          status={
            config.color as 'default' | 'processing' | 'success' | 'warning'
          }
          text={config.label}
        />
      );
    },
  },
  {
    title: '对照/实验版本',
    key: 'versions',
    width: 160,
    customRender: ({ record }: { record: AbTestResponse }) => (
      <Space size="small">
        <Tag color="blue">v{record.controlVersionId}</Tag>
        <span>vs</span>
        <Tag color="green">v{record.treatmentVersionId}</Tag>
      </Space>
    ),
  },
  {
    title: '流量比',
    dataIndex: 'trafficPercentage',
    key: 'trafficPercentage',
    width: 100,
    align: 'center' as const,
    customRender: ({ text }: { text: number }) => `${100 - text}/${text}`,
  },
  {
    title: '执行进度',
    key: 'progress',
    width: 160,
    customRender: ({ record }: { record: AbTestResponse }) => {
      if (!record.targetExecutions) {
        return (
          <Typography.Text type="secondary">
            {record.currentExecutions} 次
          </Typography.Text>
        );
      }
      const percent = Math.min(
        Math.round((record.currentExecutions / record.targetExecutions) * 100),
        100,
      );
      return (
        <Progress
          percent={percent}
          size="small"
          format={() =>
            `${record.currentExecutions}/${record.targetExecutions}`
          }
        />
      );
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    align: 'center' as const,
  },
];

watch(
  () => props.templateId,
  (val) => {
    if (val) loadTests();
  },
  { immediate: true },
);

const isAbTest = (record: unknown): record is AbTestResponse => {
  if (!record || typeof record !== 'object') return false;

  const test = record as Partial<Record<keyof AbTestResponse, unknown>>;
  return (
    typeof test.id === 'string' &&
    typeof test.templateId === 'string' &&
    typeof test.name === 'string' &&
    typeof test.controlVersionId === 'string' &&
    typeof test.treatmentVersionId === 'string' &&
    typeof test.trafficPercentage === 'number' &&
    Object.values(AbTestStatus).includes(test.status as AbTestStatus) &&
    typeof test.currentExecutions === 'number' &&
    typeof test.createdAt === 'string'
  );
};

const withAbTest = (
  record: unknown,
  handler: (test: AbTestResponse) => void | Promise<void>,
) => {
  if (!isAbTest(record)) {
    message.error('测试数据异常，请刷新后重试');
    return;
  }

  void handler(record);
};
</script>

<template>
  <div class="ab-test-panel">
    <div class="mb-4 flex items-center justify-between">
      <Typography.Text type="secondary">
        <ExperimentOutlined />
        管理该模板的 A/B 测试，对比不同版本的提示词效果
      </Typography.Text>
      <Button type="primary" @click="createModalVisible = true">
        <PlusOutlined />
        创建 A/B 测试
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="tests"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Space size="small">
            <Tooltip
              v-if="
                record.status === AbTestStatus.DRAFT ||
                record.status === AbTestStatus.PAUSED
              "
              title="激活"
            >
              <Button
                type="text"
                size="small"
                @click="withAbTest(record, handleActivate)"
              >
                <PlayCircleOutlined style="color: #52c41a" />
              </Button>
            </Tooltip>
            <Tooltip v-if="record.status === AbTestStatus.ACTIVE" title="暂停">
              <Button
                type="text"
                size="small"
                @click="withAbTest(record, handlePause)"
              >
                <PauseCircleOutlined style="color: #faad14" />
              </Button>
            </Tooltip>
            <Tooltip title="查看结果">
              <Button
                type="text"
                size="small"
                @click="withAbTest(record, handleViewResults)"
              >
                <EyeOutlined />
              </Button>
            </Tooltip>
            <Popconfirm
              v-if="record.status !== AbTestStatus.ACTIVE"
              title="确定删除该测试？"
              @confirm="withAbTest(record, handleDelete)"
            >
              <Tooltip title="删除">
                <Button type="text" size="small" danger>
                  <DeleteOutlined />
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        </template>
      </template>

      <template #emptyText>
        <Empty description="暂无 A/B 测试">
          <Button type="primary" @click="createModalVisible = true">
            <PlusOutlined />
            创建第一个 A/B 测试
          </Button>
        </Empty>
      </template>
    </Table>

    <AbTestCreateModal
      v-model:visible="createModalVisible"
      :template-id="templateId"
      @success="loadTests"
    />

    <AbTestResultsDrawer
      v-model:visible="resultsDrawerVisible"
      :template-id="templateId"
      :test-id="selectedTestId"
    />
  </div>
</template>
