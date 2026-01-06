import { requestClient } from '#/api/request';

// ==================== Types ====================

export interface Customer {
  id: number;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender: string;
  company?: string;
  position?: string;
  status: string;
  lifecycleStage: string;
  source: string;
  customerLevel: string;
  rfmScore: number;
  churnRisk: string;
  totalAmount: number;
  orderCount: number;
  totalInteractions: number;
  lastActiveAt?: string;
  lastContactAt?: string;
  ownerName?: string;
  channelCount: number;
  createdAt: string;
}

export interface CustomerChannel {
  id: number;
  channelType: string;
  channelUserId: string;
  channelUsername?: string;
  channelAvatar?: string;
  isFollowing: boolean;
  messageCount: number;
  lastMessageAt?: string;
  followedAt?: string;
  createdAt: string;
}

export interface CustomerActivity {
  id: number;
  customerId: number;
  activityType: string;
  channelType?: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  operatorName?: string;
  createdAt: string;
}

export interface FollowUp {
  id: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  userId: number;
  userName?: string;
  type: string;
  content: string;
  nextPlanAt?: string;
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED';
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpStats {
  total: number;
  todayCount: number;
  pendingCount: number;
  overdueCount: number;
  byType: Record<string, number>;
  recentDays: { date: string; count: number }[];
}

export interface TodayFollowUp {
  today: FollowUp[];
  overdue: FollowUp[];
  upcoming: FollowUp[];
  stats: {
    todayCount: number;
    overdueCount: number;
    upcomingCount: number;
  };
}

export interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  recentCount: number;
  todayCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

// ==================== Customer API ====================

export async function getCustomers(params?: Record<string, unknown>) {
  return requestClient.get<PaginatedResponse<Customer>>('/customers', { params });
}

export async function getCustomer(id: number) {
  return requestClient.get<Customer>(`/customers/${id}`);
}

export async function createCustomer(data: Partial<Customer>) {
  return requestClient.post<Customer>('/customers', data);
}

export async function updateCustomer(id: number, data: Partial<Customer>) {
  return requestClient.put<Customer>(`/customers/${id}`, data);
}

export async function deleteCustomer(id: number) {
  return requestClient.delete(`/customers/${id}`);
}

// ==================== Customer Channel API ====================

export async function getCustomerChannels(customerId: number) {
  return requestClient.get<CustomerChannel[]>(`/customer-channels/customer/${customerId}`);
}

export async function getChannelStats() {
  return requestClient.get<Record<string, unknown>>('/customer-channels/stats');
}

// ==================== Customer Activity API ====================

export async function getCustomerTimeline(customerId: number, params?: { limit?: number; offset?: number }) {
  return requestClient.get<{
    customerId: number;
    activities: CustomerActivity[];
    total: number;
    hasMore: boolean;
  }>(`/customer-activities/customer/${customerId}/timeline`, { params });
}

export async function getActivityStats(customerId?: number) {
  const params = customerId ? { customerId } : {};
  return requestClient.get<ActivityStats>('/customer-activities/stats', { params });
}

export async function createActivity(data: {
  customerId: number;
  activityType: string;
  title: string;
  content?: string;
  channelType?: string;
  metadata?: Record<string, unknown>;
}) {
  return requestClient.post<CustomerActivity>('/customer-activities', data);
}

// ==================== Follow-up API ====================

export async function getFollowUps(params?: Record<string, unknown>) {
  return requestClient.get<PaginatedResponse<FollowUp>>('/follow-ups', { params });
}

export async function getFollowUp(id: number) {
  return requestClient.get<FollowUp>(`/follow-ups/${id}`);
}

export async function getCustomerFollowUps(customerId: number, params?: { page?: number; pageSize?: number }) {
  return requestClient.get<PaginatedResponse<FollowUp>>(`/follow-ups/customer/${customerId}`, { params });
}

export async function getTodayFollowUps() {
  return requestClient.get<TodayFollowUp>('/follow-ups/today');
}

export async function getPendingFollowUps(params?: { includeOverdue?: boolean; daysAhead?: number; limit?: number }) {
  return requestClient.get<FollowUp[]>('/follow-ups/pending', { params });
}

export async function getFollowUpStats(customerId?: number) {
  const params = customerId ? { customerId } : {};
  return requestClient.get<FollowUpStats>('/follow-ups/stats', { params });
}

export async function createFollowUp(data: {
  customerId: number;
  type?: string;
  content: string;
  nextPlanAt?: string;
}) {
  return requestClient.post<FollowUp>('/follow-ups', data);
}

export async function updateFollowUp(id: number, data: {
  type?: string;
  content?: string;
  nextPlanAt?: string | null;
}) {
  return requestClient.put<FollowUp>(`/follow-ups/${id}`, data);
}

export async function markFollowUpCompleted(id: number) {
  return requestClient.put<FollowUp>(`/follow-ups/${id}/complete`);
}

export async function deleteFollowUp(id: number) {
  return requestClient.delete(`/follow-ups/${id}`);
}
