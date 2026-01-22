<template>
  <div class="p-4">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span>企微同步统计</span>
          <Button type="link" @click="goBack">
            <ArrowLeftOutlined /> 返回
          </Button>
        </div>
      </template>

      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 统计概览 -->
        <TabPane key="overview" tab="统计概览">
          <Spin :spinning="loading.overview">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步员工数"
                    :value="overview.totalUsers"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步客户数"
                    :value="overview.totalCustomers"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <TeamOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步群聊数"
                    :value="overview.totalGroups"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <UsergroupAddOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步关系数"
                    :value="overview.totalRelations"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <LinkOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步部门数"
                    :value="overview.totalDepartments"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <ApartmentOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日同步"
                    :value="overview.todaySyncCount"
                    :value-style="{ color: '#2f54eb' }"
                  >
                    <template #prefix>
                      <SyncOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="本周同步"
                    :value="overview.weekSyncCount"
                    :value-style="{ color: '#eb2f96' }"
                  >
                    <template #prefix>
                      <CalendarOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="同步成功率"
                    :value="overview.syncSuccessRate"
                    suffix="%"
                    :value-style="{ color: overview.syncSuccessRate >= 90 ? '#52c41a' : '#ff4d4f' }"
                  >
                    <template #prefix>
                      <CheckCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>
          </Spin>
        </TabPane>

        <!-- 员工同步分析 -->
        <TabPane key="users" tab="员工同步">
          <Spin :spinning="loading.users">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总员工数"
                    :value="userSync.totalUsers"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="活跃员工"
                    :value="userSync.activeUsers"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <CheckCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="离职员工"
                    :value="userSync.resignedUsers"
                    :value-style="{ color: '#ff4d4f' }"
                  >
                    <template #prefix>
                      <UserDeleteOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日新增"
                    :value="userSync.todayNewUsers"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <PlusCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Card title="部门员工分布 TOP 10">
              <Table
                :columns="userDeptColumns"
                :data-source="userSync.byDepartment"
                :pagination="false"
                row-key="departmentName"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'percentage'">
                    <Progress
                      :percent="record.percentage"
                      :stroke-color="'#1890ff'"
                      size="small"
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>

        <!-- 客户同步分析 -->
        <TabPane key="customers" tab="客户同步">
          <Spin :spinning="loading.customers">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总客户数"
                    :value="customerSync.totalCustomers"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <TeamOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="个人客户"
                    :value="customerSync.personalCustomers"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="企业客户"
                    :value="customerSync.enterpriseCustomers"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <BankOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="今日新增"
                    :value="customerSync.todayNewCustomers"
                    :value-style="{ color: '#13c2c2' }"
                  >
                    <template #prefix>
                      <PlusCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Card title="客户添加来源分布">
              <Table
                :columns="customerSourceColumns"
                :data-source="customerSync.bySource"
                :pagination="false"
                row-key="addWay"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'addWay'">
                    <Tag :color="getAddWayColor(record.addWay)">
                      {{ getAddWayName(record.addWay) }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'percentage'">
                    <Progress
                      :percent="record.percentage"
                      :stroke-color="getAddWayColor(record.addWay)"
                      size="small"
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>

        <!-- 群聊同步分析 -->
        <TabPane key="groups" tab="群聊同步">
          <Spin :spinning="loading.groups">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总群聊数"
                    :value="groupSync.totalGroups"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <UsergroupAddOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="活跃群聊"
                    :value="groupSync.activeGroups"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <CheckCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总成员数"
                    :value="groupSync.totalMembers"
                    :value-style="{ color: '#722ed1' }"
                  >
                    <template #prefix>
                      <TeamOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均成员数"
                    :value="groupSync.avgMembersPerGroup"
                    :value-style="{ color: '#faad14' }"
                  >
                    <template #prefix>
                      <UserOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
            </Row>

            <Card title="群聊规模分布">
              <Table
                :columns="groupSizeColumns"
                :data-source="groupSync.bySize"
                :pagination="false"
                row-key="sizeRange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'percentage'">
                    <Progress
                      :percent="record.percentage"
                      :stroke-color="getSizeColor(record.sizeRange)"
                      size="small"
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>

        <!-- 关系同步分析 -->
        <TabPane key="relations" tab="关系同步">
          <Spin :spinning="loading.relations">
            <Row :gutter="16" class="mb-4">
              <Col :span="6">
                <Card>
                  <Statistic
                    title="总关系数"
                    :value="relationSync.totalRelations"
                    :value-style="{ color: '#1890ff' }"
                  >
                    <template #prefix>
                      <LinkOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="正常关系"
                    :value="relationSync.normalRelations"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <CheckCircleOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="已删除关系"
                    :value="relationSync.deletedRelations"
                    :value-style="{ color: '#ff4d4f' }"
                  >
                    <template #prefix>
                      <DisconnectOutlined />
                    </template>
                  </Statistic>
                </Card>
              </Col>
              <Col :span="6">
                <Card>
                  <Statistic
                    title="平均关系数/员工"
                    :value="relationSync.avgRelationsPerUser"
                    :value-style="{ color: '#722ed1' }"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="员工客户关系 TOP 10">
              <Table
                :columns="relationTopColumns"
                :data-source="relationSync.topUsers"
                :pagination="false"
                row-key="userId"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'percentage'">
                    <Progress
                      :percent="record.percentage"
                      :stroke-color="'#1890ff'"
                      size="small"
                    />
                  </template>
                </template>
              </Table>
            </Card>
          </Spin>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Tabs,
  TabPane,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Spin,
  Button,
  message,
} from 'ant-design-vue';
import {
  ArrowLeftOutlined,
  UserOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  LinkOutlined,
  ApartmentOutlined,
  SyncOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  UserDeleteOutlined,
  BankOutlined,
  DisconnectOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import type { Key } from 'ant-design-vue/es/_util/type';

const router = useRouter();

// 状态
const activeTab = ref('overview');
const loading = ref({
  overview: false,
  users: false,
  customers: false,
  groups: false,
  relations: false,
});

// 数据
const overview = ref({
  totalUsers: 0,
  totalCustomers: 0,
  totalGroups: 0,
  totalRelations: 0,
  totalDepartments: 0,
  todaySyncCount: 0,
  weekSyncCount: 0,
  syncSuccessRate: 0,
});

const userSync = ref({
  totalUsers: 0,
  activeUsers: 0,
  resignedUsers: 0,
  todayNewUsers: 0,
  byDepartment: [] as Array<{
    departmentName: string;
    count: number;
    percentage: number;
  }>,
});

const customerSync = ref({
  totalCustomers: 0,
  personalCustomers: 0,
  enterpriseCustomers: 0,
  todayNewCustomers: 0,
  bySource: [] as Array<{
    addWay: number;
    count: number;
    percentage: number;
  }>,
});

const groupSync = ref({
  totalGroups: 0,
  activeGroups: 0,
  totalMembers: 0,
  avgMembersPerGroup: 0,
  bySize: [] as Array<{
    sizeRange: string;
    count: number;
    percentage: number;
  }>,
});

const relationSync = ref({
  totalRelations: 0,
  normalRelations: 0,
  deletedRelations: 0,
  avgRelationsPerUser: 0,
  topUsers: [] as Array<{
    userId: string;
    userName: string;
    relationCount: number;
    percentage: number;
  }>,
});

// 表格列定义
const userDeptColumns = [
  { title: '部门名称', dataIndex: 'departmentName', key: 'departmentName' },
  { title: '员工数', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 200 },
];

const customerSourceColumns = [
  { title: '添加来源', dataIndex: 'addWay', key: 'addWay' },
  { title: '客户数', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 200 },
];

const groupSizeColumns = [
  { title: '群规模', dataIndex: 'sizeRange', key: 'sizeRange' },
  { title: '群数量', dataIndex: 'count', key: 'count' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 200 },
];

const relationTopColumns = [
  { title: '员工名', dataIndex: 'userName', key: 'userName' },
  { title: '客户数', dataIndex: 'relationCount', key: 'relationCount' },
  { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 200 },
];

// 添加来源映射
const addWayMap: Record<number, string> = {
  0: '未知',
  1: '扫描二维码',
  2: '搜索手机号',
  3: '名片分享',
  4: '群聊',
  5: '手机通讯录',
  6: '微信联系人',
  7: '来自微信好友请求',
  8: '安装第三方应用时添加',
  9: '搜索邮箱',
  10: '视频号',
  11: '通过日程参与人添加',
  12: '通过会议参与人添加',
  13: '添加微信好友',
  14: '通过智慧硬件',
  15: '通过上门服务',
  201: '内部成员共享',
  202: '管理员/负责人分配',
};

const addWayColors: Record<number, string> = {
  1: '#1890ff',
  2: '#52c41a',
  3: '#722ed1',
  4: '#13c2c2',
  5: '#faad14',
  6: '#07c160',
  7: '#eb2f96',
  201: '#2f54eb',
  202: '#fa541c',
};

// 方法
const getAddWayName = (addWay: number) => {
  return addWayMap[addWay] || `来源${addWay}`;
};

const getAddWayColor = (addWay: number) => {
  return addWayColors[addWay] || '#1890ff';
};

const getSizeColor = (sizeRange: string) => {
  if (sizeRange.includes('小')) return '#52c41a';
  if (sizeRange.includes('中')) return '#1890ff';
  if (sizeRange.includes('大')) return '#722ed1';
  return '#faad14';
};

const goBack = () => {
  router.back();
};

const handleTabChange = (key: Key) => {
  activeTab.value = String(key);
  loadTabData(String(key));
};

// 加载数据
const loadOverview = async () => {
  loading.value.overview = true;
  try {
    const res = await requestClient.get('/wecom/sync/statistics/overview');
    overview.value = res;
  } catch (error) {
    message.error('加载统计概览失败');
  } finally {
    loading.value.overview = false;
  }
};

const loadUserSync = async () => {
  loading.value.users = true;
  try {
    const res = await requestClient.get('/wecom/sync/statistics/users');
    userSync.value = res;
  } catch (error) {
    message.error('加载员工同步分析失败');
  } finally {
    loading.value.users = false;
  }
};

const loadCustomerSync = async () => {
  loading.value.customers = true;
  try {
    const res = await requestClient.get('/wecom/sync/statistics/customers');
    customerSync.value = res;
  } catch (error) {
    message.error('加载客户同步分析失败');
  } finally {
    loading.value.customers = false;
  }
};

const loadGroupSync = async () => {
  loading.value.groups = true;
  try {
    const res = await requestClient.get('/wecom/sync/statistics/groups');
    groupSync.value = res;
  } catch (error) {
    message.error('加载群聊同步分析失败');
  } finally {
    loading.value.groups = false;
  }
};

const loadRelationSync = async () => {
  loading.value.relations = true;
  try {
    const res = await requestClient.get('/wecom/sync/statistics/relations');
    relationSync.value = res;
  } catch (error) {
    message.error('加载关系同步分析失败');
  } finally {
    loading.value.relations = false;
  }
};

const loadTabData = (tab: string) => {
  switch (tab) {
    case 'overview':
      loadOverview();
      break;
    case 'users':
      loadUserSync();
      break;
    case 'customers':
      loadCustomerSync();
      break;
    case 'groups':
      loadGroupSync();
      break;
    case 'relations':
      loadRelationSync();
      break;
  }
};

onMounted(() => {
  loadOverview();
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
