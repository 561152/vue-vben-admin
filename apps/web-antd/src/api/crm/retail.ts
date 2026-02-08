import { requestClient } from '#/api/request';

// ==================== Types ====================

export interface MemberLevelStat {
  level: string;
  count: number;
  percentage: number;
  avgPurchaseAmount: number;
  avgOrders: number;
  avgPointsBalance: number;
}

export interface MemberStatsResponse {
  stats: MemberLevelStat[];
  total: number;
  timestamp: string;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  customerId: string;
  customerName: string;
  referralCode: string;
  referralCount: number;
  successfulReferrals: number;
  totalRewardPoints: number;
}

export interface ReferralLeaderboardResponse {
  leaderboard: ReferralLeaderboardEntry[];
  timestamp: string;
}

export interface SopStats {
  sopCode: string;
  sopName: string;
  totalCustomers: number;
  inProgress: number;
  completed: number;
  abandoned: number;
  completionRate: number;
  avgCompletionDays: number;
  stepStats: unknown[];
}

export interface CustomerSopProgress {
  customerId: string;
  customerName: string;
  sopProgress: Record<
    string,
    {
      status: string;
      startedAt?: string;
      completedAt?: string;
      currentStep?: number;
    }
  >;
}

export interface ReferralRelationship {
  referredCustomerId: string;
  referredCustomerName: string;
  referredAt: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
}

export interface ReferralRelationshipsResponse {
  customerId: string;
  referralCode: string;
  referralCount: number;
  referrals: ReferralRelationship[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerateReferralCodeResponse {
  customerId: string;
  referralCode: string;
  referralUrl: string;
  createdAt: string;
}

export interface StartSopResponse {
  success: boolean;
  started: number;
  message: string;
}

// ==================== Retail API ====================

/**
 * Get member level statistics
 */
export async function getMemberStats(params?: { levels?: string[] }) {
  return requestClient.get<MemberStatsResponse>('/marketing/retail/member-stats', {
    params,
  });
}

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(params?: { limit?: number }) {
  return requestClient.get<ReferralLeaderboardResponse>(
    '/marketing/retail/referral/leaderboard',
    { params },
  );
}

/**
 * Get SOP statistics
 */
export async function getSopStats(sopCode: string) {
  return requestClient.get<SopStats>(`/crm/retail/sop/${sopCode}/stats`);
}

/**
 * Start customer SOP
 */
export async function startCustomerSop(data: {
  customerIds: string[];
  sopCode: string;
}) {
  return requestClient.post<StartSopResponse>('/marketing/retail/sop/start', data);
}

/**
 * Get customer SOP progress
 */
export async function getCustomerSopProgress(
  customerId: string,
  sopCode?: string,
) {
  const params = sopCode ? { sopCode } : {};
  return requestClient.get<CustomerSopProgress>(
    `/crm/retail/sop/progress/${customerId}`,
    { params },
  );
}

/**
 * Generate referral code for customer
 */
export async function generateReferralCode(customerId: string) {
  return requestClient.post<GenerateReferralCodeResponse>(
    '/marketing/retail/referral/generate',
    { customerId },
  );
}

/**
 * Get customer referral relationships
 */
export async function getReferralRelationships(
  customerId: string,
  params?: { page?: number; pageSize?: number },
) {
  return requestClient.get<ReferralRelationshipsResponse>(
    `/crm/retail/referral/relationships/${customerId}`,
    { params },
  );
}
