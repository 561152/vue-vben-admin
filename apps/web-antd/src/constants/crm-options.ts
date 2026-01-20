/**
 * CRM 模块通用选项配置
 * 统一管理状态、来源、等级等选项，避免重复定义
 */

// ==================== 类型定义 ====================

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

// ==================== 消息状态 ====================

/**
 * 直发消息状态选项
 */
export const messageStatusOptions: SelectOption[] = [
  { value: 'PENDING', label: '待发送', color: 'default' },
  { value: 'SENDING', label: '发送中', color: 'processing' },
  { value: 'SENT', label: '已发送', color: 'success' },
  { value: 'DELIVERED', label: '已送达', color: 'success' },
  { value: 'FAILED', label: '发送失败', color: 'error' },
];

/**
 * 消息类型选项
 */
export const messageTypeOptions: SelectOption[] = [
  { value: 'SINGLE', label: '单发', color: 'blue' },
  { value: 'EMPLOYEE_BATCH', label: '员工批量', color: 'purple' },
  { value: 'TEST', label: '测试', color: 'orange' },
  { value: 'WELCOME', label: '欢迎语', color: 'green' },
];

// ==================== 客户状态 ====================

/**
 * 客户状态选项
 */
export const customerStatusOptions: SelectOption[] = [
  { value: 'LEAD', label: '潜在客户', color: 'blue' },
  { value: 'OPPORTUNITY', label: '商机', color: 'orange' },
  { value: 'CUSTOMER', label: '成交客户', color: 'green' },
  { value: 'LOST', label: '已流失', color: 'red' },
  { value: 'INVALID', label: '无效客户', color: 'default' },
];

/**
 * 客户来源选项
 */
export const customerSourceOptions: SelectOption[] = [
  { value: 'MANUAL', label: '手动录入', color: 'default' },
  { value: 'WECOM', label: '企业微信', color: 'green' },
  { value: 'IMPORT', label: '批量导入', color: 'blue' },
  { value: 'WEBSITE', label: '官网表单', color: 'purple' },
  { value: 'DOUYIN', label: '抖音', color: 'pink' },
  { value: 'XIAOHONGSHU', label: '小红书', color: 'red' },
  { value: 'WECHAT', label: '微信', color: 'green' },
  { value: 'API', label: 'API', color: 'cyan' },
];

/**
 * 客户等级选项
 */
export const customerLevelOptions: SelectOption[] = [
  { value: 'VIP', label: 'VIP', color: 'gold' },
  { value: 'IMPORTANT', label: '重要客户', color: 'orange' },
  { value: 'NORMAL', label: '普通客户', color: 'blue' },
  { value: 'POTENTIAL', label: '潜在客户', color: 'cyan' },
  { value: 'INACTIVE', label: '不活跃', color: 'default' },
];

/**
 * 客户性别选项
 */
export const genderOptions: SelectOption[] = [
  { value: 'MALE', label: '男', color: 'blue' },
  { value: 'FEMALE', label: '女', color: 'pink' },
  { value: 'UNKNOWN', label: '未知', color: 'default' },
];

// ==================== 跟进状态 ====================

/**
 * 跟进状态选项
 */
export const followUpStatusOptions: SelectOption[] = [
  { value: 'PENDING', label: '待处理', color: 'processing' },
  { value: 'OVERDUE', label: '已逾期', color: 'error' },
  { value: 'COMPLETED', label: '已完成', color: 'success' },
];

/**
 * 跟进类型选项
 */
export const followUpTypeOptions: SelectOption[] = [
  { value: 'PHONE', label: '电话', color: 'blue' },
  { value: 'WECHAT', label: '微信', color: 'green' },
  { value: 'VISIT', label: '拜访', color: 'purple' },
  { value: 'EMAIL', label: '邮件', color: 'cyan' },
  { value: 'OTHER', label: '其他', color: 'default' },
];

// ==================== 营销活动 ====================

/**
 * 活动状态选项
 */
export const campaignStatusOptions: SelectOption[] = [
  { value: 'DRAFT', label: '草稿', color: 'default' },
  { value: 'SCHEDULED', label: '已计划', color: 'processing' },
  { value: 'RUNNING', label: '进行中', color: 'success' },
  { value: 'PAUSED', label: '已暂停', color: 'warning' },
  { value: 'COMPLETED', label: '已完成', color: 'default' },
  { value: 'CANCELLED', label: '已取消', color: 'error' },
];

/**
 * 活动类型选项
 */
export const campaignTypeOptions: SelectOption[] = [
  { value: 'MASS_MESSAGE', label: '群发消息', color: 'blue' },
  { value: 'WELCOME', label: '欢迎语', color: 'green' },
  { value: 'MOMENTS', label: '朋友圈', color: 'purple' },
  { value: 'GROUP_MESSAGE', label: '群消息', color: 'orange' },
];

// ==================== 标签相关 ====================

/**
 * 标签类型选项
 */
export const tagTypeOptions: SelectOption[] = [
  { value: 'SYSTEM', label: '系统标签', color: 'blue' },
  { value: 'CUSTOM', label: '自定义标签', color: 'green' },
  { value: 'AUTO', label: '自动标签', color: 'purple' },
];

// ==================== 素材类型 ====================

/**
 * 素材类型选项
 */
export const mediaTypeOptions: SelectOption[] = [
  { value: 'IMAGE', label: '图片', color: 'blue' },
  { value: 'VIDEO', label: '视频', color: 'purple' },
  { value: 'FILE', label: '文件', color: 'default' },
  { value: 'MINIPROGRAM_COVER', label: '小程序封面', color: 'green' },
];

// ==================== 模板相关 ====================

/**
 * 消息模板分类选项
 */
export const templateCategoryOptions: SelectOption[] = [
  { value: 'WELCOME', label: '欢迎语', color: 'green' },
  { value: 'PROMOTION', label: '促销', color: 'orange' },
  { value: 'NOTIFICATION', label: '通知', color: 'blue' },
  { value: 'REMINDER', label: '提醒', color: 'cyan' },
  { value: 'OTHER', label: '其他', color: 'default' },
];

// ==================== 工具函数 ====================

/**
 * 根据值查找选项
 */
export function findOption(
  options: SelectOption[],
  value: string,
): SelectOption | undefined {
  return options.find((o) => o.value === value);
}

/**
 * 获取选项的标签
 */
export function getOptionLabel(
  options: SelectOption[],
  value: string,
): string {
  return findOption(options, value)?.label || value;
}

/**
 * 获取选项的颜色
 */
export function getOptionColor(
  options: SelectOption[],
  value: string,
): string {
  return findOption(options, value)?.color || 'default';
}

/**
 * 为 Select 组件添加"全部"选项
 */
export function withAllOption(
  options: SelectOption[],
  allLabel = '全部',
): SelectOption[] {
  return [{ value: '', label: allLabel }, ...options];
}
