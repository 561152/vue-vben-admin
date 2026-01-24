<script lang="ts" setup>
import { ref, computed, h } from 'vue';
import {
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Image,
  message,
  Tooltip,
  Card,
} from 'ant-design-vue';
import {
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileOutlined,
  LinkOutlined,
  AppstoreOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons-vue';
import { uploadMedia, type WecomMedia } from '#/api/crm';
import MediaLibraryModal from './MediaLibraryModal.vue';

// ==================== Types ====================

export interface Attachment {
  id?: string;
  type: 'image' | 'video' | 'file' | 'link' | 'miniprogram';
  mediaId?: number;
  ossUrl?: string;
  name?: string;
  link?: {
    title: string;
    desc?: string;
    url: string;
    picurl?: string;
  };
  miniprogram?: {
    title: string;
    appid: string;
    page: string;
    picMediaId?: number;
    picUrl?: string;
  };
}

// ==================== Props & Emits ====================

const props = defineProps<{
  modelValue: Attachment[];
  maxCount?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Attachment[]): void;
}>();

// ==================== State ====================

const uploading = ref(false);
const linkModalVisible = ref(false);
const miniprogramModalVisible = ref(false);
const mediaLibraryVisible = ref(false);
const mediaLibraryType = ref<'image' | 'video' | 'file'>('image');

// Link form
const linkForm = ref({
  title: '',
  desc: '',
  url: '',
  picurl: '',
});

// Miniprogram form
const miniprogramForm = ref({
  title: '',
  appid: '',
  page: '',
  picMediaId: undefined as number | undefined,
  picUrl: '',
});

const miniprogramCoverUploading = ref(false);

// ==================== Constants ====================

const MAX_COUNT = computed(() => props.maxCount || 9);

const attachmentTypes = [
  {
    key: 'image',
    icon: PictureOutlined,
    label: '图片',
    accept: 'image/*',
    maxSize: 2,
  },
  {
    key: 'video',
    icon: VideoCameraOutlined,
    label: '视频',
    accept: 'video/mp4',
    maxSize: 10,
  },
  {
    key: 'file',
    icon: FileOutlined,
    label: '文件',
    accept: '*/*',
    maxSize: 20,
  },
  { key: 'link', icon: LinkOutlined, label: '网页', accept: '', maxSize: 0 },
  {
    key: 'miniprogram',
    icon: AppstoreOutlined,
    label: '小程序',
    accept: '',
    maxSize: 0,
  },
];

// ==================== Computed ====================

const attachments = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const canAddMore = computed(() => attachments.value.length < MAX_COUNT.value);

const remainingCount = computed(
  () => MAX_COUNT.value - attachments.value.length,
);

// ==================== Methods ====================

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function handleUpload(
  file: File,
  type: 'image' | 'video' | 'file',
): Promise<boolean> {
  if (!canAddMore.value) {
    message.warning(`最多只能添加 ${MAX_COUNT.value} 个附件`);
    return false;
  }

  const typeConfig = attachmentTypes.find((t) => t.key === type);
  if (typeConfig && typeConfig.maxSize > 0) {
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > typeConfig.maxSize) {
      message.error(`文件大小不能超过 ${typeConfig.maxSize}MB`);
      return false;
    }
  }

  uploading.value = true;
  try {
    const media = await uploadMedia(file, {
      type: type.toUpperCase() as 'IMAGE' | 'VIDEO' | 'FILE',
      name: file.name,
    });

    const newAttachment: Attachment = {
      id: generateId(),
      type,
      mediaId: media.id,
      ossUrl: media.ossUrl || '',
      name: media.name,
    };

    attachments.value = [...attachments.value, newAttachment];
    message.success('上传成功');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '上传失败';
    message.error(errorMessage);
  } finally {
    uploading.value = false;
  }

  return false;
}

