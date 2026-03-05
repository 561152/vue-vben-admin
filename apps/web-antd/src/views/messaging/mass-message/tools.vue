<script lang="ts" setup>
import { Card, Button } from 'ant-design-vue';
import {
  UserOutlined,
  ShareAltOutlined,
  MessageOutlined,
  FolderOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 核心群发工具
const coreTools = [
  {
    key: 'mass-message',
    title: '群发消息给客户',
    description:
      '向客户批量发送消息，支持文本、图片、图文等多种格式。企业统一选择要发送的客户，由添加客户的成员确认后发送。',
    icon: UserOutlined,
    actions: [
      { label: '新建群发', path: '/messaging/mass-message/create' },
      { label: '查看记录', path: '/messaging/mass-message' },
      { label: '数据统计', path: '/messaging/mass-message/statistics' },
    ],
  },
  {
    key: 'moments',
    title: '朋友圈发表',
    description:
      '企业统一编辑内容，由成员发表到客户朋友圈。管理员或负责人编辑内容，选择可见的客户，成员确认后发表。',
    icon: ShareAltOutlined,
    actions: [
      { label: '发表内容', path: '/messaging/moments' },
      { label: '数据概览', path: '/messaging/moments/statistics' },
    ],
  },
  {
    key: 'direct',
    title: '消息推送',
    description:
      '单聊或批量发送消息给客户，即时触达。适合快速发送消息给指定客户。',
    icon: MessageOutlined,
    actions: [{ label: '发送消息', path: '/messaging/direct' }],
  },
];

// 内容管理工具
const contentTools = [
  {
    key: 'material',
    title: '素材库',
    description: '集中管理图片、视频、文件等素材资源，方便消息发送时快速选择。',
    icon: FolderOutlined,
    actions: [
      { label: '管理素材', path: '/messaging/material' },
      { label: '素材统计', path: '/messaging/material/statistics' },
    ],
  },
  {
    key: 'template',
    title: '消息模板',
    description: '创建常用消息模板，提升发送效率。支持多种消息类型和变量替换。',
    icon: FileTextOutlined,
    actions: [{ label: '模板管理', path: '/messaging/template' }],
  },
  {
    key: 'scheduled',
    title: '定时消息',
    description: '预设发送时间，自动推送消息。适合需要定时触达客户的场景。',
    icon: ClockCircleOutlined,
    actions: [{ label: '创建定时', path: '/messaging/scheduled' }],
  },
];

// 智能工具
const aiTools = [
  {
    key: 'ai-reply',
    title: 'AI 智能回复',
    description: '基于 Dify 的智能对话和自动回复，提供 7x24 小时客户服务。',
    icon: RobotOutlined,
    actions: [{ label: '对话统计', path: '/messaging/dify/statistics' }],
  },
];

function navigateTo(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-xl font-bold">消息工具中心</h2>
      <p class="text-gray-500">快速访问常用功能，提升客户触达效率</p>
    </div>

    <!-- 核心群发工具 -->
    <div class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <div class="h-4 w-1 rounded bg-blue-500"></div>
        <h3 class="text-base font-medium">核心群发工具</h3>
      </div>
      <div class="grid grid-cols-3 gap-6">
        <Card v-for="tool in coreTools" :key="tool.key" class="h-full">
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

            <div class="flex flex-wrap gap-2 border-t pt-4">
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

    <!-- 内容管理工具 -->
    <div class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <div class="h-4 w-1 rounded bg-green-500"></div>
        <h3 class="text-base font-medium">内容管理工具</h3>
      </div>
      <div class="grid grid-cols-3 gap-6">
        <Card v-for="tool in contentTools" :key="tool.key" class="h-full">
          <div class="flex h-full flex-col">
            <div class="mb-4 flex items-start">
              <div
                class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
              >
                <component :is="tool.icon" class="text-xl text-green-500" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-medium">{{ tool.title }}</h3>
              </div>
            </div>

            <p class="mb-4 flex-1 text-sm text-gray-500">
              {{ tool.description }}
            </p>

            <div class="flex flex-wrap gap-2 border-t pt-4">
              <Button
                v-for="action in tool.actions"
                :key="action.path"
                type="link"
                class="px-0 text-green-500"
                @click="navigateTo(action.path)"
              >
                {{ action.label }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 智能工具 -->
    <div class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <div class="h-4 w-1 rounded bg-purple-500"></div>
        <h3 class="text-base font-medium">智能工具</h3>
      </div>
      <div class="grid grid-cols-3 gap-6">
        <Card v-for="tool in aiTools" :key="tool.key" class="h-full">
          <div class="flex h-full flex-col">
            <div class="mb-4 flex items-start">
              <div
                class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100"
              >
                <component :is="tool.icon" class="text-xl text-purple-500" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-medium">{{ tool.title }}</h3>
              </div>
            </div>

            <p class="mb-4 flex-1 text-sm text-gray-500">
              {{ tool.description }}
            </p>

            <div class="flex flex-wrap gap-2 border-t pt-4">
              <Button
                v-for="action in tool.actions"
                :key="action.path"
                type="link"
                class="px-0 text-purple-500"
                @click="navigateTo(action.path)"
              >
                {{ action.label }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
