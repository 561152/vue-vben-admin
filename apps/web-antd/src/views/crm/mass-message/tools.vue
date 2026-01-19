<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Button } from 'ant-design-vue';
import {
  UserOutlined,
  TeamOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const tools = [
  {
    key: 'customer',
    title: '群发消息给客户',
    description:
      '企业统一选择要发送的客户，由添加客户的成员确认后发送给客户。消息内容仅管理员和负责人可创建。',
    icon: UserOutlined,
    actions: [
      { label: '新建消息', path: '/crm/mass-message' },
      { label: '群发记录', path: '/crm/mass-message/history' },
    ],
  },
  {
    key: 'group',
    title: '群发消息到企业的客户群',
    description:
      '管理员或负责人统一创建内容，群主收到通知后，可选择他管理的客户群并群发。',
    icon: TeamOutlined,
    actions: [
      { label: '新建消息', path: '/crm/group-message/create' },
      { label: '群发记录', path: '/crm/group-message/history' },
    ],
  },
  {
    key: 'moments',
    title: '企业发表到客户的朋友圈',
    description:
      '管理员或负责人编辑内容，选择可见的客户，成员确认后，可将内容发表到客户的朋友圈。还可与客户进行评论互动。',
    icon: ShareAltOutlined,
    actions: [
      { label: '新建内容', path: '/crm/moments/create' },
      { label: '企业发表记录', path: '/crm/moments/history' },
    ],
  },
];

function navigateTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-xl font-bold">群发工具</h2>
      <p class="text-gray-500">选择适合的方式触达客户</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <Card v-for="tool in tools" :key="tool.key" class="h-full">
        <div class="flex h-full flex-col">
          <div class="mb-4 flex items-start">
            <div
              class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
            >
              <component :is="tool.icon" class="text-xl text-blue-500" />
            </div>
            <div class="flex-1">
              <h3 class="text-base font-medium">{{ tool.title }}</h3>
            </div>
          </div>

          <p class="mb-4 flex-1 text-sm text-gray-500">
            {{ tool.description }}
          </p>

          <div class="flex gap-2 border-t pt-4">
            <Button
              v-for="action in tool.actions"
              :key="action.path"
              type="link"
              class="px-0 text-blue-500"
              @click="navigateTo(action.path)"
            >
              {{ action.label }}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
