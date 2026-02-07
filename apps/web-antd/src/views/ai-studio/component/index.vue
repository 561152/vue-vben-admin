<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
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
  Popconfirm,
  Card,
  Drawer,
  Tooltip,
} from 'ant-design-vue';
import {
  PlusOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import {
  getFeatureModules,
  type FeatureModule,
} from '#/api/ai-studio/pipeline';
import dayjs from 'dayjs';

interface ComponentItem {
  id: number;
  name: string;
  code: string;
  description: string | null;
  type: string;
  category: string;
  version: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const loading = ref(false);
const dataSource = ref<ComponentItem[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const modalVisible = ref(false);
const modalTitle = ref('新建组件');
const editingId = ref<number | null>(null);
const formState = ref({
  name: '',
  code: '',
  description: '',
  type: 'LLM',
  category: 'AI',
});

// 功能模块筛选
const featureModules = ref<FeatureModule[]>([]);
const selectedFeatureCode = ref<string | undefined>(undefined);
// 只有当用户有功能模块权限时才显示筛选器
const showFeatureFilter = computed(() => featureModules.value.length > 0);

const detailVisible = ref(false);
const detailComponent = ref<ComponentItem | null>(null);
const testModalVisible = ref(false);
const testingComponent = ref<ComponentItem | null>(null);
const testInput = ref('');
const testOutput = ref('');
const testLoading = ref(false);

const typeOptions = [
  { value: 'LLM', label: 'LLM 调用', color: 'blue' },
  { value: 'PROMPT', label: '提示词模板', color: 'green' },
  { value: 'TOOL', label: '工具调用', color: 'orange' },
  { value: 'TRANSFORM', label: '数据转换', color: 'purple' },
  { value: 'CONDITION', label: '条件分支', color: 'cyan' },
  { value: 'HTTP', label: 'HTTP 请求', color: 'magenta' },
];

const categoryOptions = [
  { value: 'AI', label: 'AI 能力' },
  { value: 'DATA', label: '数据处理' },
  { value: 'INTEGRATION', label: '系统集成' },
  { value: 'UTILITY', label: '工具函数' },
];

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '组件名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
  },
  {
    title: '组件编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100,
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80,
  },
  {
    title: '使用次数',
    dataIndex: 'usageCount',
    key: 'usageCount',
    width: 100,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right' as const,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await requestClient.get('/ai-studio/components', {
      params: {
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
        featureCode: selectedFeatureCode.value || undefined,
      },
    });

    // API returns array directly or { data: [...] }
    if (Array.isArray(response)) {
      dataSource.value = response;
      pagination.value.total = response.length;
    } else if (response.data) {
      dataSource.value = response.data;
      pagination.value.total = response.total || response.data.length;
    }
  } catch (error) {
    console.error('Failed to fetch components:', error);
    message.error('获取组件列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载功能模块列表（根据用户权限过滤）
const loadFeatureModules = async () => {
  try {
    const modules = await getFeatureModules();
    featureModules.value = modules || [];
  } catch (error: any) {
    // 403 或其他权限错误时不显示筛选器
    if (error?.response?.status === 403) {
      console.warn('No permission to view feature modules');
    } else {
      console.error('Failed to load feature modules:', error);
    }
    featureModules.value = [];
  }
};

// 功能模块筛选变化
const handleFeatureCodeChange = (value: string | undefined) => {
  selectedFeatureCode.value = value;
  pagination.value.current = 1;
  fetchData();
};

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchData();
};

const showCreate = () => {
  modalTitle.value = '新建组件';
  editingId.value = null;
  formState.value = {
    name: '',
    code: '',
    description: '',
    type: 'LLM',
    category: 'AI',
  };
  modalVisible.value = true;
};

const showEdit = (record: ComponentItem) => {
  modalTitle.value = '编辑组件';
  editingId.value = record.id;
  formState.value = {
    name: record.name,
    code: record.code,
    description: record.description || '',
    type: record.type,
    category: record.category,
  };
  modalVisible.value = true;
};

const showDetail = (record: ComponentItem) => {
  detailComponent.value = record;
  detailVisible.value = true;
};

const showTest = (record: ComponentItem) => {
  testingComponent.value = record;
  testInput.value = '';
  testOutput.value = '';
  testModalVisible.value = true;
};

const handleOk = async () => {
  try {
    if (editingId.value) {
      await requestClient.put(
        `/ai-studio/components/${editingId.value}`,
        formState.value,
      );
      message.success('更新成功');
    } else {
      await requestClient.post('/ai-studio/components', formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save component:', error);
    message.error('保存失败');
  }
};

const handleTest = async () => {
  if (!testingComponent.value) return;
  testLoading.value = true;
  try {
    const response = await requestClient.post(
      `/ai-studio/components/${testingComponent.value.id}/test`,
      { input: testInput.value },
    );
    testOutput.value = JSON.stringify(response, null, 2);
    message.success('测试完成');
  } catch (error) {
    console.error('Failed to test component:', error);
    testOutput.value = '测试失败: ' + (error as Error).message;
  } finally {
    testLoading.value = false;
  }
};

const handleDelete = async (id: number) => {
  try {
    await requestClient.delete(`/ai-studio/components/${id}`);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    console.error('Failed to delete component:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  loadFeatureModules();
  fetchData();
});
</script>

<template>
  <div class="component-list">
    <Card title="组件管理">
      <template #extra>
        <Space>
          <!-- 只有当用户有功能模块权限时才显示筛选器 -->
          <Select
            v-if="showFeatureFilter"
            v-model:value="selectedFeatureCode"
            placeholder="按功能模块筛选"
            allow-clear
            style="width: 180px"
            @change="handleFeatureCodeChange"
          >
            <Select.Option
              v-for="item in featureModules"
              :key="item.code"
              :value="item.code"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
          <Button type="primary" @click="showCreate">
            <template #icon><PlusOutlined /></template>
            新建组件
          </Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag
              :color="
                typeOptions.find((opt) => opt.value === record.type)?.color
              "
            >
              {{
                typeOptions.find((opt) => opt.value === record.type)?.label ||
                record.type
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'category'">
            <Tag>
              {{
                categoryOptions.find((opt) => opt.value === record.category)
                  ?.label || record.category
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Tooltip title="查看详情">
                <Button type="link" size="small" @click="showDetail(record)">
                  <template #icon><EyeOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="测试组件">
                <Button type="link" size="small" @click="showTest(record)">
                  <template #icon><ThunderboltOutlined /></template>
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button type="link" size="small" @click="showEdit(record)">
                  <template #icon><EditOutlined /></template>
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除这个组件吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <Tooltip title="删除">
                  <Button type="link" danger size="small">
                    <template #icon><DeleteOutlined /></template>
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Edit Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      width="600px"
    >
      <Form :model="formState" layout="vertical">
        <Form.Item label="组件名称" required>
          <Input v-model:value="formState.name" placeholder="请输入组件名称" />
        </Form.Item>

        <Form.Item label="组件编码" required>
          <Input
            v-model:value="formState.code"
            placeholder="请输入组件编码（英文、下划线）"
          />
        </Form.Item>

        <Form.Item label="组件类型">
          <Select v-model:value="formState.type" :options="typeOptions" />
        </Form.Item>

        <Form.Item label="组件分类">
          <Select
            v-model:value="formState.category"
            :options="categoryOptions"
          />
        </Form.Item>

        <Form.Item label="组件描述">
          <Input.TextArea
            v-model:value="formState.description"
            placeholder="请输入组件描述"
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Test Modal -->
    <Modal
      v-model:open="testModalVisible"
      :title="'测试组件: ' + (testingComponent?.name || '')"
      width="700px"
      :footer="null"
    >
      <Form layout="vertical">
        <Form.Item label="输入参数">
          <Input.TextArea
            v-model:value="testInput"
            placeholder="请输入测试参数（JSON 格式）"
            :rows="4"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" @click="handleTest" :loading="testLoading">
            执行测试
          </Button>
        </Form.Item>
        <Form.Item label="输出结果">
          <Input.TextArea
            :value="testOutput"
            placeholder="测试结果将显示在这里"
            :rows="8"
            readonly
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailVisible"
      title="组件详情"
      width="600"
      placement="right"
    >
      <div v-if="detailComponent" class="component-detail">
        <div class="detail-item">
          <label>组件ID：</label>
          <span>{{ detailComponent.id }}</span>
        </div>
        <div class="detail-item">
          <label>组件名称：</label>
          <span>{{ detailComponent.name }}</span>
        </div>
        <div class="detail-item">
          <label>组件编码：</label>
          <span>{{ detailComponent.code }}</span>
        </div>
        <div class="detail-item">
          <label>类型：</label>
          <span>
            <Tag
              :color="
                typeOptions.find((opt) => opt.value === detailComponent.type)
                  ?.color
              "
            >
              {{
                typeOptions.find((opt) => opt.value === detailComponent.type)
                  ?.label
              }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>分类：</label>
          <span>
            <Tag>
              {{
                categoryOptions.find(
                  (opt) => opt.value === detailComponent.category,
                )?.label
              }}
            </Tag>
          </span>
        </div>
        <div class="detail-item">
          <label>版本：</label>
          <span>{{ detailComponent.version }}</span>
        </div>
        <div class="detail-item">
          <label>使用次数：</label>
          <span>{{ detailComponent.usageCount }}</span>
        </div>
        <div class="detail-item">
          <label>描述：</label>
          <span>{{ detailComponent.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>更新时间：</label>
          <span>{{
            dayjs(detailComponent.updatedAt).format('YYYY-MM-DD HH:mm:ss')
          }}</span>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.component-list {
  padding: 20px;
}

.component-detail {
  .detail-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;

    label {
      min-width: 100px;
      font-weight: 500;
      color: rgb(0 0 0 / 65%);
    }

    span {
      flex: 1;
      color: rgb(0 0 0 / 85%);
    }
  }
}
</style>
