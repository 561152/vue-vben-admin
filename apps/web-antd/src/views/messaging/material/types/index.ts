// ==================== 素材库类型定义 ====================

import type { Dayjs } from 'dayjs';

export type MaterialType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'LINK'
  | 'FILE'
  | 'MIXED';

export type MaterialStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface MaterialItem {
  id: number;
  name: string;
  description: string | null;
  type: MaterialType;
  content: string | null;
  mediaIds: number[];
  mediaUrls?: string[];
  linkUrl: string | null;
  linkTitle: string | null;
  categoryId: number | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  usageCount: number;
  likeCount: number;
  status: MaterialStatus;
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  children?: CategoryItem[];
  materialCount?: number;
}

export interface MaterialFormState {
  name: string;
  description: string;
  type: MaterialType;
  content: string;
  mediaIds: number[];
  linkUrl: string;
  linkTitle: string;
  categoryId: number | null;
  tags: string[];
  isPublic: boolean;
}

export interface MaterialFilters {
  keyword?: string;
  type?: MaterialType;
  status?: MaterialStatus;
  categoryId?: number | null;
  tags?: string[];
  dateRange?: [Dayjs, Dayjs];
  minUsageCount?: number;
  maxUsageCount?: number;
  sortBy?: 'updatedAt' | 'usageCount' | 'viewCount' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface VersionItem {
  id: number;
  materialId: number;
  version: number;
  name: string;
  content: string | null;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changeSummary: string | null;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
}

export interface UsageRecord {
  id: number;
  materialId: number;
  materialName: string;
  usageType:
    | 'MASS_MESSAGE'
    | 'MOMENT'
    | 'DIRECT_MESSAGE'
    | 'SCHEDULED_MESSAGE'
    | 'TEMPLATE'
    | 'CAMPAIGN'
    | 'OTHER';
  targetId: string | null;
  targetName: string | null;
  createdAt: string;
}

export interface SimilarMaterial {
  id: number;
  name: string;
  type: MaterialType;
  similarityScore: number;
  similarityReason: string;
}

export interface RecommendedMaterial {
  id: number;
  name: string;
  type: MaterialType;
  score: number;
  reason: string;
  tags: string[];
  usageCount: number;
}

// 常量定义
export const MATERIAL_TYPE_CONFIG: Record<
  MaterialType,
  { label: string; color: string; icon: string }
> = {
  TEXT: { label: '文本', color: '#595959', icon: 'FileTextOutlined' },
  IMAGE: { label: '图片', color: '#52c41a', icon: 'PictureOutlined' },
  VIDEO: { label: '视频', color: '#722ed1', icon: 'VideoCameraOutlined' },
  LINK: { label: '链接', color: '#1890ff', icon: 'LinkOutlined' },
  FILE: { label: '文件', color: '#fa8c16', icon: 'FileOutlined' },
  MIXED: { label: '图文', color: '#13c2c2', icon: 'FolderOutlined' },
};

export const MATERIAL_STATUS_CONFIG: Record<
  MaterialStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: '草稿', color: '#bfbfbf' },
  ACTIVE: { label: '启用', color: '#52c41a' },
  ARCHIVED: { label: '归档', color: '#8c8c8c' },
};

export const USAGE_TYPE_LABELS: Record<string, string> = {
  MASS_MESSAGE: '群发消息',
  MOMENT: '朋友圈',
  DIRECT_MESSAGE: '直发消息',
  SCHEDULED_MESSAGE: '定时消息',
  TEMPLATE: '消息模板',
  CAMPAIGN: '营销活动',
  OTHER: '其他',
};

export const SORT_OPTIONS = [
  { key: 'updatedAt', label: '最近更新', defaultOrder: 'desc' },
  { key: 'createdAt', label: '最新创建', defaultOrder: 'desc' },
  { key: 'usageCount', label: '使用次数', defaultOrder: 'desc' },
  { key: 'viewCount', label: '浏览次数', defaultOrder: 'desc' },
  { key: 'name', label: '名称', defaultOrder: 'asc' },
] as const;