function handleTypeClick(type: string) {
  if (!canAddMore.value) {
    message.warning(`最多只能添加 ${MAX_COUNT.value} 个附件`);
    return;
  }

  if (type === 'link') {
    linkForm.value = { title: '', desc: '', url: '', picurl: '' };
    linkModalVisible.value = true;
  } else if (type === 'miniprogram') {
    miniprogramForm.value = {
      title: '',
      appid: '',
      page: '',
      picMediaId: undefined,
      picUrl: '',
    };
    miniprogramModalVisible.value = true;
  }
}

function handleOpenMediaLibrary(type: 'image' | 'video' | 'file') {
  if (!canAddMore.value) {
    message.warning(`最多只能添加 ${MAX_COUNT.value} 个附件`);
    return;
  }
  mediaLibraryType.value = type;
  mediaLibraryVisible.value = true;
}

function handleMediaLibrarySelect(selectedMedia: WecomMedia[]) {
  const remaining = remainingCount.value;
  const toAdd = selectedMedia.slice(0, remaining);

  const newAttachments: Attachment[] = toAdd.map((media) => ({
    id: generateId(),
    type: media.type.toLowerCase() as 'image' | 'video' | 'file',
    mediaId: media.id,
    ossUrl: media.ossUrl || '',
    name: media.name,
  }));

  attachments.value = [...attachments.value, ...newAttachments];

  if (selectedMedia.length > remaining) {
    message.warning(
      `已添加 ${remaining} 个，超出数量的 ${selectedMedia.length - remaining} 个已忽略`,
    );
  }

  mediaLibraryVisible.value = false;
}

function handleLinkConfirm() {
  if (!linkForm.value.title) {
    message.warning('请输入标题');
    return;
  }
  if (!linkForm.value.url) {
    message.warning('请输入链接地址');
    return;
  }

  // Validate URL
  try {
    new URL(linkForm.value.url);
  } catch {
    message.error('请输入有效的链接地址');
    return;
  }

  const newAttachment: Attachment = {
    id: generateId(),
    type: 'link',
    link: {
      title: linkForm.value.title,
      desc: linkForm.value.desc || undefined,
      url: linkForm.value.url,
      picurl: linkForm.value.picurl || undefined,
    },
  };

  attachments.value = [...attachments.value, newAttachment];
  linkModalVisible.value = false;
  message.success('添加成功');
}

async function handleMiniprogramCoverUpload(file: File): Promise<boolean> {
  if (file.size > 2 * 1024 * 1024) {
    message.error('封面图片不能超过 2MB');
    return false;
  }

  miniprogramCoverUploading.value = true;
  try {
    const media = await uploadMedia(file, {
      type: 'IMAGE',
      name: file.name,
    });
    miniprogramForm.value.picMediaId = media.id;
    miniprogramForm.value.picUrl = media.ossUrl || '';
    message.success('封面上传成功');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '封面上传失败';
    message.error(errorMessage);
  } finally {
    miniprogramCoverUploading.value = false;
  }

  return false;
}

function handleMiniprogramConfirm() {
  if (!miniprogramForm.value.title) {
    message.warning('请输入小程序标题');
    return;
  }
  if (!miniprogramForm.value.appid) {
    message.warning('请输入小程序 AppID');
    return;
  }
  if (!miniprogramForm.value.page) {
    message.warning('请输入小程序页面路径');
    return;
  }

  // Validate AppID format (wx开头，18位字符)
  const appidRegex = /^wx[a-zA-Z0-9]{16}$/;
  if (!appidRegex.test(miniprogramForm.value.appid)) {
    message.error('AppID 格式不正确，应为 wx 开头的18位字符');
    return;
  }

  const newAttachment: Attachment = {
    id: generateId(),
    type: 'miniprogram',
    miniprogram: {
      title: miniprogramForm.value.title,
      appid: miniprogramForm.value.appid,
      page: miniprogramForm.value.page,
      picMediaId: miniprogramForm.value.picMediaId,
      picUrl: miniprogramForm.value.picUrl || undefined,
    },
  };

  attachments.value = [...attachments.value, newAttachment];
  miniprogramModalVisible.value = false;
  message.success('添加成功');
}

function handleRemoveAttachment(id: string) {
  attachments.value = attachments.value.filter((att) => att.id !== id);
}

