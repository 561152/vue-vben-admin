<template>
  <Page
    title="员工管理"
    description="企业微信同步的员工信息"
  >
    <!-- 搜索栏 -->
    <Card class="mb-4">
      <Form layout="inline">
        <FormItem>
          <Input
            v-model:value="searchForm.keyword"
            placeholder="搜索姓名、手机号、邮箱"
            style="width: 300px"
            allow-clear
            @pressEnter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </Input>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            搜索
          </Button>
        </FormItem>
        <FormItem>
          <Button @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </Button>
        </FormItem>
      </Form>
    </Card>

    <!-- 员工列表 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 头像 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <Avatar
              :src="record.headImageUrl"
              :size="40"
            >
              {{ record.userName?.charAt(0) || '?' }}
            </Avatar>
          </template>

          <!-- 姓名 -->
          <template v-else-if="column.key === 'userName'">
            <div class="user-info">
              <div class="user-name">{{ record.userName }}</div>
              <div class="user-id">ID: {{ record.userId }}</div>
            </div>
          </template>

          <!-- 性别 -->
          <template v-else-if="column.key === 'gender'">
            <Tag v-if="record.gender === 'MALE'" color="blue">
              <ManOutlined /> 男
            </Tag>
            <Tag v-else-if="record.gender === 'FEMALE'" color="pink">
              <WomanOutlined /> 女
            </Tag>
            <Tag v-else color="default">
              <QuestionOutlined /> 未知
            </Tag>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <Tag v-if="record.isActivate === 'ACTIVATED'" color="success">
              <CheckCircleOutlined /> 已激活
            </Tag>
            <Tag v-else-if="record.isActivate === 'NOT_ACTIVATED'" color="warning">
              <ClockCircleOutlined /> 未激活
            </Tag>
            <Tag v-else-if="record.isActivate === 'DEACTIVATED'" color="error">
              <StopOutlined /> 已禁用
            </Tag>
            <Tag v-else-if="record.isActivate === 'QUIT'" color="default">
              <CloseCircleOutlined /> 已离职
            </Tag>
          </template>

          <!-- 启用状态 -->
          <template v-else-if="column.key === 'enable'">
            <Tag :color="record.enable ? 'success' : 'default'">
              {{ record.enable ? '启用' : '禁用' }}
            </Tag>
          </template>

          <!-- 更新时间 -->
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatTime(record.updatedAt) }}
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card,
  Table,
  Input,
  Button,
  Form,
  FormItem,
  Avatar,
  Tag,
} from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import {
  SearchOutlined,
  ReloadOutlined,
  ManOutlined,
  WomanOutlined,
  QuestionOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';
import { requestClient } from '#/api/request';
import dayjs from 'dayjs';

interface WecomUser {
  id: string;
  userId: string;
  userName: string;
  mobile: string;
  email: string | null;
  department: number[];
  position: string | null;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  headImageUrl: string | null;
  enable: boolean;
  isActivate: 'ACTIVATED' | 'NOT_ACTIVATED' | 'DEACTIVATED' | 'QUIT';
  updatedAt: string;
}

interface WecomUserListResponse {
  data: WecomUser[];
  total: number;
  page: number;
  pageSize: number;
}

const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 80,
  },
  {
    title: '姓名',
    key: 'userName',
    dataIndex: 'userName',
    width: 200,
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    key: 'mobile',
    width: 130,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    ellipsis: true,
  },
  {
    title: '职位',
    dataIndex: 'position',
    key: 'position',
    width: 150,
  },
  {
    title: '性别',
    key: 'gender',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
  },
  {
    title: '启用',
    key: 'enable',
    width: 80,
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 160,
  },
];

const loading = ref(false);
const dataSource = ref<WecomUser[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  keyword: '',
});

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    if (searchForm.keyword) {
      params.keyword = searchForm.keyword;
    }

    const res = await requestClient.get<WecomUserListResponse>('/wecom/users', {
      params,
    });

    dataSource.value = res.data;
    pagination.total = res.total;
  } catch (error: any) {
    console.error('获取员工列表失败', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchUsers();
};

const handleReset = () => {
  searchForm.keyword = '';
  pagination.current = 1;
  fetchUsers();
};

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 20;
  fetchUsers();
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  color: var(--text-color, #333);
}

.user-id {
  font-size: 12px;
  color: var(--text-color-secondary, #999);
}
</style>