function getAttachmentPreview(att: Attachment): string {
  if (att.type === 'link') {
    return att.link?.picurl || '';
  }
  if (att.type === 'miniprogram') {
    return att.miniprogram?.picUrl || '';
  }
  return att.ossUrl || '';
}

function getAttachmentTitle(att: Attachment): string {
  if (att.type === 'link') {
    return att.link?.title || '网页链接';
  }
  if (att.type === 'miniprogram') {
    return att.miniprogram?.title || '小程序';
  }
  return att.name || '附件';
}

function getTypeIcon(type: string) {
  const config = attachmentTypes.find((t) => t.key === type);
  return config?.icon || FileOutlined;
}
</script>

<template>
  <div class="attachment-editor">
    <!-- Attachment Preview List -->
    <div v-if="attachments.length > 0" class="mb-4 flex flex-wrap gap-3">
      <Card
        v-for="att in attachments"
        :key="att.id"
        class="relative w-32"
        size="small"
        :body-style="{ padding: '8px' }"
      >
        <!-- Remove button -->
        <Button
          type="text"
          danger
          size="small"
          class="absolute -right-2 -top-2 z-10"
          shape="circle"
          :icon="h(DeleteOutlined)"
          @click="handleRemoveAttachment(att.id!)"
        />

        <!-- Preview -->
        <div
          class="mb-2 flex h-20 items-center justify-center overflow-hidden rounded bg-gray-100"
        >
          <Image
            v-if="
              (att.type === 'image' || att.type === 'video') &&
              getAttachmentPreview(att)
            "
            :src="getAttachmentPreview(att)"
            :preview="false"
            class="h-full w-full object-cover"
          />
          <div
            v-else-if="att.type === 'link'"
            class="flex flex-col items-center text-gray-400"
          >
            <LinkOutlined class="text-2xl" />
            <span class="mt-1 text-xs">网页</span>
          </div>
          <div
            v-else-if="att.type === 'miniprogram'"
            class="flex flex-col items-center text-gray-400"
          >
            <AppstoreOutlined class="text-2xl" />
            <span class="mt-1 text-xs">小程序</span>
          </div>
          <div v-else class="flex flex-col items-center text-gray-400">
            <component :is="getTypeIcon(att.type)" class="text-2xl" />
            <span class="mt-1 text-xs">{{ att.type }}</span>
          </div>
        </div>

        <!-- Title -->
        <Tooltip :title="getAttachmentTitle(att)">
          <div class="truncate text-xs text-gray-600">
            {{ getAttachmentTitle(att) }}
          </div>
        </Tooltip>
      </Card>
    </div>

    <!-- Add Attachment Area -->
    <div class="rounded border border-dashed p-4">
      <div class="mb-2 text-sm text-gray-500">
        + 添加图片/视频/网页
        <span v-if="!canAddMore" class="text-red-500">
          （已达最大数量 {{ MAX_COUNT }}）
        </span>
        <span v-else class="text-gray-400">
          （还可添加 {{ remainingCount }} 个）
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <!-- Upload buttons for image/video/file -->
        <template
          v-for="type in attachmentTypes.filter((t) =>
            ['image', 'video', 'file'].includes(t.key),
          )"
          :key="type.key"
        >
          <Upload
            :accept="type.accept"
            :show-upload-list="false"
            :before-upload="
              (file: File) =>
                handleUpload(file, type.key as 'image' | 'video' | 'file')
            "
            :disabled="!canAddMore || uploading"
          >
            <Button
              class="flex h-16 w-16 flex-col items-center justify-center"
              :disabled="!canAddMore"
              :loading="uploading"
            >
              <component :is="type.icon" class="text-lg" />
              <span class="mt-1 text-xs">{{ type.label }}</span>
            </Button>
          </Upload>
        </template>

        <!-- Link and Miniprogram buttons -->
        <Button
          class="flex h-16 w-16 flex-col items-center justify-center"
          :disabled="!canAddMore"
          @click="handleTypeClick('link')"
        >
          <LinkOutlined class="text-lg" />
          <span class="mt-1 text-xs">网页</span>
        </Button>

        <Button
          class="flex h-16 w-16 flex-col items-center justify-center"
          :disabled="!canAddMore"
          @click="handleTypeClick('miniprogram')"
        >
          <AppstoreOutlined class="text-lg" />
          <span class="mt-1 text-xs">小程序</span>
        </Button>

        <!-- Divider -->
        <div class="h-16 w-px bg-gray-200" />

        <!-- Media Library buttons -->
        <Tooltip title="从素材库选择图片">
          <Button
            class="flex h-16 w-16 flex-col items-center justify-center"
            :disabled="!canAddMore"
            @click="handleOpenMediaLibrary('image')"
          >
            <FolderOpenOutlined class="text-lg" />
            <span class="mt-1 text-xs">素材库</span>
          </Button>
        </Tooltip>
      </div>

      <div class="mt-2 text-xs text-gray-400">
        图片：png/jpg，最大2MB | 视频：mp4，最大10MB | 文件：最大20MB
      </div>
    </div>

    <!-- Link Modal -->
    <Modal
      v-model:open="linkModalVisible"
      title="添加网页链接"
      :width="500"
      @ok="handleLinkConfirm"
    >
      <Form layout="vertical">
        <Form.Item label="标题" required>
          <Input
            v-model:value="linkForm.title"
            placeholder="请输入标题（必填）"
            :maxlength="64"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea
            v-model:value="linkForm.desc"
            placeholder="请输入描述（选填）"
            :rows="2"
            :maxlength="512"
          />
        </Form.Item>
        <Form.Item label="链接地址" required>
          <Input
            v-model:value="linkForm.url"
            placeholder="请输入 https:// 开头的链接"
          />
        </Form.Item>
        <Form.Item label="封面图片 URL">
          <Input
            v-model:value="linkForm.picurl"
            placeholder="请输入封面图片链接（选填）"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Miniprogram Modal -->
    <Modal
      v-model:open="miniprogramModalVisible"
      title="添加小程序"
      :width="500"
      @ok="handleMiniprogramConfirm"
    >
      <Form layout="vertical">
        <Form.Item label="标题" required>
          <Input
            v-model:value="miniprogramForm.title"
            placeholder="请输入小程序标题"
            :maxlength="64"
          />
        </Form.Item>
        <Form.Item label="AppID" required>
          <Input
            v-model:value="miniprogramForm.appid"
            placeholder="请输入小程序 AppID（wx开头18位）"
          />
          <div class="mt-1 text-xs text-gray-400">
            格式：wx + 16位字母数字，如 wxabcdef1234567890
          </div>
        </Form.Item>
        <Form.Item label="页面路径" required>
          <Input
            v-model:value="miniprogramForm.page"
            placeholder="请输入页面路径，如 pages/index/index"
          />
        </Form.Item>
        <Form.Item label="封面图片">
          <div class="flex items-center gap-4">
            <Upload
              accept="image/*"
              :show-upload-list="false"
              :before-upload="handleMiniprogramCoverUpload"
            >
              <Button :loading="miniprogramCoverUploading">
                <CloudUploadOutlined />
                上传封面
              </Button>
            </Upload>
            <Image
              v-if="miniprogramForm.picUrl"
              :src="miniprogramForm.picUrl"
              :width="60"
              :height="60"
              class="rounded"
            />
          </div>
          <div class="mt-1 text-xs text-gray-400">
            建议尺寸：520x416 像素，最大 2MB
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <!-- Media Library Modal -->
    <MediaLibraryModal
      v-model:open="mediaLibraryVisible"
      :type="mediaLibraryType"
      :multiple="true"
      :max-count="remainingCount"
      @select="handleMediaLibrarySelect"
    />
  </div>
</template>

<style scoped>
.attachment-editor :deep(.ant-card) {
  transition: all 0.2s;
}

.attachment-editor :deep(.ant-card:hover) {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgb(24 144 255 / 15%);
}
</style>
